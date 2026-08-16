import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updateCard } from '../lib/firestore'
import Select from './Select'
import { renderMarkdownLite } from '../lib/markdown'

export default function TableCellModal({
  rowLabel, colLabel, cell, boards, cardsByBoard, onClose, onSave,
}) {
  const [note, setNote] = useState(cell?.note || '')
  const [pickBoardId, setPickBoardId] = useState(boards[0]?.id || '')
  const linkedCards = cell?.linkedCards || []

  function commitNote() {
    if (note !== (cell?.note || '')) onSave({ ...cell, note })
  }

  function addLink(cardId) {
    if (!cardId) return
    const board = boards.find((b) => b.id === pickBoardId)
    const card = (cardsByBoard[pickBoardId] || []).find((c) => c.id === cardId)
    if (!board || !card) return
    const already = linkedCards.some((l) => l.boardId === pickBoardId && l.cardId === cardId)
    if (already) return
    onSave({ ...cell, note, linkedCards: [...linkedCards, { boardId: pickBoardId, cardId }] })
  }

  function removeLink(boardId, cardId) {
    onSave({ ...cell, note, linkedCards: linkedCards.filter((l) => !(l.boardId === boardId && l.cardId === cardId)) })
  }

  const pickBoardCards = (cardsByBoard[pickBoardId] || []).filter((c) => !c.done)
  const boardOptions = boards.map((b) => ({ value: b.id, label: b.title }))
  const cardOptions = pickBoardCards.map((c) => ({ value: c.id, label: c.title }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
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

        <label className="field-label">Verknüpfte Karten</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {linkedCards.map((l) => {
            const board = boards.find((b) => b.id === l.boardId)
            const card = (cardsByBoard[l.boardId] || []).find((c) => c.id === l.cardId)
            if (!board) return null
            const checklist = card?.checklist || []
            const doneCount = checklist.filter((i) => i.done).length
            return (
              <div key={`${l.boardId}-${l.cardId}`} className="linked-hover" style={styles.linkedRow}>
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
                <button style={styles.removeBtn} onClick={() => removeLink(l.boardId, l.cardId)}>×</button>

                {card && (
                  <div className="linked-preview">
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{card.title}</div>
                    {card.description && (
                      <div
                        style={{ color: 'var(--muted)', marginBottom: 6, lineHeight: 1.4 }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdownLite(card.description.slice(0, 160)) }}
                      />
                    )}
                    {card.dueDate && (
                      <div style={{ color: 'var(--muted)', marginBottom: 4 }}>
                        Fällig: {new Date(card.dueDate).toLocaleDateString('de-DE')}
                      </div>
                    )}
                    {checklist.length > 0 && (
                      <div style={{ color: 'var(--muted)' }}>Checkliste: {doneCount}/{checklist.length}</div>
                    )}
                    {(card.labelIds || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                        {(card.labelIds || []).map((lid) => {
                          const lbl = board.labels?.find((x) => x.id === lid)
                          if (!lbl) return null
                          return <span key={lid} style={{ background: lbl.color, color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 3 }}>{lbl.name}</span>
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {linkedCards.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Karte verknüpft.</p>
          )}
        </div>

        <label className="field-label">Karte verknüpfen</label>
        {boards.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Du bist noch in keinem Board Mitglied.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <Select value={pickBoardId} onChange={setPickBoardId} options={boardOptions} placeholder="Board wählen" />
            <Select
              value=""
              onChange={addLink}
              options={cardOptions}
              placeholder={cardOptions.length ? 'Offene Karte auswählen …' : 'Keine offenen Karten in diesem Board'}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={() => { commitNote(); onClose() }}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  linkedRow: {
    display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(128,128,128,0.1)',
    padding: '8px 10px', borderRadius: 6, position: 'relative',
  },
  removeBtn: { background: 'none', color: 'var(--muted)', fontSize: 16, padding: '0 4px', flexShrink: 0 },
}
