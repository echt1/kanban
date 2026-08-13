import { useState } from 'react'

// Legst du später eine Datei public/icons/<name>.png an, wird die automatisch
// verwendet. Bis dahin (oder falls die Datei fehlt/nicht lädt) greift das Emoji.
export default function IconButton({ icon, emoji, title, onClick, className = 'icon-btn' }) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <button className={className} onClick={onClick} title={title} type="button">
      {!imgFailed ? (
        <img
          src={`./icons/${icon}.png`}
          alt=""
          style={{ width: 18, height: 18, objectFit: 'contain', display: 'block' }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{emoji}</span>
      )}
    </button>
  )
}
