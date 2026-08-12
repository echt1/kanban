import { useState, useEffect, useRef } from 'react'
import ColorGrid from './ColorGrid'

function googleCalendarUrl(title, isoDate) {
  const d = isoDate.replace(/-/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Aufgabe',
    dates: `${d}/${d}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function formatTimestamp(ms) {
  if (!ms) return ''
  return new Date(ms).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function CardModal({ card, labels, currentUserEmail, onClose, onSave, onDelete, onManageLabels, onAddComment }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState(card.dueDate || '')
  const [labelIds, setLabelIds] = useState(card.labelIds || [])
  const [checklist, setChecklist] = useState(card.checklist || [])
  const [link, setLink] = useState(card.link || '')
  const [repeat, setRepeat] = useState(card.repeat?.freq || 'none')
  const [newItemText, setNewItemText] = useState('')
  const [showCoverImage, setShowCoverImage] = useState(false)
  const [coverImageDraft, setCoverImageDraft] = useState(card.cover?.type === 'image' ? card.cover.value : '')
  const [commentText, setCommentText] = useState('')
  const saveTimeout = useRef(null)

  useEffect(() => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      onSave({
        title, description, dueDate: dueDate || null, labelIds, checklist,
        link: link.trim() || null, repeat: repeat === 'none' ? null : { freq: repeat },
      })
    }, 500)
    return () => clearTimeout(saveTimeout.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, dueDate, labelIds, checklist, link, repeat])

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

  function setCover(cover) {
    onSave({
      title, description, dueDate: dueDate || null, labelIds, checklist,
      link: link.trim() || null, repeat: repeat === 'none' ? null : { freq: repeat }, cover,
    })
  }

  function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    onAddComment(commentText.trim())
    setCommentText('')
  }

  function handleDelete() {
    if (confirm('Karte löschen?')) onDelete()
  }

  const doneCount = checklist.filter((i) => i.done).length
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0
  const comments = card.comments || []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, padding: 0, overflowX: 'hidden' }} onClick={(e) => e.stopPropagation()}>

        {card.cover?.type === 'color' && card.cover.value && (
          <div style={{ height: 32, background: card.cover.value }} />
        )}
        {card.cover?.type === 'image' && card.cover.value && (
          <div style={{ height: 110, backgroundImage: `url(${card.cover.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}

        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={styles.checkboxHit} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={!!card.done}
                onChange={(e) => onSave({
                  title, description, dueDate: dueDate || null, labelIds, checklist,
                  link: link.trim() || null, repeat: repeat === 'none' ? null : { freq: repeat },
                  done: e.target.checked,
                })}
                style={{ width: 18, height: 18, display: 'block' }}
              />
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ ...styles.titleInput, textDecoration: card.done ? 'line-through' : 'none', flex: 1 }}
              placeholder="Titel"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
            <label className="field-label" style={{ marginBottom: 8 }}>Cover</label>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => { setCover(null); setShowCoverImage(false) }}
              style={{ ...styles.swatch, border: !card.cover ? '2px solid var(--accent-amber)' : '2px dashed var(--muted)', background: 'transparent', flexShrink: 0 }}
              title="Kein Cover"
            />
            <ColorGrid
              value={card.cover?.type === 'color' ? card.cover.value : null}
              onChange={(c) => { setCover({ type: 'color', value: c }); setShowCoverImage(false) }}
              swatchSize={26}
            />
          </div>
          <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px', marginBottom: 18 }} onClick={() => setShowCoverImage((s) => !s)}>
            Bild-URL {showCoverImage ? 'ausblenden' : 'stattdessen'}
          </button>
          {showCoverImage && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <input
                className="text-input"
                value={coverImageDraft}
                onChange={(e) => setCoverImageDraft(e.target.value)}
                placeholder="https://…/bild.jpg"
                style={{ flex: 1 }}
              />
              <button className="btn" style={{ fontSize: 13 }} onClick={() => setCover({ type: 'image', value: coverImageDraft.trim() })}>
                Setzen
              </button>
            </div>
          )}

          <label className="field-label">Fällig am</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <input
              type="date"
              className="text-input"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ maxWidth: 200 }}
            />
            {dueDate && (
              <a href={googleCalendarUrl(title, dueDate)} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
                + Google Kalender
              </a>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Wiederholt sich</span>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className="text-input"
              style={{ width: 'auto', padding: '5px 8px', fontSize: 12 }}
            >
              <option value="none">Nie</option>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
            {repeat !== 'none' && !dueDate && (
              <span style={{ fontSize: 11, color: 'var(--accent-amber)' }}>braucht ein Fälligkeitsdatum</span>
            )}
          </div>

          <label className="field-label">Link (z.B. YouTube, Google Doc, …)</label>
          <input
            className="text-input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
            style={{ marginBottom: 18 }}
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
            placeholder="Details, Notizen …"
            style={{ resize: 'vertical', marginBottom: 20 }}
          />

          <label className="field-label" style={{ marginBottom: 8 }}>
            Checkliste {checklist.length > 0 && `(${doneCount}/${checklist.length})`}
          </label>
          {checklist.length > 0 && (
            <div className="checklist-progress-bar" style={{ marginBottom: 12 }}>
              <div className="checklist-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
            {checklist.map((item) => (
              <div key={item.id} style={styles.checklistRow}>
                <label style={styles.checkboxHit}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(item.id)}
                    style={{ width: 16, height: 16, display: 'block' }}
                  />
                </label>
                <span style={{
                  flex: 1, fontSize: 14,
                  textDecoration: item.done ? 'line-through' : 'none',
                  opacity: item.done ? 0.55 : 1,
                }}>
                  {item.text}
                </span>
                <button style={styles.deleteItemBtn} onClick={() => removeChecklistItem(item.id)}>×</button>
              </div>
            ))}
          </div>
          <form onSubmit={addChecklistItem} style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
            <input
              className="text-input"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Punkt hinzufügen …"
              style={{ flex: 1 }}
            />
            <button className="btn" type="submit" style={{ fontSize: 13 }}>+</button>
          </form>

          <label className="field-label">Kommentare</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, maxHeight: 180, overflowY: 'auto' }}>
            {comments.map((c) => (
              <div key={c.id} style={styles.commentRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{c.authorEmail}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{formatTimestamp(c.createdAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4 }}>{c.text}</p>
              </div>
            ))}
            {comments.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Noch keine Kommentare.</p>}
          </div>
          <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              className="text-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Als ${currentUserEmail} kommentieren …`}
              style={{ flex: 1 }}
            />
            <button className="btn" type="submit" style={{ fontSize: 13 }}>Senden</button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-danger" onClick={handleDelete}>Karte löschen</button>
            <button className="btn-ghost" onClick={onClose}>Schließen</button>
          </div>
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
    display: 'flex', alignItems: 'center', gap: 8, padding: '3px 6px', borderRadius: 5,
  },
  checkboxHit: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 8, margin: -8, cursor: 'pointer', flexShrink: 0,
  },
  deleteItemBtn: { background: 'none', color: 'var(--muted)', fontSize: 16, padding: '0 4px', flexShrink: 0 },
  swatch: { width: 26, height: 26, borderRadius: 6, cursor: 'pointer' },
  commentRow: { background: 'rgba(128,128,128,0.1)', borderRadius: 6, padding: '8px 10px' },
}
