import { useState } from 'react'

// Emoji-Fallback, solange keine eigenen PNGs unter public/icons/<name>.png liegen.
// Eigene Icons einbinden: einfach eine 24x24 (oder größer, quadratisch) PNG-Datei
// mit exakt diesem Namen in den public/icons/-Ordner legen, z.B. public/icons/labels.png
const EMOJI_FALLBACK = {
  labels: '🏷',
  automations: '⚡',
  members: '👥',
  settings: '⚙',
  theme_dark: '☾',
  theme_light: '☀',
  edit: '✎',
  search: '🔍',
}

export default function Icon({ name, size = 17 }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span style={{ fontSize: size, lineHeight: 1 }}>{EMOJI_FALLBACK[name] || '•'}</span>
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/${name}.png`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      onError={() => setFailed(true)}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
