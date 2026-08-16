const COLORS = ['#4c6b8a', '#c1502e', '#6b8f71', '#d4a017', '#6e4b69', '#3d5a78']

function colorFor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function AvatarBubble({ email, photoURL, size = 28, overlap = false }) {
  const initial = (email || '?')[0].toUpperCase()
  const marginLeft = overlap ? -8 : 0

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={email}
        title={email}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          border: '2px solid var(--bg-surface)', marginLeft,
        }}
      />
    )
  }

  return (
    <div
      title={email}
      style={{
        width: size, height: size, borderRadius: '50%', background: colorFor(email || ''),
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 700, border: '2px solid var(--bg-surface)',
        marginLeft, flexShrink: 0,
      }}
    >
      {initial}
    </div>
  )
}
