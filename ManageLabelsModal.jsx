import { useState } from 'react'
import { updateBoard } from '../lib/firestore'

const PALETTE = [
  '#6b8f71', '#d4a017', '#c1502e', '#4c6b8a', '#6e4b69',
  '#8a9a5b', '#b0563d', '#3d5a78', '#a4574a', '#5b6b73',
]

export default function ManageLabelsModal({ board, onClose }) {
  const [labels, setLabels] = useState(board.labels || [])
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0])

  async function persist(next) {
    setLabels(next)
    await updateBoard(board.id, { labels: next })
  }

  function addLabel(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const label = { id: crypto.randomUUID(), name: newName.trim(), color: newColor }
    persist([...labels, label])
    setNewName('')
  }

  function renameLabel(id, name) {
    persist(labels.map((l) => (l.id === id ? { ...l, name } : l)))
  }

  function recolorLabel(id, color) {
    persist(labels.map((l) => (l.id === id ? { ...l, color } : l)))
  }

  function deleteLabel(id) {
    persist(labels.filter((l) => l.id !== id))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Kategorien verwalten</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {labels.map((l) => (
            <div key={l.id} style={styles.row}>
              <input
                type="color"
                value={l.color}
                onChange={(e) => recolorLabel(l.id, e.target.value)}
                style={styles.colorInput}
              />
              <input
                className="text-input"
                value={l.name}
                onChange={(e) => renameLabel(l.id, e.target.value)}
                style={{ flex: 1 }}
              />
              <button style={styles.deleteBtn} onClick={() => deleteLabel(l.id)}>×</button>
            </div>
          ))}
          {labels.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Kategorien. Leg unten eine an.</p>
          )}
        </div>

        <label className="field-label">Neue Kategorie</label>
        <form onSubmit={addLabel} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            className="text-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name …"
            style={{ flex: 1 }}
          />
          <button className="btn" type="submit">+</button>
        </form>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              style={{
                width: 24, height: 24, borderRadius: 5, background: c,
                border: newColor === c ? '2px solid var(--text-primary)' : '2px solid transparent',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Fertig</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  colorInput: { width: 32, height: 32, padding: 0, border: 'none', borderRadius: 6, background: 'none', cursor: 'pointer' },
  deleteBtn: { background: 'none', color: 'var(--muted)', fontSize: 18, padding: '0 6px' },
}
