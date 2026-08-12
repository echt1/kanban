import { useState } from 'react'
import { inviteMember, removeMember } from '../lib/firestore'

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Mitglieder</h2>

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
  ownerTag: {
    fontSize: 10, marginLeft: 8, color: 'var(--accent-amber)', textTransform: 'uppercase',
    letterSpacing: '0.04em', fontWeight: 700,
  },
  remove: { background: 'none', color: 'var(--accent-clay)', fontSize: 12, padding: 0 },
}
