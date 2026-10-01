// Kanban Discord-Auth Worker (Cloudflare Workers, Modul-Syntax)
//
// Aufgaben:
//  1. /discord/login  : Discord-OAuth-Code -> Firebase Custom Token (verknüpft oder neues Konto)
//  2. /link/create    : (Browser, Google-Login) erzeugt einen Verknüpfungscode
//  3. /link/redeem    : (Discord) löst den Code ein und verknüpft Discord-ID <-> Firebase-UID
//
// Benötigte Einstellungen im Cloudflare-Dashboard:
//  - KV-Binding:  LINKS
//  - Secret:      DISCORD_CLIENT_SECRET
//  - Secret:      FIREBASE_SERVICE_ACCOUNT  (kompletter Inhalt der JSON-Datei)
//  - Variable:    DISCORD_CLIENT_ID

const enc = new TextEncoder()
const DISCORD_API = 'https://discord.com/api'
const CUSTOM_TOKEN_AUD =
  'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'
const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    try {
      if (request.method !== 'POST') throw new HttpError(405, 'Nur POST erlaubt')
      const path = new URL(request.url).pathname
      const body = await request.json().catch(() => ({}))
      if (path === '/discord/login') return json(await handleLogin(env, body))
      if (path === '/link/create') return json(await handleLinkCreate(env, request))
      if (path === '/link/redeem') return json(await handleLinkRedeem(env, body))
      throw new HttpError(404, 'Unbekannter Pfad')
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status)
      console.error(e)
      return json({ error: 'Interner Fehler im Auth-Worker' }, 500)
    }
  },
}

/* ---------- Handler ---------- */

async function handleLogin(env, body) {
  if (!body.code) throw new HttpError(400, 'code fehlt')
  const accessToken = await discordExchangeCode(env, body.code)
  const du = await discordMe(accessToken)
  const link = await env.LINKS.get(`link:${du.id}`, 'json')
  const identity = link || { uid: `discord_${du.id}`, email: `discord_${du.id}@discord.invalid` }
  return {
    customToken: await mintCustomToken(env, identity, du),
    accessToken,
    linked: !!link,
    discord: publicDiscord(du),
  }
}

async function handleLinkCreate(env, request) {
  const auth = request.headers.get('Authorization') || ''
  const idToken = auth.replace(/^Bearer\s+/i, '')
  if (!idToken) throw new HttpError(401, 'Nicht angemeldet')
  const sa = getServiceAccount(env)
  const payload = await verifyFirebaseIdToken(idToken, sa.project_id)
  if (payload.firebase?.sign_in_provider === 'custom') {
    throw new HttpError(400, 'Bitte im normalen Browser mit deinem Hauptkonto anmelden')
  }
  if (!payload.email) throw new HttpError(400, 'Dein Konto hat keine E-Mail')

  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const code = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
  await env.LINKS.put(
    `code:${code}`,
    JSON.stringify({ uid: payload.user_id || payload.sub, email: payload.email }),
    { expirationTtl: 600 },
  )
  return { code, expiresInMinutes: 10 }
}

async function handleLinkRedeem(env, body) {
  if (!body.code || !body.accessToken) throw new HttpError(400, 'code oder accessToken fehlt')
  const du = await discordMe(body.accessToken)
  const key = `code:${String(body.code).trim().toUpperCase()}`
  const entry = await env.LINKS.get(key, 'json')
  if (!entry) throw new HttpError(400, 'Code ungültig oder abgelaufen')
  await env.LINKS.put(`link:${du.id}`, JSON.stringify(entry))
  await env.LINKS.delete(key)
  return {
    customToken: await mintCustomToken(env, entry, du),
    linked: true,
    discord: publicDiscord(du),
  }
}

/* ---------- Discord ---------- */

async function discordExchangeCode(env, code) {
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    }),
  })
  if (!res.ok) throw new HttpError(401, 'Discord hat den Login abgelehnt')
  return (await res.json()).access_token
}

async function discordMe(accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new HttpError(401, 'Discord-Token ungültig')
  return res.json()
}

function publicDiscord(du) {
  return {
    id: du.id,
    name: du.global_name || du.username,
    avatar: du.avatar
      ? `https://cdn.discordapp.com/avatars/${du.id}/${du.avatar}.png?size=64`
      : null,
  }
}

/* ---------- Firebase: Custom Token erzeugen ---------- */

function getServiceAccount(env) {
  try {
    return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT ist kein gültiges JSON')
  }
}

function b64u(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const b64uText = (t) => b64u(enc.encode(t))
function b64uToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

async function importPrivateKey(pem) {
  const der = b64uToBytes(
    pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '').replace(/\+/g, '-').replace(/\//g, '_'),
  )
  return crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  )
}

async function mintCustomToken(env, identity, du) {
  const sa = getServiceAccount(env)
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: CUSTOM_TOKEN_AUD,
    iat: now,
    exp: now + 3600,
    uid: identity.uid,
    claims: { email: identity.email, email_verified: true, discordId: du.id },
  }
  const input = `${b64uText(JSON.stringify(header))}.${b64uText(JSON.stringify(payload))}`
  const key = await importPrivateKey(sa.private_key)
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(input))
  return `${input}.${b64u(sig)}`
}

/* ---------- Firebase: ID-Token prüfen ---------- */

async function verifyFirebaseIdToken(token, projectId) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new HttpError(401, 'Token ungültig')
  const header = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[0])))
  const payload = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[1])))

  const jwks = await (await fetch(JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } })).json()
  const jwk = jwks.keys.find((k) => k.kid === header.kid)
  if (!jwk) throw new HttpError(401, 'Token-Schlüssel unbekannt')
  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
  )
  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, b64uToBytes(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`),
  )
  const now = Math.floor(Date.now() / 1000)
  if (
    !ok ||
    header.alg !== 'RS256' ||
    payload.aud !== projectId ||
    payload.iss !== `https://securetoken.google.com/${projectId}` ||
    payload.exp < now ||
    !payload.sub
  ) {
    throw new HttpError(401, 'Token ungültig')
  }
  return payload
}
