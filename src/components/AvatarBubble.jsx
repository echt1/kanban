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
export default function AvatarBubble({ email, photoURL, size = 28, overlap = false, online, lastSeen }) {
  const initial = (email || '?')[0].toUpperCase()
  const showPresence = online !== undefined
  const dim = showPresence && !online
  const title = showPresence ? `${email} — ${online ? 'Online' : formatLastSeen(lastSeen)}` : email

  const visualStyle = {
    width: size, height: size, borderRadius: '50%',
    border: '2px solid var(--bg-surface)', display: 'block',
    opacity: dim ? 0.35 : 1, filter: dim ? 'grayscale(1)' : 'none',
    transition: 'opacity 0.15s ease, filter 0.15s ease',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginLeft: overlap ? -8 : 0, flexShrink: 0 }} title={title}>
      {photoURL ? (
        <img src={photoURL} alt={email} style={{ ...visualStyle, objectFit: 'cover' }} />
      ) : (
        <div style={{
          ...visualStyle, background: colorFor(email || ''), color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.42, fontWeight: 700,
        }}>
          {initial}
        </div>
      )}
    </div>
  )
}
