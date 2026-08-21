import ConfirmButton from './ConfirmButton'

export default function ArchiveModal({ cards, lists, onRestore, onDeleteForever, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <h2>Archiv</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 420, overflowY: 'auto' }}>
          {cards.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Noch nichts archiviert.</p>
          )}
          {cards.map((c) => {
            const listTitle = lists.find((l) => l.id === c.listId)?.title || '(gelöschte Liste)'
            return (
              <div key={c.id} style={styles.row}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{listTitle}</div>
                </div>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px', flexShrink: 0 }} onClick={() => onRestore(c.id)}>
                  Wiederherstellen
                </button>
                <ConfirmButton
                  className="btn-danger"
                  style={{ fontSize: 12, padding: '5px 10px', flexShrink: 0 }}
                  label="Löschen"
                  confirmText="Endgültig löschen? Das kann nicht rückgängig gemacht werden."
                  onConfirm={() => onDeleteForever(c.id)}
                />
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  row: {
    display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(128,128,128,0.1)',
    padding: '8px 10px', borderRadius: 6,
  },
}
