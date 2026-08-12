import { Draggable } from '@hello-pangea/dnd'
import ContextMenu, { CtxItem, CtxSectionLabel, CtxDivider, useContextMenu } from './ContextMenu'

function isoInDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function CardItem({ card, index, labels, onClick, onQuickUpdate, onDelete }) {
  const { menu, open, close } = useContextMenu()

  const cardLabels = (card.labelIds || [])
    .map((id) => labels.find((l) => l.id === id))
    .filter(Boolean)

  const due = card.dueDate ? new Date(card.dueDate) : null
  const isOverdue = due && due < new Date(new Date().toDateString())
  const isSoon = due && !isOverdue && (due - new Date()) / 86400000 < 2

  const checklist = card.checklist || []
  const doneCount = checklist.filter((i) => i.done).length

  function toggleLabel(id) {
    const has = (card.labelIds || []).includes(id)
    const next = has ? card.labelIds.filter((x) => x !== id) : [...(card.labelIds || []), id]
    onQuickUpdate({ labelIds: next })
  }

  function toggleDone(e) {
    e.stopPropagation()
    onQuickUpdate({ done: !card.done })
  }

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
            style={{
              ...styles.card,
              opacity: card.done ? 0.6 : 1,
              boxShadow: snapshot.isDragging
                ? '0 12px 24px rgba(0,0,0,0.45)'
                : '0 1px 3px rgba(0,0,0,0.3)',
              ...provided.draggableProps.style,
            }}
          >
            {cardLabels.length > 0 && (
              <div style={styles.labelRow}>
                {cardLabels.map((l) => (
                  <span key={l.id} style={{ ...styles.labelChip, background: l.color }}>{l.name}</span>
                ))}
              </div>
            )}
            <div style={styles.titleRow}>
              <input
                type="checkbox"
                checked={!!card.done}
                onChange={toggleDone}
                onClick={(e) => e.stopPropagation()}
                style={styles.doneCheckbox}
                title="Als erledigt markieren"
              />
              <p style={{ ...styles.title, textDecoration: card.done ? 'line-through' : 'none' }}>
                {card.title}
              </p>
            </div>
            <div style={styles.metaRow}>
              {due && (
                <span style={{
                  ...styles.due,
                  color: isOverdue ? 'var(--accent-clay)' : isSoon ? 'var(--accent-amber)' : 'var(--muted)',
                }}>
                  {due.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </span>
              )}
              {checklist.length > 0 && (
                <span style={styles.checklistBadge}>
                  ☑ {doneCount}/{checklist.length}
                </span>
              )}
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
    border: '1px solid var(--card-border)',
    padding: '10px 12px 12px', marginBottom: 8, cursor: 'pointer',
    fontSize: 14, position: 'relative',
  },
  labelRow: { display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  labelChip: {
    fontSize: 10, fontWeight: 700, color: '#fff', padding: '2px 6px', borderRadius: 3,
    textTransform: 'uppercase', letterSpacing: '0.03em',
  },
  titleRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  doneCheckbox: { width: 15, height: 15, marginTop: 2, flexShrink: 0, cursor: 'pointer' },
  title: { margin: 0, lineHeight: 1.35, flex: 1 },
  metaRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, paddingLeft: 23 },
  due: { fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500 },
  checklistBadge: { fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--muted)' },
}
