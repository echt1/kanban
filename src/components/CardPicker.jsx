import { useState } from 'react'

export default function CardPicker({ boards, cardsByBoard, linkedCards, onToggle }) {
  const boardsWithCards = boards.filter((b) => (cardsByBoard[b.id] || []).length > 0)
  const [activeBoardId, setActiveBoardId] = useState(boardsWithCards[0]?.id || boards[0]?.id || '')

  const activeBoard = boards.find((b) => b.id === activeBoardId)
  const cards = (cardsByBoard[activeBoardId] || [])
    .slice()
    .sort((a, b) => Number(!!a.done) - Number(!!b.done))

  function isLinked(cardId) {
    return linkedCards.some((l) => l.boardId === activeBoardId && l.cardId === cardId)
  }

  if (boards.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--muted)' }}>Du bist noch in keinem Board Mitglied.</p>
  }

  return (
    <div>
      <div style={styles.boardRow}>
        {boards.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setActiveBoardId(b.id)}
            style={{
              ...styles.boardPill,
              background: b.id === activeBoardId ? (b.color || 'var(--accent-blue)') : 'rgba(128,128,128,0.12)',
              color: b.id === activeBoardId ? '#fff' : 'var(--text-primary)',
            }}
          >
            <span style={{ ...styles.boardDot, background: b.color || 'var(--accent-blue)' }} />
            {b.title}
          </button>
        ))}
      </div>

      {cards.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 2px' }}>
          Keine Karten in {activeBoard?.title || 'diesem Board'}.
        </p>
      ) : (
        <div style={styles.cardGrid}>
          {cards.map((c) => {
            const linked = isLinked(c.id)
            const cardLabels = (c.labelIds || []).map((id) => activeBoard?.labels?.find((l) => l.id === id)).filter(Boolean)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggle(activeBoardId, c.id)}
                style={{
                  ...styles.cardTile,
                  outline: linked ? '2px solid var(--accent-amber)' : '1px solid var(--card-border)',
                  opacity: c.done ? 0.55 : 1,
                }}
              >
                {linked && <span style={styles.checkBadge}>✓</span>}
                {cardLabels.length > 0 && (
                  <div style={styles.tileLabelRow}>
                    {cardLabels.slice(0, 3).map((l) => (
                      <span key={l.id} style={{ ...styles.tileLabelDot, background: l.color }} />
                    ))}
                  </div>
                )}
                <span style={{ ...styles.tileTitle, textDecoration: c.done ? 'line-through' : 'none' }}>
                  {c.title}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  boardRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  boardPill: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
    padding: '6px 12px', borderRadius: 20,
  },
  boardDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  cardGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8,
    maxHeight: 220, overflowY: 'auto', padding: 2,
  },
  cardTile: {
    position: 'relative', background: 'var(--card-bg)', color: 'var(--card-text)',
    borderRadius: 6, padding: '10px 10px 12px', textAlign: 'left', minHeight: 56,
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 4,
  },
  checkBadge: {
    position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%',
    background: 'var(--accent-amber)', color: '#1a1a1a', fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tileLabelRow: { display: 'flex', gap: 3 },
  tileLabelDot: { width: 10, height: 3, borderRadius: 2 },
  tileTitle: { fontSize: 12.5, lineHeight: 1.3, overflowWrap: 'anywhere' },
}
