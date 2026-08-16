import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeBoards, createBoard, deleteBoard, createList } from '../lib/firestore'
import Navbar from '../components/Navbar'
import CreateBoardModal from '../components/CreateBoardModal'

export default function Dashboard() {
  const { user } = useAuth()
  const [boards, setBoards] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeBoards(user.uid, user.email, setBoards)
    return unsub
  }, [user])

  async function handleCreate(title, color, templateLists) {
    const ref = await createBoard(title, color, user.uid, user.email)
    for (let i = 0; i < (templateLists || []).length; i++) {
      await createList(ref.id, templateLists[i], i)
    }
    setShowCreate(false)
  }

  async function handleDelete(e, boardId) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Board wirklich löschen? Das kann nicht rückgängig gemacht werden.')) {
      await deleteBoard(boardId)
    }
  }

  const ownBoards = (boards || []).filter((b) => b.ownerId === user.uid)
  const joinedBoards = (boards || []).filter((b) => b.ownerId !== user.uid)

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: 0 }}>Deine Boards</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/calendar" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Kalender
            </Link>
            <Link to="/tables" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Tabellen
            </Link>
            <button className="btn" onClick={() => setShowCreate(true)}>+ Neues Board</button>
          </div>
        </div>

        {boards === null && <p style={{ color: 'var(--muted)' }}>lädt …</p>}

        {boards && boards.length === 0 && (
          <div style={emptyStyles.wrap}>
            <p style={emptyStyles.text}>Noch kein Board angepinnt. Leg dein erstes an.</p>
            <button className="btn" onClick={() => setShowCreate(true)}>+ Neues Board</button>
          </div>
        )}

        {ownBoards.length > 0 && (
          <>
            <h2 style={styles.sectionTitle}>Eigene Boards</h2>
            <div style={{ ...styles.grid, marginBottom: joinedBoards.length > 0 ? 36 : 0 }}>
              {ownBoards.map((b) => <BoardTile key={b.id} board={b} isOwner onDelete={handleDelete} />)}
            </div>
          </>
        )}

        {joinedBoards.length > 0 && (
          <>
            <h2 style={styles.sectionTitle}>Beigetreten</h2>
            <div style={styles.grid}>
              {joinedBoards.map((b) => <BoardTile key={b.id} board={b} isOwner={false} onDelete={handleDelete} />)}
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateBoardModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}

function BoardTile({ board: b, isOwner, onDelete }) {
  const stripStyle = b.background?.type === 'image' && b.background.value
    ? { backgroundImage: `url(${b.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: b.background?.type === 'color' && b.background.value ? b.background.value : (b.color || '#4c6b8a') }

  return (
    <Link to={`/board/${b.id}`} style={{ textDecoration: 'none' }}>
      <div style={styles.card}>
        <div style={{ ...styles.strip, ...stripStyle }} />
        <div style={styles.cardBody}>
          <h3 style={styles.cardTitle}>{b.title}</h3>
          <div style={styles.cardFooter}>
            <span style={styles.members}>
              {(b.members?.length || 1)} Mitglied{(b.members?.length || 1) === 1 ? '' : 'er'}
            </span>
            {isOwner && (
              <button style={styles.deleteBtn} onClick={(e) => onDelete(e, b.id)}>löschen</button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

const styles = {
  sectionTitle: {
    fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)',
    marginBottom: 14, fontWeight: 700,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18,
  },
  card: {
    background: 'var(--bg-surface)', border: '1px solid var(--line)', borderRadius: 8,
    overflow: 'hidden', transition: 'transform 0.12s ease',
  },
  strip: { height: 48, width: '100%' },
  cardBody: { padding: '16px 18px', minHeight: 68, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, color: 'var(--text-primary)' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  members: { fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' },
  deleteBtn: { background: 'none', color: 'var(--muted)', fontSize: 12, padding: 0 },
}

const emptyStyles = {
  wrap: {
    border: '1px dashed var(--line)', borderRadius: 10, padding: '48px 20px',
    textAlign: 'center', marginBottom: 24,
  },
  text: { color: 'var(--muted)', marginBottom: 16 },
}
