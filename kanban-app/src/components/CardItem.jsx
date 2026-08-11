import { Draggable } from '@hello-pangea/dnd'

export default function CardItem({ card, index, labels, onClick }) {
  const cardLabels = (card.labelIds || [])
    .map((id) => labels.find((l) => l.id === id))
    .filter(Boolean)

  const due = card.dueDate ? new Date(card.dueDate) : null
  const isOverdue = due && due < new Date(new Date().toDateString())
  const isSoon = due && !isOverdue && (due - new Date()) / 86400000 < 2

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            ...styles.card,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(1.5deg)`
              : provided.draggableProps.style?.transform,
            boxShadow: snapshot.isDragging
              ? '0 12px 24px rgba(0,0,0,0.4)'
              : '0 2px 4px rgba(0,0,0,0.25)',
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
          <p style={styles.title}>{card.title}</p>
          {due && (
            <span style={{
              ...styles.due,
              color: isOverdue ? 'var(--accent-clay)' : isSoon ? 'var(--accent-amber)' : 'var(--muted)',
            }}>
              {due.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
      )}
    </Draggable>
  )
}

const styles = {
  card: {
    background: 'var(--paper)', color: 'var(--ink-text)', borderRadius: 3,
    padding: '10px 12px 12px', marginBottom: 8, cursor: 'pointer',
    fontSize: 14, position: 'relative',
  },
  labelRow: { display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  labelChip: {
    fontSize: 10, fontWeight: 700, color: '#fff', padding: '2px 6px', borderRadius: 3,
    textTransform: 'uppercase', letterSpacing: '0.03em',
  },
  title: { margin: 0, lineHeight: 1.35 },
  due: {
    display: 'inline-block', marginTop: 8, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500,
  },
}
