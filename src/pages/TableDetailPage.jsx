import { useEffect, useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { subscribeBoards, subscribeCards, updateTable, deleteTable } from '../lib/firestore'
import Navbar from '../components/Navbar'
import TableCellModal from '../components/TableCellModal'

export default function TableDetailPage() {
  const { tableId } = useParams()
  const { user } = useAuth()
  const [table, setTable] = useState(undefined)
  const [boards, setBoards] = useState([])
  const [cardsByBoard, setCardsByBoard] = useState({})
  const [activeCell, setActiveCell] = useState(null) // { rowId, colId }

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

  function cellStats(rowId, colId) {
    const cell = table.cells?.[cellKey(rowId, colId)]
    const linked = cell?.linkedCards || []
    let open = 0
    for (const l of linked) {
      const card = (cardsByBoard[l.boardId] || []).find((c) => c.id === l.cardId)
      if (card && !card.done) open++
    }
    return { total: linked.length, open, note: cell?.note || '' }
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
    if (!confirm('Zeile löschen?')) return
    const nextCells = { ...(table.cells || {}) }
    for (const c of cols) delete nextCells[cellKey(id, c.id)]
    await updateTable(tableId, { rows: rows.filter((r) => r.id !== id), cells: nextCells })
  }

  async function deleteCol(id) {
    if (!confirm('Spalte löschen?')) return
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
            {isOwner && (
              <button
                className="btn-danger"
                style={{ alignSelf: 'flex-start' }}
                onClick={async () => { if (confirm('Tabelle wirklich löschen?')) { await deleteTable(tableId); window.location.hash = '#/tables' } }}
              >
                Tabelle löschen
              </button>
            )}
          </div>
        }
      />

      <div style={styles.wrap}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cornerCell} />
                {cols.map((c) => (
                  <th key={c.id} style={styles.colHeader}>
                    <div style={styles.headerInner}>
                      <EditableLabel value={c.label} onCommit={(v) => renameCol(c.id, v)} />
                      <button style={styles.smallDelete} onClick={() => deleteCol(c.id)}>×</button>
                    </div>
                  </th>
                ))}
                <th style={styles.addHeaderCell}>
                  <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={addCol}>+ Spalte</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th style={styles.rowHeader}>
                    <div style={styles.headerInner}>
                      <EditableLabel value={r.label} onCommit={(v) => renameRow(r.id, v)} />
                      <button style={styles.smallDelete} onClick={() => deleteRow(r.id)}>×</button>
                    </div>
                  </th>
                  {cols.map((c) => {
                    const stats = cellStats(r.id, c.id)
                    return (
                      <td key={c.id} style={styles.cell} onClick={() => setActiveCell({ rowId: r.id, colId: c.id })}>
                        {stats.note && <div style={styles.cellNote}>{stats.note}</div>}
                        {stats.total > 0 && (
                          <div style={styles.cellBadgeRow}>
                            <span style={{
                              ...styles.cellBadge,
                              background: stats.open > 0 ? 'var(--accent-amber)' : 'var(--accent-sage)',
                            }}>
                              {stats.open > 0 ? `${stats.open} offen` : 'erledigt'}
                            </span>
                            <span style={styles.cellCount}>{stats.total} Karte{stats.total === 1 ? '' : 'n'}</span>
                          </div>
                        )}
                        {stats.total === 0 && !stats.note && <span style={styles.emptyHint}>+</span>}
                      </td>
                    )
                  })}
                  <td />
                </tr>
              ))}
              <tr>
                <th style={styles.addRowCell}>
                  <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={addRow}>+ Zeile</button>
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
    </div>
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
        style={{ fontSize: 13, padding: '3px 6px' }}
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
  wrap: { flex: 1, overflow: 'auto', padding: '20px 24px', background: 'var(--board-felt)' },
  tableScroll: { overflow: 'auto' },
  table: { borderCollapse: 'separate', borderSpacing: 6 },
  cornerCell: { width: 140 },
  colHeader: {
    background: 'var(--bg-surface)', border: '1px solid var(--line)', borderRadius: 6,
    padding: '8px 10px', minWidth: 150, fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: 14, color: 'var(--text-primary)', textAlign: 'left',
  },
  rowHeader: {
    background: 'var(--bg-surface)', border: '1px solid var(--line)', borderRadius: 6,
    padding: '8px 10px', minWidth: 140, fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: 14, color: 'var(--text-primary)', textAlign: 'left', verticalAlign: 'top',
  },
  headerInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  smallDelete: { background: 'none', color: 'var(--muted)', fontSize: 14, padding: '0 2px', flexShrink: 0 },
  addHeaderCell: { minWidth: 110, verticalAlign: 'middle' },
  addRowCell: { minWidth: 140, textAlign: 'left' },
  cell: {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 6,
    padding: '10px 12px', minWidth: 150, minHeight: 54, verticalAlign: 'top', cursor: 'pointer',
    color: 'var(--card-text)',
  },
  cellNote: { fontSize: 12.5, marginBottom: 6, lineHeight: 1.35, color: 'var(--card-text)' },
  cellBadgeRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cellBadge: { fontSize: 10, fontWeight: 700, color: '#1a1a1a', padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase' },
  cellCount: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' },
  emptyHint: { color: 'var(--muted)', fontSize: 14 },
}
