import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { subscribeLists, subscribeCards } from '../lib/firestore'

export default function ViewBoardPage() {
  const { boardId } = useParams()
  const [board, setBoard] = useState(undefined)
  const [lists, setLists] = useState([])
  const [cards, setCards] = useState([])

  useEffect(() => {
    const unsubBoard = onSnapshot(doc(db, 'boards', boardId), (snap) => {
      setBoard(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
    const unsubLists = subscribeLists(boardId, setLists)
    const unsubCards = subscribeCards(boardId, setCards)
    return () => { unsubBoard(); unsubLists(); unsubCards() }
  }, [boardId])

  useEffect(() => {
    if (board?.title) document.title = `${board.title} (nur lesen) – Kanban`
  }, [board?.title])

  if (board === undefined) return null
  if (board === null || !board.public) {
    return (
      <div style={styles.notFound}>
        <p>Dieses Board ist nicht (mehr) öffentlich freigegeben.</p>
        <Link to="/" className="btn">Zur Startseite</Link>
      </div>
    )
  }

  const boardAreaStyle = board.background?.type === 'image' && board.background.value
    ? { ...styles.boardArea, backgroundImage: `url(${board.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : board.background?.type === 'color' && board.background.value
      ? { ...styles.boardArea, background: board.background.value }
      : styles.boardArea

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={styles.nav}>
        <span style={styles.brand}>Kanban</span>
        <span style={styles.crumb}>/ {board.title}</span>
        <span style={styles.badge}>Nur lesen</span>
      </nav>

      <div style={boardAreaStyle}>
        <div style={styles.listsRow}>
          {lists.map((list) => (
            <div
              key={list.id}
              style={{
                ...styles.list,
                background: list.color
                  ? `color-mix(in srgb, ${list.color} 24%, var(--board-felt))`
                  : 'rgba(128,128,128,0.08)',
              }}
            >
              <div style={styles.listHeader}>
                <h3 style={styles.listTitle}>{list.title}</h3>
                <span style={styles.count}>{cards.filter((c) => c.listId === list.id).length}</span>
              </div>
              {cards
                .filter((c) => c.listId === list.id)
                .sort((a, b) => a.order - b.order)
                .map((card) => {
                  const cardLabels = (card.labelIds || []).map((id) => board.labels?.find((l) => l.id === id)).filter(Boolean)
                  return (
                    <div key={card.id} style={styles.card}>
                      {card.cover?.type === 'color' && card.cover.value && (
                        <div style={{ height: 35, background: card.cover.value, margin: '-10px -12px 8px' }} />
                      )}
                      {card.cover?.type === 'image' && card.cover.value && (
                        <div style={{ height: 64, backgroundImage: `url(${card.cover.value})`, backgroundSize: 'cover', backgroundPosition: 'center', margin: '-10px -12px 8px' }} />
                      )}
                      {cardLabels.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {cardLabels.map((l) => (
                            <span key={l.id} style={{ ...styles.labelChip, background: l.color }}>{l.name}</span>
                          ))}
                        </div>
                      )}
                      <p style={{ margin: 0, textDecoration: card.done ? 'line-through' : 'none', opacity: card.done ? 0.6 : 1 }}>
                        {card.title}
                      </p>
                      {card.dueDate && (
                        <span style={styles.due}>
                          {new Date(card.dueDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
    borderBottom: '1px solid var(--line)', background: 'var(--bg-surface)',
  },
  brand: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 },
  crumb: { color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 14 },
  badge: {
    marginLeft: 'auto', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: 'var(--muted)', border: '1px solid var(--line)',
    padding: '3px 8px', borderRadius: 4,
  },
  boardArea: { flex: 1, overflowX: 'auto', padding: '20px 24px', background: 'var(--board-felt)' },
  listsRow: { display: 'flex', gap: 16, height: '100%', alignItems: 'flex-start' },
  list: { borderRadius: 8, padding: '12px 10px', width: 268, flexShrink: 0 },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' },
  listTitle: { fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, margin: 0, color: 'var(--text-primary)' },
  count: { fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'rgba(128,128,128,0.15)', padding: '2px 7px', borderRadius: 10 },
  card: {
    background: 'var(--card-bg)', color: 'var(--card-text)', border: '1px solid var(--card-border)',
    borderRadius: 6, padding: '10px 12px', marginBottom: 8, fontSize: 14, overflow: 'hidden',
  },
  labelChip: { fontSize: 10, fontWeight: 700, color: '#fff', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase' },
  due: { display: 'block', marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' },
  notFound: {
    height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 16, color: 'var(--muted)',
  },
}
