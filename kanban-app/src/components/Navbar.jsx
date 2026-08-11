import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar({ boardTitle }) {
  const { user, logout } = useAuth()

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        <span style={styles.pin} />
        Board
      </Link>
      {boardTitle && <span style={styles.crumb}>/ {boardTitle}</span>}
      <div style={{ flex: 1 }} />
      {user && (
        <div style={styles.userWrap}>
          <span style={styles.email}>{user.email}</span>
          <button className="btn-ghost" onClick={logout}>Abmelden</button>
        </div>
      )}
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px',
    borderBottom: '1px solid var(--line)', background: 'var(--ink-800)',
  },
  brand: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
    textDecoration: 'none', color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 8,
  },
  pin: {
    width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-amber)', display: 'inline-block',
  },
  crumb: { color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 14 },
  userWrap: { display: 'flex', alignItems: 'center', gap: 12 },
  email: { color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' },
}
