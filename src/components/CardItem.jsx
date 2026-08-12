import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import ContextMenu, { CtxItem, CtxSectionLabel, CtxDivider, useContextMenu } from './ContextMenu'

function isoInDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function CardItem({ card, index, labels, dimmed, onClick, onQuickUpdate, onDelete }) {
  const { menu, open, close } = useContextMenu()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(card.title)

  const cardLabels = (card.labelIds || [])
    .map((id) => labels.find((l) => l.id === id))
    .filter(Boolean)

  const due = card.dueDate ? new Date(card.dueDate) : null
  const isOverdue = due && due < new Date(new Date().toDateString())
  const isSoon = due && !isOverdue && (due - new Date()) / 86400000 < 2

  const checklist = card.checklist || []
  const doneCount = checklist.filter((i) => i.done).length
  const commentCount = (card.comments || []).length

  function toggleLabel(id) {
    const has = (card.labelIds || []).includes(id)
    const next = has ? card.labelIds.filter((x) => x !== id) : [...(card.labelIds || []), id]
    onQuickUpdate({ labelIds: next })
  }

  function toggleDone(e) {
    e.stopPropagation()
    onQuickUpdate({ done: !card.done })
  }

  function commitTitle() {
    setEditingTitle(false)
    if (titleDraft.trim() && titleDraft !== card.title) onQuickUpdate({ title: titleDraft.trim() })
    else setTitleDraft(card.title)
  }

  const coverStyle = card.cover?.type === 'color' && card.cover.value
    ? { background: card.cover.value, height: 10 }
    : card.cover?.type === 'image' && card.cover.value
      ? { backgroundImage: `url(${card.cover.value})`, backgroundSize: 'cover', backgroundPosition: 'center', height: 64 }
      : null

  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={onClick}
            onContextMenu={open}
            className="board-card"
            style={{
              ...styles.card,
              opacity: dimmed ? 0.2 : card.done ? 0.6 : 1,
              pointerEvents: dimmed ? 'none' : 'auto',
              boxShadow: snapshot.isDragging
                ? '0 12px 24px rgba(0,0,0,0.45)'
                : '0 1px 3px rgba(0,0,0,0.3)',
              ...provided.draggableProps.style,
            }}
          >
            {coverStyle && <div style={{ ...styles.cover, ...coverStyle }} />}
            <div style={styles.body}>
              {cardLabels.length > 0 && (
                <div style={styles.labelRow}>
                  {cardLabels.map((l) => (
                    <span key={l.id} style={{ ...styles.labelChip, background: l.color }}>{l.name}</span>
                  ))}
                </div>
              )}
              <div style={styles.titleRow}>
                <label style={styles.checkboxHit} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!card.done}
                    onChange={toggleDone}
                    style={styles.doneCheckbox}
                    title="Als erledigt markieren"
                  />
                </label>
                {editingTitle ? (
                  <input
                    autoFocus
                    className="text-input"
                    value={titleDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitTitle()
                      if (e.key === 'Escape') { setTitleDraft(card.title); setEditingTitle(false) }
                    }}
                    style={{ flex: 1, fontSize: 14, padding: '3px 6px' }}
                  />
                ) : (
                  <>
                    <p style={{ ...styles.title, textDecoration: card.done ? 'line-through' : 'none' }}>
                      {card.title}
                    </p>
                    <button
                      style={styles.editBtn}
                      className="card-edit-btn"
                      onClick={(e) => { e.stopPropagation(); setEditingTitle(true) }}
                      title="Titel umbenennen"
                    >
                      ✎
                    </button>
                  </>
                )}
              </div>

              {card.description && (
                <p style={styles.descPreview}>
                  {card.description.length > 80 ? card.description.slice(0, 80) + '…' : card.description}
                </p>
              )}

              {card.link && (
                <a
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={styles.linkChip}
                >
                  🔗 {hostnameOf(card.link)}
                </a>
              )}

              <div style={styles.metaRow}>
                {due && (
                  <span style={{
                    ...styles.metaTag,
                    color: isOverdue ? 'var(--accent-clay)' : isSoon ? 'var(--accent-amber)' : 'var(--muted)',
                  }}>
                    {card.repeat && '🔁 '}{due.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
                {checklist.length > 0 && (
                  <span style={styles.metaTag}>☑ {doneCount}/{checklist.length}</span>
                )}
                {commentCount > 0 && (
                  <span style={styles.metaTag}>💬 {commentCount}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={close}>
          <CtxItem onClick={() => { onQuickUpdate({ done: !card.done }); close() }} icon={card.done ? '↺' : '✓'}>
            {card.done ? 'Als offen markieren' : 'Als erledigt markieren'}
          </CtxItem>
          <CtxDivider />
          <CtxSectionLabel>Fällig</CtxSectionLabel>
          <CtxItem onClick={() => { onQuickUpdate({ dueDate: isoInDays(0) }); close() }}>Heute</CtxItem>
          <CtxItem onClick={() => { onQuickUpdate({ dueDate: isoInDays(1) }); close() }}>Morgen</CtxItem>
          <CtxItem onClick={() => { onQuickUpdate({ dueDate: isoInDays(7) }); close() }}>In einer Woche</CtxItem>
          {card.dueDate && (
            <CtxItem onClick={() => { onQuickUpdate({ dueDate: null }); close() }}>Datum entfernen</CtxItem>
          )}

          {labels.length > 0 && (
            <>
              <CtxDivider />
              <CtxSectionLabel>Kategorien</CtxSectionLabel>
              {labels.map((l) => (
                <div key={l.id} className="ctx-label-row" onClick={() => toggleLabel(l.id)}>
                  <span className="ctx-swatch" style={{ background: l.color }} />
                  <span style={{ flex: 1 }}>{l.name}</span>
                  {(card.labelIds || []).includes(l.id) && <span>✓</span>}
                </div>
              ))}
            </>
          )}

          <CtxDivider />
          <CtxItem onClick={() => { onClick(); close() }} icon="✎">Karte öffnen</CtxItem>
          <CtxItem danger onClick={() => { onDelete(); close() }} icon="🗑">Karte löschen</CtxItem>
        </ContextMenu>
      )}
    </>
  )
}

const styles = {
  card: {
    background: 'var(--card-bg)', color: 'var(--card-text)', borderRadius: 6,
    border: '1px solid var(--card-border)', overflow: 'hidden',
    marginBottom: 8, cursor: 'pointer', fontSize: 14, position: 'relative',
  },
  cover: { height: 64, width: '100%' },
  body: { padding: '10px 12px 12px' },
  labelRow: { display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  labelChip: {
    fontSize: 10, fontWeight: 700, color: '#fff', padding: '2px 6px', borderRadius: 3,
    textTransform: 'uppercase', letterSpacing: '0.03em',
  },
  titleRow: { display: 'flex', alignItems: 'flex-start', gap: 6 },
  checkboxHit: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 7, margin: -7, cursor: 'pointer', flexShrink: 0,
  },
  doneCheckbox: { width: 15, height: 15, cursor: 'pointer', display: 'block' },
  title: { margin: 0, lineHeight: 1.35, flex: 1 },
  editBtn: {
    background: 'none', color: 'var(--muted)', fontSize: 12, padding: '2px 4px',
    flexShrink: 0, opacity: 0, transition: 'opacity 0.1s ease',
  },
  descPreview: {
    margin: '4px 0 0 23px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.4,
    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
  },
  linkChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, marginLeft: 23,
    fontSize: 12, color: 'var(--muted)', background: 'rgba(128,128,128,0.15)',
    padding: '3px 8px', borderRadius: 4, textDecoration: 'none', maxWidth: '85%',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  metaRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, paddingLeft: 23, flexWrap: 'wrap' },
  metaTag: { fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--muted)' },
}
