import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import CardItem from './CardItem'
import ContextMenu, { CtxItem, CtxSectionLabel, CtxDivider, useContextMenu } from './ContextMenu'

const LIST_COLORS = [null, '#6b8f71', '#d4a017', '#c1502e', '#4c6b8a', '#6e4b69', '#8a9a5b']

export default function List({
  list, cards, labels, onAddCard, onCardClick, onDeleteList, onRenameList, onRecolorList,
  onQuickUpdateCard, onDeleteCard,
}) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(list.title)
  const { menu, open, close } = useContextMenu()

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
    <div
      style={{
        ...styles.list,
        background: list.color
          ? `color-mix(in srgb, ${list.color} 24%, var(--board-felt))`
          : 'rgba(128,128,128,0.08)',
      }}
    >
      <div style={styles.header} onContextMenu={open}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={styles.count}>{cards.length}</span>
          <button style={styles.menuBtn} onClick={open} title="Optionen">⋯</button>
        </div>
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
                onQuickUpdate={(data) => onQuickUpdateCard(card.id, data)}
                onDelete={() => onDeleteCard(card.id)}
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

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={close}>
          <CtxItem onClick={() => { setEditingTitle(true); close() }} icon="✎">Umbenennen</CtxItem>
          <CtxDivider />
          <CtxSectionLabel>Farbe</CtxSectionLabel>
          <div style={{ display: 'flex', gap: 6, padding: '4px 10px 8px', flexWrap: 'wrap' }}>
            {LIST_COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => { onRecolorList(c); close() }}
                style={{
                  width: 20, height: 20, borderRadius: 5,
                  background: c || 'transparent',
                  border: c ? (list.color === c ? '2px solid var(--text-primary)' : '2px solid transparent') : '2px dashed var(--muted)',
                }}
                title={c || 'Keine Farbe'}
              />
            ))}
          </div>
          <CtxDivider />
          <CtxItem danger onClick={() => { onDeleteList(); close() }} icon="🗑">Liste löschen</CtxItem>
        </ContextMenu>
      )}
    </div>
  )
}

const styles = {
  list: {
    background: 'rgba(128,128,128,0.08)', borderRadius: 8, padding: '12px 10px',
    width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column',
    maxHeight: '100%',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, margin: 0,
    cursor: 'text', color: 'var(--text-primary)', lineHeight: 1.25,
  },
  menuBtn: { background: 'none', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '0 4px' },
  count: {
    fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
    background: 'rgba(128,128,128,0.15)', padding: '2px 7px', borderRadius: 10,
  },
  dropZone: { minHeight: 6, flex: '0 1 auto', overflowY: 'auto', padding: '2px 2px' },
  addBtn: {
    background: 'none', color: 'var(--muted)', fontSize: 13, textAlign: 'left',
    padding: '8px', borderRadius: 6, marginTop: 4,
  },
}
