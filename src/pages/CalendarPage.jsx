import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeBoards, subscribeCards, subscribeUserSettings, updateUserSettings } from '../lib/firestore'
import Navbar from '../components/Navbar'
import BackgroundModal from '../components/BackgroundModal'
import IconButton from '../components/IconButton'

export default function CalendarPage() {
  const { user } = useAuth()
  const [boards, setBoards] = useState([])
  const [cardsByBoard, setCardsByBoard] = useState({})
  const [settings, setSettings] = useState({})
  const [showBackground, setShowBackground] = useState(false)

  useEffect(() => {
    const unsub = subscribeBoards(user.uid, user.email, setBoards)
    return unsub
  }, [user])

  useEffect(() => {
    const unsub = subscribeUserSettings(user.uid, setSettings)
    return unsub
  }, [user])

  useEffect(() => {
    const unsubs = boards.map((b) =>
      subscribeCards(b.id, (cards) => {
        setCardsByBoard((prev) => ({ ...prev, [b.id]: cards }))
      })
    )
    return () => unsubs.forEach((u) => u())
  }, [boards])

  const allDueCards = boards.flatMap((b) =>
    (cardsByBoard[b.id] || [])
      .filter((c) => c.dueDate && !c.done)
      .map((c) => ({ ...c, boardId: b.id, boardTitle: b.title, boardColor: b.color }))
  )

  const todayStr = new Date().toISOString().slice(0, 10)
  const in7 = new Date()
  in7.setDate(in7.getDate() + 7)
  const in7Str = in7.toISOString().slice(0, 10)

  const overdue = allDueCards.filter((c) => c.dueDate < todayStr).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const today = allDueCards.filter((c) => c.dueDate === todayStr)
  const thisWeek = allDueCards.filter((c) => c.dueDate > todayStr && c.dueDate <= in7Str).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const later = allDueCards.filter((c) => c.dueDate > in7Str).sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const bg = settings.calendarBackground
  const pageStyle = bg?.type === 'image' && bg.value
    ? { minHeight: '100vh', backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : bg?.type === 'color' && bg.value
      ? { minHeight: '100vh', background: bg.value }
      : { minHeight: '100vh' }

  return (
    <div style={pageStyle}>
      <Navbar
        icons={<IconButton icon="background" emoji="🖼" title="Hintergrund" onClick={() => setShowBackground(true)} />}
      />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 6 }}>Fällig</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>
          Alle offenen Karten mit Fälligkeitsdatum, über alle Boards hinweg.
        </p>

        <Section title="Überfällig" cards={overdue} accent="var(--accent-clay)" />
        <Section title="Heute" cards={today} accent="var(--accent-amber)" />
        <Section title="Diese Woche" cards={thisWeek} />
        <Section title="Später" cards={later} />

        {allDueCards.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>Keine offenen Karten mit Fälligkeitsdatum. Entspann dich.</p>
        )}
      </div>

      {showBackground && (
        <BackgroundModal
          value={settings.calendarBackground}
          onSave={(v) => updateUserSettings(user.uid, { calendarBackground: v })}
          onClose={() => setShowBackground(false)}
        />
      )}
    </div>
  )
}

function Section({ title, cards, accent }) {
  if (cards.length === 0) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent || 'var(--muted)', marginBottom: 10 }}>
        {title} ({cards.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {cards.map((c) => (
          <Link key={c.id} to={`/board/${c.boardId}`} style={styles.row}>
            <span style={{ ...styles.dot, background: c.boardColor || 'var(--accent-blue)' }} />
            <span style={{ flex: 1 }}>{c.title}</span>
            <span style={styles.boardTag}>{c.boardTitle}</span>
            <span style={styles.date}>
              {new Date(c.dueDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const styles = {
  row: {
    display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)',
    border: '1px solid var(--line)', borderRadius: 6, padding: '10px 14px',
    textDecoration: 'none', color: 'var(--text-primary)', fontSize: 14,
  },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  boardTag: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' },
  date: { fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)', minWidth: 40, textAlign: 'right' },
}
