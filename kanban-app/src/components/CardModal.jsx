import { useState, useEffect, useRef } from 'react'

export default function CardModal({ card, labels, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState(card.dueDate || '')
  const [labelIds, setLabelIds] = useState(card.labelIds || [])
  const saveTimeout = useRef(null)

  // Autosave mit kurzem Debounce, damit nicht bei jedem Tastendruck geschrieben wird
  useEffect(() => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      onSave({ title, description, dueDate: dueDate || null, labelIds })
    }, 500)
    return () => clearTimeout(saveTimeout.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, dueDate, labelIds])

  function toggleLabel(id) {
    setLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleDelete() {
    if (confirm('Karte löschen?')) onDelete()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.titleInput}
          placeholder="Titel"
        />

        <label className="field-label" style={{ marginTop: 18 }}>Fällig am</label>
        <input
          type="date"
          className="text-input"
          value={dueDate || ''}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 200 }}
        />

        <label className="field-label">Labels</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {labels.map((l) => (
            <button
              key={l.id}
              onClick={() => toggleLabel(l.id)}
              style={{
                ...styles.labelBtn,
                background: l.color,
                opacity: labelIds.includes(l.id) ? 1 : 0.4,
                outline: labelIds.includes(l.id) ? '2px solid var(--paper)' : 'none',
              }}
            >
              {l.name}
            </button>
          ))}
        </div>

        <label className="field-label">Beschreibung</label>
        <textarea
          className="text-input"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details, Notizen, Links …"
          style={{ resize: 'vertical', marginBottom: 20 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn-danger" onClick={handleDelete}>Karte löschen</button>
          <button className="btn-ghost" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  titleInput: {
    width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--line)',
    color: 'var(--paper)', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
    padding: '4px 0 10px', marginBottom: 4,
  },
  labelBtn: {
    fontSize: 11, fontWeight: 700, color: '#fff', padding: '5px 10px', borderRadius: 4,
    textTransform: 'uppercase', letterSpacing: '0.03em',
  },
}
