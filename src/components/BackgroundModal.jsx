import { useState } from 'react'
import { updateBoard } from '../lib/firestore'

const PALETTE = [
  null, '#26272b', '#2e2320', '#20262b', '#1f2a20', '#2b2436', '#3a2222', '#22303a',
]

export default function BackgroundModal({ board, onClose }) {
  const bg = board.background || { type: 'color', value: null }
  const [type, setType] = useState(bg.type || 'color')
  const [color, setColor] = useState(bg.type === 'color' ? bg.value : null)
  const [imageUrl, setImageUrl] = useState(bg.type === 'image' ? bg.value : '')

  async function save() {
    const value = type === 'color' ? color : imageUrl.trim()
    await updateBoard(board.id, { background: { type, value: value || null } })
    onClose()
  }

  async function reset() {
    await updateBoard(board.id, { background: null })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Hintergrund</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={type === 'color' ? 'btn' : 'btn-ghost'}
            onClick={() => setType('color')}
            style={{ flex: 1 }}
          >
            Farbe
          </button>
          <button
            className={type === 'image' ? 'btn' : 'btn-ghost'}
            onClick={() => setType('image')}
            style={{ flex: 1 }}
          >
            Bild-Link
          </button>
        </div>

        {type === 'color' ? (
          <>
            <label className="field-label">Voreingestellt</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {PALETTE.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColor(c)}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    background: c || 'var(--board-felt)',
                    border: color === c ? '2px solid var(--accent-amber)' : '2px solid var(--line)',
                  }}
                  title={c || 'Standard'}
                />
              ))}
            </div>
            <label className="field-label">Eigene Farbe</label>
            <input
              type="color"
              value={color || '#26272b'}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 48, height: 32, border: 'none', borderRadius: 6, background: 'none', cursor: 'pointer', marginBottom: 20 }}
            />
          </>
        ) : (
          <>
            <label className="field-label">Bild-URL (z.B. ein direkter .png/.jpg-Link)</label>
            <input
              className="text-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…/bild.jpg"
              style={{ marginBottom: 10 }}
            />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Muss ein öffentlich erreichbarer Bildlink sein (z.B. von Unsplash, Imgur, oder
              einem eigenen Hoster). Direktes Hochladen geht ohne Firebase Storage
              (kostenpflichtig) leider nicht.
            </p>
            {imageUrl && (
              <div style={{
                height: 100, borderRadius: 8, backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 16,
                border: '1px solid var(--line)',
              }} />
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn-ghost" onClick={reset}>Zurücksetzen</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
            <button className="btn" onClick={save}>Speichern</button>
          </div>
        </div>
      </div>
    </div>
  )
}
