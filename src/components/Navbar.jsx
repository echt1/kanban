import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import SettingsModal from './SettingsModal'
import IconButton from './IconButton'

export default function Navbar({ boardTitle, centerSlot, icons, boardSettingsSection }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/" style={styles.brand}>
          <span style={styles.pin} />
          Kanban
        </Link>
        {boardTitle && <span style={styles.crumb}>/ {boardTitle}</span>}
      </div>

      <div style={styles.center}>{centerSlot}</div>

      <div style={styles.right}>
        {icons}
        <IconButton icon={theme === 'dark' ? 'theme-dark' : 'theme-light'} emoji={theme === 'dark' ? '☾' : '☀'} title="Theme wechseln" onClick={toggleTheme} />
        <IconButton icon="settings" emoji="⚙" title="Einstellungen" onClick={() => setShowSettings(true)} />
      </div>

      {showSettings && (
        <SettingsModal
          user={user}
          onLogout={logout}
          onClose={() => setShowSettings(false)}
          boardSection={boardSettingsSection}
        />
      )}
    </nav>
  )
}

const styles = {
  nav: {
    display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12,
    padding: '12px 24px', borderBottom: '1px solid var(--line)', background: 'var(--bg-surface)',
  },
  left: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  center: { display: 'flex', justifyContent: 'center' },
  right: { display: 'flex', alignItems: 'center', gap: 8, justifySelf: 'end' },
  brand: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
    textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8,
    flexShrink: 0,
  },
  pin: {
    width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-amber)', display: 'inline-block',
  },
  crumb: {
    color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 14,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
}
