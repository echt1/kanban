import { useState, useEffect } from 'react'
import ConfirmButton from './ConfirmButton'
import LegalLinks from './LegalLinks'
import { isDiscord, workerUrl } from '../discord'
import { createLinkCode, redeemLinkCode, discordSession, getLinkStatus, unlinkDiscord } from '../lib/discordAuth'

function DiscordLink({ user }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [accounts, setAccounts] = useState(null) // null = lädt, [] = nicht verknüpft
  const canCheck = !!workerUrl && !isDiscord && !user.isDiscordOnly

  useEffect(() => {
    if (!canCheck) return
    getLinkStatus().then((r) => setAccounts(r.accounts || [])).catch(() => setAccounts([]))
  }, [canCheck])

  if (!workerUrl) return null

  async function run(fn) {
    setBusy(true); setErr(''); setMsg('')
    try { await fn() } catch (e) { setErr(e.message || 'Fehlgeschlagen') } finally { setBusy(false) }
  }

  // Im Browser (Hauptkonto): Code erzeugen
  if (!isDiscord) {
    if (user.isDiscordOnly) return null
    return (
      <div style={{ marginTop: 24 }}>
        <label className="field-label">Discord</label>
        {accounts && accounts.length > 0 && accounts.map((a) => (
          <div key={a.id} style={styles.linked}>
            {a.avatar
              ? <img src={a.avatar} alt="" width={32} height={32} style={{ borderRadius: '50%' }} />
              : <div style={styles.noAvatar}>D</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name || 'Discord-Konto'}</div>
              <div style={styles.hint2}>
                {a.name ? 'Mit Discord verknüpft' : 'Verknüpft – Name erscheint nach dem nächsten Start der Aktivität'}
              </div>
            </div>
            <ConfirmButton
              className="btn-ghost"
              label="Lösen"
              confirmText="Verknüpfung wirklich lösen? In Discord bekommst du dann ein neues, leeres Konto."
              onConfirm={() => run(async () => { await unlinkDiscord(); setAccounts([]) })}
            />
          </div>
        ))}
        {accounts && accounts.length === 0 && (
          <>
            <p style={styles.hint}>
              Erzeuge einen Code und gib ihn in der Discord-Aktivität ein (Einstellungen ⚙), damit dort dein Konto mit allen Boards geladen wird.
            </p>
            <button className="btn-ghost" disabled={busy} onClick={() => run(async () => {
              const r = await createLinkCode()
              setMsg(`${r.code}`)
            })}>Verknüpfungscode erzeugen</button>
            {msg && <p style={styles.code}>{msg}<span style={styles.hint}>  (10 Min. gültig)</span></p>}
          </>
        )}
        {err && <p style={styles.err}>{err}</p>}
      </div>
    )
  }

  // In Discord: Code einlösen (nur wenn noch kein verknüpftes Konto)
  if (!user.isDiscordOnly) {
    return discordSession.linked ? (
      <div style={{ marginTop: 24 }}>
        <label className="field-label">Discord</label>
        <p style={styles.hint}>Dein Discord-Konto ist mit {user.email} verknüpft.</p>
      </div>
    ) : null
  }
  return (
    <div style={{ marginTop: 24 }}>
      <label className="field-label">Bestehendes Konto verknüpfen</label>
      <p style={styles.hint}>
        Öffne die App im Browser, melde dich mit deinem Hauptkonto an und erzeuge unter Einstellungen einen Code.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="text-input" placeholder="CODE" value={code} maxLength={8}
          onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <button className="btn" disabled={busy || code.length < 8}
          onClick={() => run(async () => { await redeemLinkCode(code); setMsg('Verknüpft!') })}>
          Verknüpfen
        </button>
      </div>
      {msg && <p style={styles.hint}>{msg}</p>}
      {err && <p style={styles.err}>{err}</p>}
    </div>
  )
}

export default function SettingsModal({ user, onLogout, onClose, boardSection }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Einstellungen</h2>

        {boardSection && (
          <>
            <label className="field-label">Board</label>
            <div style={{ marginBottom: 24 }}>{boardSection}</div>
          </>
        )}

        <label className="field-label">Account</label>
        <div style={styles.accountRow}>
          <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{user.email}</span>
          <button className="btn-ghost" onClick={onLogout}>Abmelden</button>
        </div>

        <DiscordLink user={user} />

        <LegalLinks style={{ marginTop: 24, textAlign: 'left' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn-ghost" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  linked: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
    background: 'rgba(88,101,242,0.12)', padding: '10px 12px', borderRadius: 6,
  },
  noAvatar: {
    width: 32, height: 32, borderRadius: '50%', background: '#5865F2', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
  },
  hint2: { fontSize: 12, color: 'var(--muted)' },
  hint: { fontSize: 13, color: 'var(--muted)', margin: '4px 0 10px' },
  err: { fontSize: 13, color: 'var(--accent-clay)', marginTop: 8 },
  code: { fontFamily: 'var(--font-mono)', fontSize: 22, letterSpacing: '0.15em', marginTop: 12 },
  accountRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(128,128,128,0.1)', padding: '10px 12px', borderRadius: 6,
  },
}
