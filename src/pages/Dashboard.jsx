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

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: 0 }}>Deine Boards</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/calendar" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Kalender
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

        <div style={styles.grid}>
          {boards?.map((b) => (
            <Link key={b.id} to={`/board/${b.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, borderTop: `4px solid ${b.color || '#4c6b8a'}` }}>
                <h3 style={styles.cardTitle}>{b.title}</h3>
                <div style={styles.cardFooter}>
                  <span style={styles.members}>
                    {(b.members?.length || 1)} Mitglied{(b.members?.length || 1) === 1 ? '' : 'er'}
                  </span>
                  {b.ownerId === user.uid && (
                    <button style={styles.deleteBtn} onClick={(e) => handleDelete(e, b.id)}>löschen</button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateBoardModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18,
  },
  card: {
    background: 'var(--bg-surface)', border: '1px solid var(--line)', borderRadius: 8,
    padding: '20px 18px', minHeight: 100, display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', transition: 'transform 0.12s ease',
  },
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
