import { useState } from 'react'
import { updateBoard } from '../lib/firestore'
import ColorGrid from './ColorGrid'

export default function ManageLabelsModal({ board, onClose }) {
  const [labels, setLabels] = useState(board.labels || [])
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6b8f71')
  const [openPickerId, setOpenPickerId] = useState(null)

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
    setOpenPickerId(null)
  }

  function deleteLabel(id) {
    persist(labels.filter((l) => l.id !== id))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Kategorien verwalten</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
          {labels.map((l) => (
            <div key={l.id}>
              <div style={styles.row}>
                <button
                  type="button"
                  onClick={() => setOpenPickerId(openPickerId === l.id ? null : l.id)}
                  style={{ ...styles.swatchBtn, background: l.color }}
                  title="Farbe ändern"
                />
                <input
                  className="text-input"
                  value={l.name}
                  onChange={(e) => renameLabel(l.id, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button style={styles.deleteBtn} onClick={() => deleteLabel(l.id)}>×</button>
              </div>
              {openPickerId === l.id && (
                <div style={{ padding: '8px 0 4px 40px' }}>
                  <ColorGrid value={l.color} onChange={(c) => recolorLabel(l.id, c)} swatchSize={22} />
                </div>
              )}
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

        <div style={{ marginBottom: 22 }}>
          <ColorGrid value={newColor} onChange={setNewColor} swatchSize={24} />
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
  swatchBtn: { width: 32, height: 32, borderRadius: 6, border: 'none', flexShrink: 0, cursor: 'pointer' },
  deleteBtn: { background: 'none', color: 'var(--muted)', fontSize: 18, padding: '0 6px' },
}
