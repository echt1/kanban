import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import CardItem from './CardItem'

export default function List({ list, cards, labels, onAddCard, onCardClick, onDeleteList, onRenameList }) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(list.title)

  function submitCard(e) {
    e.preventDefault()
    if (!newTitle.trim()) { setAdding(false); return }
    onAddCard(newTitle.trim())
    setNewTitle('')
  }

  function submitTitle() {
    setEditingTitle(false)
    if (titleDraft.trim() && titleDraft !== list.title) onRenameList(titleDraft.trim())
  }

  return (
    <div style={styles.list}>
      <div style={styles.header}>
        {editingTitle ? (
          <input
            autoFocus
            className="text-input"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={submitTitle}
            onKeyDown={(e) => e.key === 'Enter' && submitTitle()}
            style={{ fontSize: 14, padding: '4px 8px' }}
          />
        ) : (
          <h3 style={styles.title} onClick={() => setEditingTitle(true)}>{list.title}</h3>
        )}
        <button style={styles.deleteListBtn} onClick={onDeleteList} title="Liste löschen">×</button>
      </div>

      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              ...styles.dropZone,
              background: snapshot.isDraggingOver ? 'rgba(212,160,23,0.08)' : 'transparent',
            }}
          >
            {cards.map((card, i) => (
              <CardItem
                key={card.id}
                card={card}
                index={i}
                labels={labels}
                onClick={() => onCardClick(card)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {adding ? (
        <form onSubmit={submitCard}>
          <textarea
            autoFocus
            className="text-input"
            rows={2}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCard(e) }
              if (e.key === 'Escape') setAdding(false)
            }}
            placeholder="Titel der Karte …"
            style={{ marginBottom: 6, resize: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn" style={{ fontSize: 13, padding: '6px 12px' }}>Hinzufügen</button>
            <button type="button" className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => setAdding(false)}>×</button>
          </div>
        </form>
      ) : (
        <button style={styles.addBtn} onClick={() => setAdding(true)}>+ Karte hinzufügen</button>
      )}
    </div>
  )
}

const styles = {
  list: {
    background: 'rgba(0,0,0,0.18)', borderRadius: 8, padding: '12px 10px',
    width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column',
    maxHeight: '100%',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, margin: 0,
    cursor: 'text', color: 'var(--paper)',
  },
  deleteListBtn: { background: 'none', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: '0 4px' },
  dropZone: { minHeight: 6, flex: '0 1 auto', overflowY: 'auto', padding: '2px 2px' },
  addBtn: {
    background: 'none', color: 'var(--muted)', fontSize: 13, textAlign: 'left',
    padding: '8px', borderRadius: 6, marginTop: 4,
  },
}
