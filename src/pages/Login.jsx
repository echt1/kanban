import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { document.title = 'Log In – Kanban' }, [])

  if (!loading && user) return <Navigate to="/" replace />

  async function handleGoogle() {
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/')
    } catch (e) {
      setError(readableError(e))
    }
  }

  async function handleEmailAuth(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      navigate('/')
    } catch (e) {
      setError(readableError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Board</h1>
        <p style={styles.subtitle}>Dein privates Kanban-Board.</p>

        <button className="btn" style={{ width: '100%', marginTop: 24 }} onClick={handleGoogle}>
          Mit Google anmelden
        </button>

        <div style={styles.divider}><span>oder</span></div>

        <form onSubmit={handleEmailAuth}>
          <label className="field-label">E-Mail</label>
          <input
            className="text-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <label className="field-label">Passwort</label>
          <input
            className="text-input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button className="btn" style={{ width: '100%' }} type="submit" disabled={busy}>
            {mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <p style={styles.switch}>
          {mode === 'signin' ? 'Noch kein Konto?' : 'Schon ein Konto?'}{' '}
          <button
            style={styles.switchBtn}
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Registrieren' : 'Anmelden'}
          </button>
        </p>
      </div>
    </div>
  )
}

function readableError(e) {
  const code = e.code || ''
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'E-Mail oder Passwort falsch.'
  if (code.includes('user-not-found')) return 'Kein Konto mit dieser E-Mail gefunden.'
  if (code.includes('email-already-in-use')) return 'Diese E-Mail ist schon registriert.'
  if (code.includes('weak-password')) return 'Passwort muss mindestens 6 Zeichen haben.'
  return 'Etwas ist schiefgelaufen. Versuch es nochmal.'
}

const styles = {
  wrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at 30% 20%, rgba(76,107,138,0.15), transparent 45%), var(--bg-app)',
    padding: 20,
  },
  card: {
    width: '100%', maxWidth: 380, background: 'var(--bg-surface)', border: '1px solid var(--line)',
    borderRadius: 12, padding: '36px 32px',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 32, margin: 0, fontWeight: 700,
  },
  subtitle: { color: 'var(--muted)', marginTop: 6, fontSize: 14 },
  divider: {
    display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--muted)',
    fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  error: { color: 'var(--accent-clay)', fontSize: 13, marginBottom: 12 },
  switch: { fontSize: 13, color: 'var(--muted)', marginTop: 18, textAlign: 'center' },
  switchBtn: { background: 'none', color: 'var(--accent-amber)', fontWeight: 600, fontSize: 13, padding: 0 },
}
