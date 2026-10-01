import { useState } from 'react'
import { imgUrl } from '../discord'

const COLORS = ['#4c6b8a', '#c1502e', '#6b8f71', '#d4a017', '#6e4b69', '#3d5a78']

function colorFor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function formatLastSeen(ms) {
  if (!ms) return 'Noch nie online'
  const diff = Date.now() - ms
  if (diff < 60000) return 'Online'
  if (diff < 3600000) return `Zuletzt online vor ${Math.round(diff / 60000)} Min.`
  if (diff < 86400000) return `Zuletzt online vor ${Math.round(diff / 3600000)} Std.`
  return `Zuletzt online vor ${Math.round(diff / 86400000)} Tag(en)`
}

// Zeigt einen Nutzer als Kreis: Foto falls vorhanden, sonst Anfangsbuchstabe.
// Wenn `online` explizit übergeben wird (true/false), wird zusätzlich ein
// Online/Offline-Zustand mit Tooltip dargestellt (ausgegraut wenn offline).
// Kleines Discord-Abzeichen unten rechts. Eigenes Icon: public/icons/discord.png oder discord.svg ersetzen.
function DiscordBadge({ size }) {
  const [step, setStep] = useState(0) // 0 = png, 1 = svg, 2 = Farbpunkt
  const d = Math.max(12, Math.round(size * 0.5))
  const base = import.meta.env.BASE_URL
  const common = { position: 'absolute', right: -4, bottom: -4, width: d, height: d, borderRadius: '50%' }
  if (step === 2) return <span style={{ ...common, background: '#5865F2', border: '2px solid var(--bg-surface)' }} />
  return (
    <img
      src={`${base}icons/discord.${step === 0 ? 'png' : 'svg'}`}
      alt="Discord"
      draggable={false}
      onError={() => setStep(step + 1)}
      style={{ ...common, background: '#5865F2', objectFit: 'contain', padding: 1, boxSizing: 'border-box' }}
    />
  )
}

export default function AvatarBubble({ email, photoURL, size = 28, overlap = false, online, lastSeen, viaDiscord = false }) {
  const initial = (email || '?')[0].toUpperCase()
  const showPresence = online !== undefined
  const dim = showPresence && !online
  const title = showPresence ? `${email} — ${online ? (viaDiscord ? 'Online (über Discord)' : 'Online') : formatLastSeen(lastSeen)}` : email

  const visualStyle = {
    width: size, height: size, borderRadius: '50%',
    border: '2px solid var(--bg-surface)', display: 'block',
    opacity: dim ? 0.35 : 1, filter: dim ? 'grayscale(1)' : 'none',
    transition: 'opacity 0.15s ease, filter 0.15s ease',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginLeft: overlap ? -8 : 0, flexShrink: 0 }} title={title}>
      {photoURL ? (
        <img src={imgUrl(photoURL)} alt={email} style={{ ...visualStyle, objectFit: 'cover' }} />
      ) : (
        <div style={{
          ...visualStyle, background: colorFor(email || ''), color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.42, fontWeight: 700,
        }}>
          {initial}
        </div>
      )}
      {viaDiscord && <DiscordBadge size={size} />}
    </div>
  )
}
