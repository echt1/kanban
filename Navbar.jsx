import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar({ boardTitle, rightSlot }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        <span style={styles.pin} />
        Board
      </Link>
      {boardTitle && <span style={styles.crumb}>/ {boardTitle}</span>}
      <div style={{ flex: 1 }} />
      {rightSlot}
      <button className="btn-ghost" onClick={toggleTheme} title="Theme wechseln" style={styles.themeBtn}>
        {theme === 'dark' ? '☾' : '☀'}
      </button>
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
    borderBottom: '1px solid var(--line)', background: 'var(--bg-surface)',
  },
  brand: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
    textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8,
  },
  pin: {
    width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-amber)', display: 'inline-block',
  },
  crumb: { color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 14 },
  themeBtn: { fontSize: 15, padding: '7px 11px', lineHeight: 1 },
  userWrap: { display: 'flex', alignItems: 'center', gap: 12 },
  email: { color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' },
}
