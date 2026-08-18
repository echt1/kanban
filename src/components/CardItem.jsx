import { useEffect, useRef, useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import ContextMenu, { CtxItem, CtxSectionLabel, CtxDivider, CtxConfirm, useContextMenu } from './ContextMenu'
import { renderMarkdownLite } from '../lib/markdown'
import AvatarBubble from './AvatarBubble'

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

const LABEL_CAP = 5

export default function CardItem({ card, index, labels, members, dimmed, compactLabels, onToggleCompactLabels, onClick, onQuickUpdate, onDelete }) {
  const { menu, open, close } = useContextMenu()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(card.title)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [labelSubmenuPos, setLabelSubmenuPos] = useState(null)
  const moreLabelsRef = useRef(null)
  const [hovering, setHovering] = useState(false)
  const cardRef = useRef(null)
  const titleAreaRef = useRef(null)
  const titleTextareaRef = useRef(null)

  function closeMenu() {
    close()
    setConfirmingDelete(false)
    setLabelSubmenuPos(null)
  }

  // Kategorien in der Reihenfolge der Kategorien-Übersicht anzeigen, nicht in
  // der Reihenfolge, in der sie der Karte zugewiesen wurden
  const cardLabels = labels.filter((l) => (card.labelIds || []).includes(l.id))

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

  function toggleAssignee(email) {
    const has = (card.assignees || []).includes(email)
    const next = has ? card.assignees.filter((x) => x !== email) : [...(card.assignees || []), email]
    onQuickUpdate({ assignees: next })
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

  useEffect(() => {
    if (editingTitle && titleTextareaRef.current) {
      const el = titleTextareaRef.current
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [editingTitle])

  // Entf/Backspace löscht die Karte, während man mit der Maus darüber ist
  // (nicht wenn gerade irgendwo getippt wird)
  useEffect(() => {
    function handleKey(e) {
      if (!hovering || editingTitle) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const rect = cardRef.current?.getBoundingClientRect()
        if (rect) {
          open({ preventDefault: () => {}, stopPropagation: () => {}, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 })
          setConfirmingDelete(true)
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [hovering, editingTitle, open])

  const coverStyle = card.cover?.type === 'color' && card.cover.value
    ? { background: card.cover.value, height: 35 }
    : card.cover?.type === 'image' && card.cover.value
      ? { backgroundImage: `url(${card.cover.value})`, backgroundSize: 'cover', backgroundPosition: 'center', height: 64 }
      : null

  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={(node) => { provided.innerRef(node); cardRef.current = node }}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={onClick}
            onContextMenu={open}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
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
                    <span
                      key={l.id}
                      onClick={(e) => { e.stopPropagation(); onToggleCompactLabels?.() }}
                      title={compactLabels ? l.name : undefined}
                      style={
                        compactLabels
                          ? { ...styles.labelChipCompact, background: l.color }
                          : { ...styles.labelChip, background: l.color }
                      }
                    >
                      {!compactLabels && l.name}
                    </span>
                  ))}
                </div>
              )}
              <div style={styles.titleRow} ref={titleAreaRef}>
                <label
                  className={`card-check-wrap${card.done ? ' always' : ''}`}
                  style={styles.checkboxHit}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={!!card.done}
                    onChange={toggleDone}
                    style={styles.doneCheckbox}
                    title="Als erledigt markieren"
                  />
                </label>
                {editingTitle ? (
                  <textarea
                    autoFocus
                    ref={titleTextareaRef}
                    className="text-input"
                    value={titleDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { setTitleDraft(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                    onBlur={commitTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTitle() }
                      if (e.key === 'Escape') { setTitleDraft(card.title); setEditingTitle(false) }
                    }}
                    rows={1}
                    style={{ flex: 1, fontSize: 14, padding: '3px 6px', resize: 'none', overflow: 'hidden', fontFamily: 'var(--font-body)' }}
                  />
                ) : (
                  <>
                    <p
                      style={{ ...styles.title, textDecoration: card.done ? 'line-through' : 'none' }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdownLite(card.title) }}
                    />
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
                <p
                  style={styles.descPreview}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownLite(
                      card.description.length > 320 ? card.description.slice(0, 320) + '…' : card.description
                    ),
                  }}
                />
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
                {(card.assignees || []).length > 0 && (
                  <div style={styles.assigneeRow}>
                    {card.assignees.map((email) => <AvatarBubble key={email} email={email} size={20} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={closeMenu}>
          {confirmingDelete ? (
            <CtxConfirm
              text="Karte wirklich löschen?"
              onConfirm={() => { onDelete(); closeMenu() }}
              onCancel={() => setConfirmingDelete(false)}
            />
          ) : (
            <>
              <CtxItem onClick={() => { onQuickUpdate({ done: !card.done }); closeMenu() }} icon={card.done ? '↺' : '✓'}>
                {card.done ? 'Als offen markieren' : 'Als erledigt markieren'}
              </CtxItem>
              <CtxDivider />
              <CtxSectionLabel>Fällig</CtxSectionLabel>
              <CtxItem onClick={() => { onQuickUpdate({ dueDate: isoInDays(0) }); closeMenu() }}>Heute</CtxItem>
              <CtxItem onClick={() => { onQuickUpdate({ dueDate: isoInDays(1) }); closeMenu() }}>Morgen</CtxItem>
              <CtxItem onClick={() => { onQuickUpdate({ dueDate: isoInDays(7) }); closeMenu() }}>In einer Woche</CtxItem>
              {card.dueDate && (
                <CtxItem onClick={() => { onQuickUpdate({ dueDate: null }); closeMenu() }}>Datum entfernen</CtxItem>
              )}

              {labels.length > 0 && (
                <>
                  <CtxDivider />
                  <CtxSectionLabel>Kategorien</CtxSectionLabel>
                  {labels.slice(0, LABEL_CAP).map((l) => (
                    <div key={l.id} className="ctx-label-row" onClick={() => toggleLabel(l.id)}>
                      <span className="ctx-swatch" style={{ background: l.color }} />
                      <span style={{ flex: 1 }}>{l.name}</span>
                      {(card.labelIds || []).includes(l.id) && <span>✓</span>}
                    </div>
                  ))}
                  {labels.length > LABEL_CAP && (
                    <div
                      ref={moreLabelsRef}
                      className="ctx-item"
                      style={{ justifyContent: 'space-between' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        const r = moreLabelsRef.current.getBoundingClientRect()
                        setLabelSubmenuPos(labelSubmenuPos ? null : { x: r.right + 4, y: r.top })
                      }}
                    >
                      <span>Weitere ({labels.length - LABEL_CAP})</span>
                      <span>▸</span>
                    </div>
                  )}
                </>
              )}

              {(members || []).length > 0 && (
                <>
                  <CtxDivider />
                  <CtxSectionLabel>Zugewiesen</CtxSectionLabel>
                  {members.map((email) => (
                    <div key={email} className="ctx-label-row" onClick={() => toggleAssignee(email)}>
                      <AvatarBubble email={email} size={18} />
                      <span style={{ flex: 1, marginLeft: 4 }}>{email}</span>
                      {(card.assignees || []).includes(email) && <span>✓</span>}
                    </div>
                  ))}
                </>
              )}

              <CtxDivider />
              <CtxItem onClick={() => { onClick(); closeMenu() }} icon="✎">Karte öffnen</CtxItem>
              <CtxItem danger onClick={() => setConfirmingDelete(true)} icon="🗑">Karte löschen</CtxItem>
            </>
          )}
        </ContextMenu>
      )}

      {labelSubmenuPos && (
        <ContextMenu x={labelSubmenuPos.x} y={labelSubmenuPos.y} onClose={() => setLabelSubmenuPos(null)} excludeRef={moreLabelsRef}>
          {labels.slice(LABEL_CAP).map((l) => (
            <div key={l.id} className="ctx-label-row" onClick={() => toggleLabel(l.id)}>
              <span className="ctx-swatch" style={{ background: l.color }} />
              <span style={{ flex: 1 }}>{l.name}</span>
              {(card.labelIds || []).includes(l.id) && <span>✓</span>}
            </div>
          ))}
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
  labelChipCompact: {
    width: 26, height: 8, borderRadius: 4, display: 'block',
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: 6 },
  checkboxHit: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  doneCheckbox: { width: 15, height: 15, cursor: 'pointer', display: 'block' },
  title: { margin: 0, lineHeight: 1.35, flex: 1, overflowWrap: 'anywhere', wordBreak: 'break-word' },
  editBtn: {
    background: 'none', color: 'var(--muted)', fontSize: 12, padding: '2px 4px',
    flexShrink: 0, opacity: 0, transition: 'opacity 0.1s ease',
  },
  descPreview: {
    margin: '4px 0 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.4,
    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
    WebkitLineClamp: 7, WebkitBoxOrient: 'vertical',
  },
  linkChip: {
    display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
    fontSize: 12, color: 'var(--muted)', background: 'rgba(128,128,128,0.15)',
    padding: '3px 8px', borderRadius: 4, textDecoration: 'none', maxWidth: '85%',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  metaRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  metaTag: { fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--muted)' },
  assigneeRow: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
}
