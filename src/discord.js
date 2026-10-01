import { DiscordSDK, patchUrlMappings } from '@discord/embedded-app-sdk'

// Discord hängt beim Start einer Aktivität immer "frame_id" an die URL.
// Damit erkennen wir, ob die App in Discord oder ganz normal im Browser läuft.
export const isDiscord = new URLSearchParams(window.location.search).has('frame_id')

// Die Application-ID steckt im Hostnamen: <APP_ID>.discordsays.com
const clientId = window.location.hostname.split('.')[0]

const workerUrl = import.meta.env.VITE_AUTH_WORKER_URL || ''

let sdk = null

if (isDiscord) {
  // Discord blockiert alle externen Server. Deshalb werden Anfragen an Firebase
  // über Discords Proxy geleitet. Die Prefixe hier MÜSSEN 1:1 so im
  // Discord Developer Portal unter Activities > URL Mappings stehen.
  patchUrlMappings([
    { prefix: '/fb-identity', target: 'identitytoolkit.googleapis.com' },
    { prefix: '/fb-token', target: 'securetoken.googleapis.com' },
    { prefix: '/fb-firestore', target: 'firestore.googleapis.com' },
    // Auth-Worker (Cloudflare) für den Discord-Login
    ...(workerUrl ? [{ prefix: '/auth-api', target: new URL(workerUrl).host }] : []),
  ])
  sdk = new DiscordSDK(clientId)
}

// Sagt Discord "die App ist geladen" (sonst bleibt der Ladebildschirm stehen).
const readyPromise = sdk
  ? sdk.ready().catch((e) => console.error('Discord SDK ready() fehlgeschlagen:', e))
  : Promise.resolve()

export function initDiscord() {
  return readyPromise
}

export { sdk, clientId, readyPromise, workerUrl }

// In Discord sind externe Bilder gesperrt. Deshalb laufen sie über den Worker (/auth-api/img).
export function imgUrl(url) {
  if (!isDiscord || !workerUrl || !url || !/^https?:\/\//i.test(url)) return url
  if (/^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net)\//.test(url)) return url
  return `/.proxy/auth-api/img?url=${encodeURIComponent(url)}`
}
