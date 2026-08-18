import { useEffect, useMemo, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { subscribeBoards, subscribeCards, updateTable, deleteTable, updateCard } from '../lib/firestore'
import Navbar from '../components/Navbar'
import TableCellModal from '../components/TableCellModal'
import ConfirmButton from '../components/ConfirmButton'
import BackgroundModal from '../components/BackgroundModal'

export default function TableDetailPage() {
  const { tableId } = useParams()
  const { user } = useAuth()
  const [table, setTable] = useState(undefined)
  const [boards, setBoards] = useState([])
  const [cardsByBoard, setCardsByBoard] = useState({})
  const [activeCell, setActiveCell] = useState(null) // { rowId, colId }
  const [showBackground, setShowBackground] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'tables', tableId), (snap) => {
      setTable(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
    return unsub
  }, [tableId])

  useEffect(() => {
    const unsub = subscribeBoards(user.uid, user.email, setBoards)
    return unsub
  }, [user])

  useEffect(() => {
    const unsubs = boards.map((b) =>
      subscribeCards(b.id, (cards) => setCardsByBoard((prev) => ({ ...prev, [b.id]: cards })))
    )
    return () => unsubs.forEach((u) => u())
  }, [boards])

  useEffect(() => {
    if (table?.title) document.title = `${table.title} – Kanban`
    return () => { document.title = 'Kanban' }
  }, [table?.title])

  const rows = useMemo(() => (table?.rows || []).slice().sort((a, b) => a.order - b.order), [table])
  const cols = useMemo(() => (table?.columns || []).slice().sort((a, b) => a.order - b.order), [table])

  if (table === null) return <Navigate to="/tables" replace />
  if (table === undefined) return null

  const isOwner = table.ownerId === user.uid

  function cellKey(rowId, colId) {
    return `${rowId}:${colId}`
  }

  function resolveLinked(cell) {
    return (cell?.linkedCards || [])
      .map((l) => {
        const board = boards.find((b) => b.id === l.boardId)
        const card = (cardsByBoard[l.boardId] || []).find((c) => c.id === l.cardId)
        return board && card ? { board, card } : null
      })
      .filter(Boolean)
  }

  async function addRow() {
    const next = [...rows, { id: crypto.randomUUID(), label: `Zeile ${rows.length + 1}`, order: rows.length }]
    await updateTable(tableId, { rows: next })
  }

  async function addCol() {
    const next = [...cols, { id: crypto.randomUUID(), label: `Spalte ${cols.length + 1}`, order: cols.length }]
    await updateTable(tableId, { columns: next })
  }

  async function renameRow(id, label) {
    await updateTable(tableId, { rows: rows.map((r) => (r.id === id ? { ...r, label } : r)) })
  }

  async function renameCol(id, label) {
    await updateTable(tableId, { columns: cols.map((c) => (c.id === id ? { ...c, label } : c)) })
  }

  async function deleteRow(id) {
    const nextCells = { ...(table.cells || {}) }
    for (const c of cols) delete nextCells[cellKey(id, c.id)]
    await updateTable(tableId, { rows: rows.filter((r) => r.id !== id), cells: nextCells })
  }

  async function deleteCol(id) {
    const nextCells = { ...(table.cells || {}) }
    for (const r of rows) delete nextCells[cellKey(r.id, id)]
    await updateTable(tableId, { columns: cols.filter((c) => c.id !== id), cells: nextCells })
  }

  async function saveCell(rowId, colId, data) {
    const key = cellKey(rowId, colId)
    const nextCells = { ...(table.cells || {}) }
    if (!data.note && (!data.linkedCards || data.linkedCards.length === 0)) {
      delete nextCells[key]
    } else {
      nextCells[key] = { note: data.note || '', linkedCards: data.linkedCards || [] }
    }
    await updateTable(tableId, { cells: nextCells })
  }

  const wrapStyle = table.background?.type === 'image' && table.background.value
    ? { ...styles.wrap, backgroundImage: `url(${table.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : table.background?.type === 'color' && table.background.value
      ? { ...styles.wrap, background: table.background.value }
      : styles.wrap

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        boardTitle={table.title}
        boardSettingsSection={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="field-label">Titel</label>
              <input
                className="text-input"
                defaultValue={table.title}
                onBlur={(e) => e.target.value.trim() && e.target.value !== table.title && updateTable(tableId, { title: e.target.value.trim() })}
              />
            </div>
            <button className="btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowBackground(true)}>
              Hintergrund ändern
            </button>
            {isOwner && (
              <ConfirmButton
                className="btn-danger"
                style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: 14, fontWeight: 600, borderRadius: 6 }}
                label="Tabelle löschen"
                confirmText="Tabelle wirklich löschen? Das kann nicht rückgängig gemacht werden."
                onConfirm={async () => { await deleteTable(tableId); window.location.hash = '#/tables' }}
              />
            )}
          </div>
        }
      />

      <div style={wrapStyle}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cornerCell} />
                {cols.map((c) => (
                  <th key={c.id} style={styles.colHeader}>
                    <div style={styles.headerInner}>
                      <EditableLabel value={c.label} onCommit={(v) => renameCol(c.id, v)} />
                      <ConfirmButton
                        style={styles.smallDelete}
                        label="×"
                        confirmText="Spalte samt Inhalten löschen?"
                        onConfirm={() => deleteCol(c.id)}
                      />
                    </div>
                  </th>
                ))}
                <th style={styles.addHeaderCell}>
                  <button className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={addCol}>+ Spalte</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th style={styles.rowHeader}>
                    <div style={styles.headerInner}>
                      <EditableLabel value={r.label} onCommit={(v) => renameRow(r.id, v)} />
                      <ConfirmButton
                        style={styles.smallDelete}
                        label="×"
                        confirmText="Zeile samt Inhalten löschen?"
                        onConfirm={() => deleteRow(r.id)}
                      />
                    </div>
                  </th>
                  {cols.map((c) => {
                    const cell = table.cells?.[cellKey(r.id, c.id)]
                    const resolved = resolveLinked(cell)
                    const openCount = resolved.filter((x) => !x.card.done).length
                    return (
                      <TableCell
                        key={c.id}
                        note={cell?.note || ''}
                        resolved={resolved}
                        openCount={openCount}
                        onOpen={() => setActiveCell({ rowId: r.id, colId: c.id })}
                      />
                    )
                  })}
                  <td />
                </tr>
              ))}
              <tr>
                <th style={styles.addRowCell}>
                  <button className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={addRow}>+ Zeile</button>
                </th>
                {cols.map((c) => <td key={c.id} />)}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {activeCell && (
        <TableCellModal
          rowLabel={rows.find((r) => r.id === activeCell.rowId)?.label}
          colLabel={cols.find((c) => c.id === activeCell.colId)?.label}
          cell={table.cells?.[cellKey(activeCell.rowId, activeCell.colId)]}
          boards={boards}
          cardsByBoard={cardsByBoard}
          onClose={() => setActiveCell(null)}
          onSave={(data) => saveCell(activeCell.rowId, activeCell.colId, data)}
        />
      )}

      {showBackground && (
        <BackgroundModal
          value={table.background}
          onSave={(bg) => updateTable(tableId, { background: bg })}
          onClose={() => setShowBackground(false)}
        />
      )}
    </div>
  )
}

// Eine Tabellenzelle inkl. Hover-Vorschau (nur wenn Karten verlinkt sind),
// mit Durchblättern bei mehreren Karten und direktem Abhaken.
function TableCell({ note, resolved, openCount, onOpen }) {
  const [hovering, setHovering] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const navigate = useNavigate()

  const total = resolved.length
  const current = total > 0 ? resolved[previewIndex % total] : null

  function goto(boardId) {
    navigate(`/board/${boardId}`)
  }

  return (
    <td
      style={styles.cell}
      onClick={onOpen}
      onMouseEnter={() => { setHovering(true); setPreviewIndex(0) }}
      onMouseLeave={() => setHovering(false)}
    >
      {note && <div style={styles.cellNote}>{note}</div>}
      {total > 0 && (
        <span style={{ ...styles.cornerBadge, background: openCount > 0 ? 'var(--accent-amber)' : 'var(--accent-sage)' }}>
          {total}
        </span>
      )}
      {total === 0 && !note && <span style={styles.emptyHint}>+</span>}

      {hovering && current && (
        <div className="cell-card-preview" onClick={(e) => e.stopPropagation()}>
          {(current.card.labelIds || []).length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {current.card.labelIds.map((id) => {
                const l = current.board.labels?.find((x) => x.id === id)
                if (!l) return null
                return <span key={id} style={{ background: l.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase' }}>{l.name}</span>
              })}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={!!current.card.done}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateCard(current.board.id, current.card.id, { done: e.target.checked })}
              style={{ width: 15, height: 15, marginTop: 2, flexShrink: 0 }}
            />
            <span
              onClick={(e) => { e.stopPropagation(); goto(current.board.id) }}
              style={{
                fontWeight: 600, cursor: 'pointer',
                textDecoration: current.card.done ? 'line-through' : 'none', opacity: current.card.done ? 0.6 : 1,
              }}
            >
              {current.card.title}
            </span>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); goto(current.board.id) }}
            style={{ fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}
          >
            {current.board.title}
          </div>

          {total > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
              <button
                style={styles.pageBtn}
                onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex - 1 + total) % total) }}
              >
                ←
              </button>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{previewIndex + 1}/{total}</span>
              <button
                style={styles.pageBtn}
                onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex + 1) % total) }}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </td>
  )
}

function EditableLabel({ value, onCommit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <input
        autoFocus
        className="text-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => { setEditing(false); draft.trim() && onCommit(draft.trim()) }}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        style={{ fontSize: 15, padding: '4px 7px' }}
      />
    )
  }
  return (
    <span onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true) }} style={{ cursor: 'text' }}>
      {value}
    </span>
  )
}

const styles = {
  wrap: { flex: 1, overflow: 'auto', padding: '28px 32px', background: 'var(--board-felt)' },
  tableScroll: { overflow: 'auto' },
  table: { borderCollapse: 'separate', borderSpacing: 10 },
  cornerCell: { width: 190 },
  colHeader: {
    background: 'var(--bg-surface)', border: '1px solid var(--line)', borderRadius: 7,
    padding: '12px 14px', minWidth: 190, fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: 16, color: 'var(--text-primary)', textAlign: 'left',
  },
  rowHeader: {
    background: 'var(--bg-surface)', border: '1px solid var(--line)', borderRadius: 7,
    padding: '12px 14px', minWidth: 190, fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: 16, color: 'var(--text-primary)', textAlign: 'left', verticalAlign: 'top',
  },
  headerInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  smallDelete: { background: 'none', color: 'var(--muted)', fontSize: 16, padding: '0 3px', flexShrink: 0 },
  addHeaderCell: { minWidth: 130, verticalAlign: 'middle' },
  addRowCell: { minWidth: 190, textAlign: 'left' },
  cell: {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 7,
    padding: '14px 16px', minWidth: 190, minHeight: 74, verticalAlign: 'top', cursor: 'pointer',
    color: 'var(--card-text)', position: 'relative',
  },
  cellNote: { fontSize: 13.5, marginBottom: 6, lineHeight: 1.4, color: 'var(--card-text)', whiteSpace: 'pre-wrap', paddingRight: 20 },
  cornerBadge: {
    position: 'absolute', top: 8, right: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#1a1a1a',
  },
  pageBtn: { background: 'none', color: 'var(--text-primary)', fontSize: 13, padding: '2px 8px' },
  emptyHint: { color: 'var(--muted)', fontSize: 15 },
}
