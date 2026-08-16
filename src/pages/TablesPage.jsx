import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeTables, createTable, deleteTable } from '../lib/firestore'
import Navbar from '../components/Navbar'
import ConfirmButton from '../components/ConfirmButton'

const STUNDENPLAN_COLS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].map((label, i) => ({ id: crypto.randomUUID(), label, order: i }))
const STUNDENPLAN_ROWS = ['1. Stunde', '2. Stunde', '3. Stunde', '4. Stunde', '5. Stunde', '6. Stunde'].map((label, i) => ({ id: crypto.randomUUID(), label, order: i }))

export default function TablesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tables, setTables] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState('blank')

  useEffect(() => {
    const unsub = subscribeTables(user.uid, user.email, setTables)
    return unsub
  }, [user])

  async function handleCreate(e, bulkMode) {
    e.preventDefault()
    if (!title.trim()) return
    const rows = template === 'stundenplan' ? STUNDENPLAN_ROWS : [{ id: crypto.randomUUID(), label: 'Zeile 1', order: 0 }]
    const cols = template === 'stundenplan' ? STUNDENPLAN_COLS : [{ id: crypto.randomUUID(), label: 'Spalte 1', order: 0 }]
    const ref = await createTable(title.trim(), user.uid, user.email, rows, cols)
    setTitle('')
    if (bulkMode) {
      // Modal bleibt offen für schnelle Serienerstellung (Shift gehalten)
    } else {
      setShowCreate(false)
      navigate(`/tables/${ref.id}`)
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: 0 }}>Tabellen</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Boards
            </Link>
            <button className="btn" onClick={() => setShowCreate(true)}>+ Neue Tabelle</button>
          </div>
        </div>

        {tables === null && <p style={{ color: 'var(--muted)' }}>lädt …</p>}

        {tables && tables.length === 0 && (
          <div style={styles.empty}>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
              Noch keine Tabelle. Praktisch z.B. für einen Stundenplan, aus dem heraus du offene Kanban-Karten verlinkst.
            </p>
            <button className="btn" onClick={() => setShowCreate(true)}>+ Neue Tabelle</button>
          </div>
        )}

        <div style={styles.grid}>
          {tables?.map((t) => (
            <Link key={t.id} to={`/tables/${t.id}`} style={{ textDecoration: 'none' }}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>{t.title}</h3>
                <div style={styles.cardFooter}>
                  <span style={styles.dims}>{(t.rows || []).length} × {(t.columns || []).length}</span>
                  {t.ownerId === user.uid && (
                    <ConfirmButton
                      style={styles.deleteBtn}
                      label="löschen"
                      confirmText="Tabelle wirklich löschen?"
                      onConfirm={() => deleteTable(t.id)}
                    />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Neue Tabelle</h2>
            <form onSubmit={(e) => handleCreate(e, false)}>
              <label className="field-label">Titel</label>
              <input
                className="text-input"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Stundenplan, Wochenübersicht …"
                style={{ marginBottom: 16 }}
              />
              <label className="field-label">Vorlage</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                <label style={styles.templateRow}>
                  <input type="radio" name="tabletemplate" checked={template === 'blank'} onChange={() => setTemplate('blank')} />
                  <span style={{ fontWeight: 600 }}>Leer</span>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}> — 1 Zeile, 1 Spalte zum Start</span>
                </label>
                <label style={styles.templateRow}>
                  <input type="radio" name="tabletemplate" checked={template === 'stundenplan'} onChange={() => setTemplate('stundenplan')} />
                  <span style={{ fontWeight: 600 }}>Stundenplan</span>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}> — Mo–Fr × 6 Stunden</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Shift+Klick = weitere erstellen, Modal bleibt offen</span>
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Abbrechen</button>
                <button
                  type="button"
                  className="btn"
                  onClick={(e) => handleCreate(e, e.shiftKey)}
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 },
  card: {
    background: 'var(--bg-surface)', border: '1px solid var(--line)', borderRadius: 8,
    padding: '20px 18px', minHeight: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, color: 'var(--text-primary)' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  dims: { fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' },
  deleteBtn: { background: 'none', color: 'var(--muted)', fontSize: 12, padding: 0 },
  empty: { border: '1px dashed var(--line)', borderRadius: 10, padding: '48px 20px', textAlign: 'center', marginBottom: 24 },
  templateRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' },
}
