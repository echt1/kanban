import { useEffect, useState } from 'react'
import { inviteMember, removeMember, setBoardActivity, addProfileMember, removeProfileMember } from '../lib/firestore'
import { isDiscord, activityId } from '../discord'
import { getActivityParticipants, discordSession } from '../lib/discordAuth'

// Nur in Discord (nur Eigentümer): Board für die Aktivität öffnen + Leute aus dem Call hinzufügen
function DiscordSection({ board }) {
  const [people, setPeople] = useState(null) // null = lädt
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const isOpen = board.activityId === activityId

  async function load() {
    setErr('')
    try {
      const list = await getActivityParticipants()
      setPeople(list)
    } catch (e) {
      console.error(e)
      setErr('Teilnehmer konnten nicht geladen werden.')
      setPeople([])
    }
  }
  useEffect(() => { load() }, [])

  async function toggleOpen() {
    setBusy(true)
    try { await setBoardActivity(board.id, isOpen ? null : activityId) } finally { setBusy(false) }
  }

  const members = board.members || []
  const others = (people || []).filter(
    (p) => p.discordId !== discordSession.discord?.id && !members.includes(p.uid),
  )

  return (
    <div style={{ marginBottom: 24 }}>
      <label className="field-label">Discord-Aktivität</label>
      <div style={styles.box}>
        <p style={styles.hint}>
          {isOpen
            ? 'Dieses Board ist für alle in der Aktivität zum Ansehen geöffnet. Bearbeiten können nur Mitglieder.'
            : 'Öffne das Board, damit alle in der Aktivität es ansehen können (ohne Konto, nur lesen).'}
        </p>
        <button className={isOpen ? 'btn-ghost' : 'btn'} disabled={busy} onClick={toggleOpen}>
          {isOpen ? 'Freigabe beenden' : 'Für die Aktivität öffnen'}
        </button>
      </div>

      <label className="field-label" style={{ marginTop: 16 }}>Aus der Aktivität hinzufügen</label>
      {people === null && <p style={styles.hint}>lädt …</p>}
      {err && <p style={{ ...styles.hint, color: 'var(--accent-clay)' }}>{err}</p>}
      {people && !err && others.length === 0 && (
        <p style={styles.hint}>Niemand sonst in der Aktivität, der nicht schon Mitglied ist.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {others.map((p) => (
          <div key={p.discordId} style={styles.row}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {p.avatar
                ? <img src={p.avatar} alt="" width={24} height={24} style={{ borderRadius: '50%' }} />
                : <span style={styles.noAvatar}>{(p.name || '?')[0].toUpperCase()}</span>}
              {p.name}
            </span>
            <button
              className="btn"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => addProfileMember(board.id, p.uid, { name: p.name, avatar: p.avatar, discordId: p.discordId })}
            >
              Hinzufügen
            </button>
          </div>
        ))}
      </div>
      {people && (
        <button style={{ ...styles.remove, marginTop: 8, color: 'var(--muted)' }} onClick={load}>Liste aktualisieren</button>
      )}
    </div>
  )
}

export default function MembersModal({ board, isOwner, onClose }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    await inviteMember(board.id, email)
    setEmail('')
    setBusy(false)
  }

  const profiles = Object.entries(board.memberProfiles || {})

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Mitglieder</h2>

        {isDiscord && isOwner && <DiscordSection board={board} />}

        {isOwner ? (
          <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              type="email"
              required
              className="text-input"
              placeholder="E-Mail-Adresse einladen"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn" disabled={busy}>Einladen</button>
          </form>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Nur der Eigentümer dieses Boards kann Mitglieder einladen oder entfernen.
          </p>
        )}

        <label className="field-label">Mitglieder</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(board.memberEmails || []).map((m) => (
            <div key={m} style={styles.row}>
              <span>{m}{m === board.memberEmails[0] && <span style={styles.ownerTag}>Eigentümer</span>}</span>
              {isOwner && m !== board.memberEmails[0] && (
                <button style={styles.remove} onClick={() => removeMember(board.id, m)}>entfernen</button>
              )}
            </div>
          ))}
          {profiles.map(([uid, pr]) => (
            <div key={uid} style={styles.row}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {pr.avatar
                  ? <img src={pr.avatar} alt="" width={20} height={20} style={{ borderRadius: '50%' }} />
                  : <span style={{ ...styles.noAvatar, width: 20, height: 20, fontSize: 11 }}>{(pr.name || '?')[0].toUpperCase()}</span>}
                {pr.name}<span style={styles.discordTag}>Discord</span>
              </span>
              {isOwner && (
                <button style={styles.remove} onClick={() => removeProfileMember(board.id, uid)}>entfernen</button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-ghost" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(128,128,128,0.1)', padding: '8px 12px', borderRadius: 6, fontSize: 13,
  },
  box: { background: 'rgba(88,101,242,0.12)', padding: '12px', borderRadius: 6 },
  hint: { fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' },
  ownerTag: {
    fontSize: 10, marginLeft: 8, color: 'var(--accent-amber)', textTransform: 'uppercase',
    letterSpacing: '0.04em', fontWeight: 700,
  },
  discordTag: {
    fontSize: 10, marginLeft: 8, color: '#8d96f7', textTransform: 'uppercase',
    letterSpacing: '0.04em', fontWeight: 700,
  },
  noAvatar: {
    width: 24, height: 24, borderRadius: '50%', background: '#5865F2', color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12,
  },
  remove: { background: 'none', color: 'var(--accent-clay)', fontSize: 12, padding: 0 },
}
