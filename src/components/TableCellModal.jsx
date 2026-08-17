import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updateCard } from '../lib/firestore'
import CardPicker from './CardPicker'

export default function TableCellModal({
  rowLabel, colLabel, cell, boards, cardsByBoard, onClose, onSave,
}) {
  const [note, setNote] = useState(cell?.note || '')
  const linkedCards = cell?.linkedCards || []

  function commitNote() {
    if (note !== (cell?.note || '')) onSave({ ...cell, note })
  }

  function toggleLink(boardId, cardId) {
    const already = linkedCards.some((l) => l.boardId === boardId && l.cardId === cardId)
    const next = already
      ? linkedCards.filter((l) => !(l.boardId === boardId && l.cardId === cardId))
      : [...linkedCards, { boardId, cardId }]
    onSave({ ...cell, note, linkedCards: next })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <h2>{rowLabel} · {colLabel}</h2>

        <label className="field-label">Notiz</label>
        <textarea
          className="text-input"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
          placeholder="Optionale Notiz für diese Zelle …"
          style={{ resize: 'vertical', marginBottom: 20, whiteSpace: 'pre-wrap' }}
        />

        {linkedCards.length > 0 && (
          <>
            <label className="field-label">Verknüpft</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              {linkedCards.map((l) => {
                const board = boards.find((b) => b.id === l.boardId)
                const card = (cardsByBoard[l.boardId] || []).find((c) => c.id === l.cardId)
                if (!board) return null
                return (
                  <div key={`${l.boardId}-${l.cardId}`} style={styles.linkedRow}>
                    <input
                      type="checkbox"
                      checked={!!card?.done}
                      disabled={!card}
                      onChange={(e) => updateCard(l.boardId, l.cardId, { done: e.target.checked })}
                      style={{ width: 16, height: 16, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13.5, textDecoration: card?.done ? 'line-through' : 'none',
                        opacity: card?.done ? 0.55 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {card ? card.title : '(Karte nicht mehr gefunden)'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{board.title}</div>
                    </div>
                    <Link to={`/board/${l.boardId}`} className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', textDecoration: 'none', flexShrink: 0 }}>
                      Zum Board
                    </Link>
                    <button style={styles.removeBtn} onClick={() => toggleLink(l.boardId, l.cardId)}>×</button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <label className="field-label">Karte verknüpfen</label>
        <CardPicker
          boards={boards}
          cardsByBoard={cardsByBoard}
          linkedCards={linkedCards}
          onToggle={toggleLink}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-ghost" onClick={() => { commitNote(); onClose() }}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  linkedRow: {
    display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(128,128,128,0.1)',
    padding: '8px 10px', borderRadius: 6,
  },
  removeBtn: { background: 'none', color: 'var(--muted)', fontSize: 16, padding: '0 4px', flexShrink: 0 },
}
