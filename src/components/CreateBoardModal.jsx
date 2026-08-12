import { useState } from 'react'

const COLORS = ['#4c6b8a', '#c1502e', '#6b8f71', '#d4a017', '#6e4b69']

export const TEMPLATES = {
  blank: { label: 'Leer', lists: [] },
  kanban: { label: 'Kanban (To Do / Doing / Done)', lists: ['To Do', 'In Arbeit', 'Fertig'] },
  gtd: { label: 'GTD', lists: ['Posteingang', 'Als Nächstes', 'Warten auf', 'Eines Tages', 'Erledigt'] },
  content: { label: 'Content-Plan', lists: ['Ideen', 'In Arbeit', 'Review', 'Veröffentlicht'] },
  weekly: { label: 'Wochenplaner', lists: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Wochenende'] },
}

export default function CreateBoardModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [template, setTemplate] = useState('blank')

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate(title.trim(), color, TEMPLATES[template].lists)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Neues Board</h2>
        <form onSubmit={submit}>
          <label className="field-label">Titel</label>
          <input
            className="text-input"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Studium, Haushalt, Nebenprojekt …"
            style={{ marginBottom: 16 }}
          />
          <label className="field-label">Farbe</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c,
                  border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                }}
              />
            ))}
          </div>
          <label className="field-label">Vorlage</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <label key={key} style={styles.templateRow}>
                <input
                  type="radio"
                  name="template"
                  checked={template === key}
                  onChange={() => setTemplate(key)}
                />
                <span style={{ fontWeight: 600 }}>{t.label}</span>
                {t.lists.length > 0 && (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}> — {t.lists.join(' · ')}</span>
                )}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn">Erstellen</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  templateRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' },
}
