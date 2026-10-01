import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '../firebase'
import { sdk, clientId, readyPromise, workerUrl } from '../discord'

// Merkt sich Infos zur aktuellen Discord-Sitzung (nur im Speicher)
export const discordSession = { accessToken: null, discord: null, linked: false }

async function post(path, body, headers = {}) {
  if (!workerUrl) throw new Error('VITE_AUTH_WORKER_URL ist nicht gesetzt')
  const res = await fetch(`${workerUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body || {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Fehler ${res.status}`)
  return data
}

// Läuft in der Discord-Aktivität: Discord fragen wer man ist, Worker tauscht das in einen Firebase-Login.
export async function discordLogin() {
  await readyPromise
  const { code } = await sdk.commands.authorize({
    client_id: clientId,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify'],
  })
  const data = await post('/discord/login', { code })
  discordSession.accessToken = data.accessToken
  discordSession.discord = data.discord
  discordSession.linked = data.linked
  await signInWithCustomToken(auth, data.customToken)
}

// Läuft im normalen Browser (mit Google eingeloggt): erzeugt einen Code zum Verknüpfen.
export async function createLinkCode() {
  const idToken = await auth.currentUser.getIdToken()
  return post('/link/create', {}, { Authorization: `Bearer ${idToken}` })
}

// Läuft in Discord: löst den Code ein und wechselt auf das verknüpfte Konto.
export async function redeemLinkCode(code) {
  const data = await post('/link/redeem', { code, accessToken: discordSession.accessToken })
  discordSession.linked = true
  await signInWithCustomToken(auth, data.customToken)
}
