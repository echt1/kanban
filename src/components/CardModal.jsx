import { useState, useEffect, useRef } from 'react'

export default function CardModal({ card, labels, onClose, onSave, onDelete, onManageLabels }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState(card.dueDate || '')
  const [labelIds, setLabelIds] = useState(card.labelIds || [])
  const [checklist, setChecklist] = useState(card.checklist || [])
  const [newItemText, setNewItemText] = useState('')
  const saveTimeout = useRef(null)

  // Autosave mit kurzem Debounce, damit nicht bei jedem Tastendruck geschrieben wird
  useEffect(() => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      onSave({ title, description, dueDate: dueDate || null, labelIds, checklist })
    }, 500)
    return () => clearTimeout(saveTimeout.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, dueDate, labelIds, checklist])

  function toggleLabel(id) {
    setLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function addChecklistItem(e) {
    e.preventDefault()
    if (!newItemText.trim()) return
    setChecklist((prev) => [...prev, { id: crypto.randomUUID(), text: newItemText.trim(), done: false }])
    setNewItemText('')
  }

  function toggleChecklistItem(id) {
    setChecklist((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)))
  }

  function removeChecklistItem(id) {
    setChecklist((prev) => prev.filter((it) => it.id !== id))
  }

  function handleDelete() {
    if (confirm('Karte löschen?')) onDelete()
  }

  const doneCount = checklist.filter((i) => i.done).length
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            checked={!!card.done}
            onChange={(e) => onSave({ title, description, dueDate: dueDate || null, labelIds, checklist, done: e.target.checked })}
            style={{ width: 18, height: 18, flexShrink: 0 }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ ...styles.titleInput, textDecoration: card.done ? 'line-through' : 'none', flex: 1 }}
            placeholder="Titel"
          />
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>Fällig am</label>
        <input
          type="date"
          className="text-input"
          value={dueDate || ''}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 200 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="field-label" style={{ marginBottom: 8 }}>Kategorien</label>
          {onManageLabels && (
            <button style={styles.linkBtn} onClick={onManageLabels}>verwalten</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {labels.length === 0 && (
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Kategorien angelegt.</span>
          )}
          {labels.map((l) => (
            <button
              key={l.id}
              onClick={() => toggleLabel(l.id)}
              style={{
                ...styles.labelBtn,
                background: l.color,
                opacity: labelIds.includes(l.id) ? 1 : 0.4,
                outline: labelIds.includes(l.id) ? '2px solid var(--text-primary)' : 'none',
              }}
            >
              {l.name}
            </button>
          ))}
        </div>

        <label className="field-label">Beschreibung</label>
        <textarea
          className="text-input"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details, Notizen, Links …"
          style={{ resize: 'vertical', marginBottom: 20 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label className="field-label" style={{ marginBottom: 0 }}>
            Checkliste {checklist.length > 0 && `(${doneCount}/${checklist.length})`}
          </label>
        </div>
        {checklist.length > 0 && (
          <div className="checklist-progress-bar" style={{ marginBottom: 12 }}>
            <div className="checklist-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          {checklist.map((item) => (
            <label key={item.id} style={styles.checklistRow}>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleChecklistItem(item.id)}
                style={{ width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{
                flex: 1, fontSize: 14,
                textDecoration: item.done ? 'line-through' : 'none',
                opacity: item.done ? 0.55 : 1,
              }}>
                {item.text}
              </span>
              <button style={styles.deleteItemBtn} onClick={() => removeChecklistItem(item.id)}>×</button>
            </label>
          ))}
        </div>
        <form onSubmit={addChecklistItem} style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          <input
            className="text-input"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Punkt hinzufügen …"
            style={{ flex: 1 }}
          />
          <button className="btn" type="submit" style={{ fontSize: 13 }}>+</button>
        </form>

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
    color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
    padding: '4px 0 10px', marginBottom: 4,
  },
  labelBtn: {
    fontSize: 11, fontWeight: 700, color: '#fff', padding: '5px 10px', borderRadius: 4,
    textTransform: 'uppercase', letterSpacing: '0.03em',
  },
  linkBtn: { background: 'none', color: 'var(--accent-amber)', fontSize: 12, fontWeight: 600, padding: 0 },
  checklistRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '5px 6px', borderRadius: 5, cursor: 'pointer',
  },
  deleteItemBtn: { background: 'none', color: 'var(--muted)', fontSize: 16, padding: '0 4px', flexShrink: 0 },
}
