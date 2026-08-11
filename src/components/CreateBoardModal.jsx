import { useState } from 'react'

const COLORS = ['#4c6b8a', '#c1502e', '#6b8f71', '#d4a017', '#6e4b69']

export default function CreateBoardModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(COLORS[0])

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate(title.trim(), color)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Neues Board</h2>
        <form onSubmit={submit}>
          <label className="field-label">Titel</label>
          <input
            className="text-input"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Studium, Haushalt, Nebenprojekt …"
            style={{ marginBottom: 16 }}
          />
          <label className="field-label">Farbe</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c,
                  border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn">Erstellen</button>
          </div>
        </form>
      </div>
    </div>
  )
}
