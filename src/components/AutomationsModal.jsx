import { useState } from 'react'
import { updateBoard } from '../lib/firestore'
import Select from './Select'
import ConfirmButton from './ConfirmButton'

const TRIGGERS = {
  moved: 'Karte wird in diese Liste verschoben',
  created: 'Neue Karte wird in dieser Liste erstellt',
}

const ACTIONS = {
  add_label: 'Kategorie hinzufügen',
  remove_label: 'Kategorie entfernen',
  mark_done: 'Als erledigt markieren',
  due_in_days: 'Fälligkeitsdatum setzen (in X Tagen)',
}

export default function AutomationsModal({ board, lists, onClose }) {
  const [rules, setRules] = useState(board.automations || [])
  const [trigger, setTrigger] = useState('moved')
  const [triggerListId, setTriggerListId] = useState(lists[0]?.id || '')
  const [action, setAction] = useState('add_label')
  const [actionLabelId, setActionLabelId] = useState(board.labels?.[0]?.id || '')
  const [actionDays, setActionDays] = useState(1)

  async function persist(next) {
    setRules(next)
    await updateBoard(board.id, { automations: next })
  }

  function addRule(e) {
    e.preventDefault()
    if (!triggerListId) return
    const rule = {
      id: crypto.randomUUID(),
      trigger,
      triggerListId,
      action,
      actionLabelId: action === 'add_label' || action === 'remove_label' ? actionLabelId : null,
      actionDays: action === 'due_in_days' ? Number(actionDays) : null,
    }
    persist([...rules, rule])
  }

  function deleteRule(id) {
    persist(rules.filter((r) => r.id !== id))
  }

  function describeRule(r) {
    const listName = lists.find((l) => l.id === r.triggerListId)?.title || '(gelöschte Liste)'
    const triggerText = `${TRIGGERS[r.trigger]}: „${listName}“`
    let actionText = ACTIONS[r.action]
    if (r.action === 'add_label' || r.action === 'remove_label') {
      const labelName = board.labels?.find((l) => l.id === r.actionLabelId)?.name || '(gelöschte Kategorie)'
      actionText += ` „${labelName}“`
    }
    if (r.action === 'due_in_days') {
      actionText = `Fälligkeitsdatum auf heute + ${r.actionDays} Tag(e) setzen`
    }
    return { triggerText, actionText }
  }

  const triggerOptions = Object.entries(TRIGGERS).map(([k, v]) => ({ value: k, label: v }))
  const listOptions = lists.map((l) => ({ value: l.id, label: l.title }))
  const actionOptions = Object.entries(ACTIONS).map(([k, v]) => ({ value: k, label: v }))
  const labelOptions = (board.labels || []).map((l) => ({ value: l.id, label: l.name }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <h2>Automationen</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {rules.map((r) => {
            const { triggerText, actionText } = describeRule(r)
            return (
              <div key={r.id} style={styles.ruleRow}>
                <div>
                  <div style={{ fontSize: 13 }}>Wenn: {triggerText}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Dann: {actionText}</div>
                </div>
                <ConfirmButton
                  style={styles.deleteBtn}
                  label="×"
                  confirmText="Regel löschen?"
                  onConfirm={() => deleteRule(r.id)}
                />
              </div>
            )
          })}
          {rules.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Regeln. Leg unten eine an.</p>
          )}
        </div>

        <label className="field-label">Neue Regel</label>
        <form onSubmit={addRule} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>Wenn</span>
            <Select value={trigger} onChange={setTrigger} options={triggerOptions} style={{ width: 'auto' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>Liste</span>
            <Select value={triggerListId} onChange={setTriggerListId} options={listOptions} style={{ width: 'auto' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>Dann</span>
            <Select value={action} onChange={setAction} options={actionOptions} style={{ width: 'auto' }} />
          </div>

          {(action === 'add_label' || action === 'remove_label') && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13 }}>Kategorie</span>
              {labelOptions.length > 0 ? (
                <Select value={actionLabelId} onChange={setActionLabelId} options={labelOptions} style={{ width: 'auto' }} />
              ) : (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Erst eine Kategorie anlegen</span>
              )}
            </div>
          )}

          {action === 'due_in_days' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>in</span>
              <input
                type="number"
                min={0}
                className="text-input"
                style={{ width: 70 }}
                value={actionDays}
                onChange={(e) => setActionDays(e.target.value)}
              />
              <span style={{ fontSize: 13 }}>Tag(en)</span>
            </div>
          )}

          <button className="btn" type="submit" style={{ alignSelf: 'flex-start' }}>Regel hinzufügen</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Fertig</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  ruleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    background: 'rgba(128,128,128,0.1)', padding: '10px 12px', borderRadius: 6,
  },
  deleteBtn: { background: 'none', color: 'var(--muted)', fontSize: 18, padding: '0 6px', flexShrink: 0 },
}
