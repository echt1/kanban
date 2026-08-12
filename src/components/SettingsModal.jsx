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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn-ghost" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  accountRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(128,128,128,0.1)', padding: '10px 12px', borderRadius: 6,
  },
}
