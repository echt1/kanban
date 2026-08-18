import { useEffect, useMemo, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { doc, onSnapshot, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeLists, subscribeCards, createList, updateList, deleteList,
  createCard, createCardFull, updateCard, deleteCard, ensureMembership, addComment,
  updateBoard, deleteBoard, upsertPresence, subscribePresence,
} from '../lib/firestore'
import Navbar from '../components/Navbar'
import List from '../components/List'
import CardModal from '../components/CardModal'
import MembersModal from '../components/MembersModal'
import ManageLabelsModal from '../components/ManageLabelsModal'
import BackgroundModal from '../components/BackgroundModal'
import AutomationsModal from '../components/AutomationsModal'
import IconButton from '../components/IconButton'
import AvatarBubble from '../components/AvatarBubble'
import ConfirmButton from '../components/ConfirmButton'

export default function BoardPage() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [board, setBoard] = useState(undefined)
  const [lists, setLists] = useState([])
  const [cards, setCards] = useState([])
  const [activeCard, setActiveCard] = useState(null)
  const [showMembers, setShowMembers] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [showBackground, setShowBackground] = useState(false)
  const [showAutomations, setShowAutomations] = useState(false)
  const [addingList, setAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [search, setSearch] = useState('')
  const [boardTitleDraft, setBoardTitleDraft] = useState('')
  const [presence, setPresence] = useState([])
  const [compactLabels, setCompactLabels] = useState(false)

  useEffect(() => {
    upsertPresence(boardId, user.uid, user.email, user.photoURL)
    const interval = setInterval(() => upsertPresence(boardId, user.uid, user.email, user.photoURL), 15000)
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        upsertPresence(boardId, user.uid, user.email, user.photoURL)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    const unsubPresence = subscribePresence(boardId, setPresence)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      unsubPresence()
    }
  }, [boardId, user.uid, user.email, user.photoURL])

  useEffect(() => {
    if (board) setBoardTitleDraft(board.title)
  }, [board?.title])

  useEffect(() => {
    ensureMembership(boardId, user.uid)
    const unsubBoard = onSnapshot(doc(db, 'boards', boardId), (snap) => {
      setBoard(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
    const unsubLists = subscribeLists(boardId, setLists)
    const unsubCards = subscribeCards(boardId, setCards)
    return () => { unsubBoard(); unsubLists(); unsubCards() }
  }, [boardId, user.uid])

  // Hält activeCard mit Live-Daten synchron, damit das Modal nach externen Änderungen aktuell bleibt
  useEffect(() => {
    if (!activeCard) return
    const fresh = cards.find((c) => c.id === activeCard.id)
    if (fresh && fresh !== activeCard) setActiveCard(fresh)
    if (!fresh) setActiveCard(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards])

  useEffect(() => {
    if (board?.title) document.title = `${board.title} – Kanban`
    return () => { document.title = 'Kanban' }
  }, [board?.title])

  const cardsByList = useMemo(() => {
    const map = {}
    for (const l of lists) map[l.id] = []
    for (const c of cards) {
      if (!map[c.listId]) map[c.listId] = []
      map[c.listId].push(c)
    }
    return map
  }, [lists, cards])

  if (board === null) return <Navigate to="/" replace />
  if (board === undefined) return null

  async function handleAddList(e) {
    e.preventDefault()
    if (!newListTitle.trim()) { setAddingList(false); return }
    await createList(boardId, newListTitle.trim(), lists.length)
    setNewListTitle('')
    setAddingList(false)
  }

  async function handleDeleteCard(cardId) {
    await deleteCard(boardId, cardId)
  }

  function nextDueDate(isoDate, freq) {
    const d = isoDate ? new Date(isoDate) : new Date()
    if (freq === 'daily') d.setDate(d.getDate() + 1)
    if (freq === 'weekly') d.setDate(d.getDate() + 7)
    if (freq === 'monthly') d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  }

  // Zentrale Stelle für alle Kartenänderungen: kümmert sich zusätzlich um den
  // Wiederholungs-Mechanismus (legt bei Erledigen einer wiederkehrenden Karte
  // automatisch die nächste Instanz an).
  async function handleCardUpdate(cardId, data) {
    const card = cards.find((c) => c.id === cardId)
    if (card && data.done === true && card.done !== true && card.repeat?.freq && card.dueDate) {
      const listCards = cardsByList[card.listId] || []
      await createCardFull(boardId, card.listId, {
        title: card.title,
        description: card.description,
        labelIds: card.labelIds,
        checklist: card.checklist,
        link: card.link,
        cover: card.cover,
        repeat: card.repeat,
        dueDate: nextDueDate(card.dueDate, card.repeat.freq),
      }, listCards.length)
      await updateCard(boardId, cardId, { ...data, repeat: null })
      return
    }
    await updateCard(boardId, cardId, data)
  }

  async function applyAutomations(triggerType, listId, cardId) {
    const rules = (board.automations || []).filter((r) => r.trigger === triggerType && r.triggerListId === listId)
    for (const rule of rules) {
      if (rule.action === 'add_label' && rule.actionLabelId) {
        const card = cards.find((c) => c.id === cardId)
        const next = Array.from(new Set([...(card?.labelIds || []), rule.actionLabelId]))
        await updateCard(boardId, cardId, { labelIds: next })
      } else if (rule.action === 'remove_label' && rule.actionLabelId) {
        const card = cards.find((c) => c.id === cardId)
        await updateCard(boardId, cardId, { labelIds: (card?.labelIds || []).filter((id) => id !== rule.actionLabelId) })
      } else if (rule.action === 'mark_done') {
        await handleCardUpdate(cardId, { done: true })
      } else if (rule.action === 'due_in_days') {
        const d = new Date()
        d.setDate(d.getDate() + (rule.actionDays || 0))
        await updateCard(boardId, cardId, { dueDate: d.toISOString().slice(0, 10) })
      }
    }
  }

  async function handleAddCard(listId, title) {
    const listCards = cardsByList[listId] || []
    const ref = await createCard(boardId, listId, title, listCards.length)
    await applyAutomations('created', listId, ref.id)
  }

  async function handleDragEnd(result) {
    const { source, destination, type } = result
    if (!destination) return

    if (type === 'LIST') {
      if (source.index === destination.index) return
      const reordered = Array.from(lists).sort((a, b) => a.order - b.order)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)
      setLists(reordered.map((l, i) => ({ ...l, order: i })))
      const batch = writeBatch(db)
      reordered.forEach((l, i) => {
        batch.update(doc(db, 'boards', boardId, 'lists', l.id), { order: i })
      })
      await batch.commit()
      return
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourceListId = source.droppableId
    const destListId = destination.droppableId

    const sourceCards = Array.from(cardsByList[sourceListId] || [])
    const [moved] = sourceCards.splice(source.index, 1)

    const destCards = sourceListId === destListId
      ? sourceCards
      : Array.from(cardsByList[destListId] || [])

    destCards.splice(destination.index, 0, { ...moved, listId: destListId })

    setCards((prev) => {
      const others = prev.filter((c) => c.listId !== sourceListId && c.listId !== destListId)
      const updatedSource = sourceListId === destListId ? [] : sourceCards
      return [...others, ...updatedSource, ...destCards]
    })

    const batch = writeBatch(db)
    destCards.forEach((c, i) => {
      batch.update(doc(db, 'boards', boardId, 'cards', c.id), { order: i, listId: destListId })
    })
    if (sourceListId !== destListId) {
      sourceCards.forEach((c, i) => {
        batch.update(doc(db, 'boards', boardId, 'cards', c.id), { order: i })
      })
    }
    await batch.commit()

    if (sourceListId !== destListId) {
      await applyAutomations('moved', destListId, moved.id)
    }
  }

  const isOwner = board.ownerId === user.uid

  const boardAreaStyle = board.background?.type === 'image' && board.background.value
    ? { ...styles.boardArea, backgroundImage: `url(${board.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : board.background?.type === 'color' && board.background.value
      ? { ...styles.boardArea, background: board.background.value }
      : styles.boardArea

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        boardTitle={board.title}
        centerSlot={
          <input
            className="text-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen …"
            style={{ width: 220, padding: '7px 10px' }}
          />
        }
        icons={
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8, marginRight: 4 }}>
              {presence
                .filter((p) => Date.now() - p.lastSeen < 60000)
                .map((p) => <AvatarBubble key={p.id} email={p.email} photoURL={p.photoURL} overlap />)}
            </div>
            <IconButton icon="labels" emoji="🏷" title="Kategorien" onClick={() => setShowLabels(true)} />
            <IconButton icon="automations" emoji="⚡" title="Automationen" onClick={() => setShowAutomations(true)} />
            <IconButton icon="members" emoji="👥" title="Mitglieder" onClick={() => setShowMembers(true)} />
          </>
        }
        boardSettingsSection={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="field-label">Titel</label>
              <input
                className="text-input"
                value={boardTitleDraft}
                onChange={(e) => setBoardTitleDraft(e.target.value)}
                onBlur={() => boardTitleDraft.trim() && boardTitleDraft !== board.title && updateBoard(boardId, { title: boardTitleDraft.trim() })}
                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              />
            </div>

            <button className="btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowBackground(true)}>
              Hintergrund ändern
            </button>

            <div>
              <label className="field-label">Nur-Lese-Freigabe</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!board.public}
                  onChange={(e) => updateBoard(boardId, { public: e.target.checked })}
                />
                Board per Link ansehbar machen (ohne Login, ohne Bearbeitungsrechte)
              </label>
              {board.public && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    className="text-input"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#/view/${boardId}`}
                    onClick={(e) => e.target.select()}
                    style={{ fontSize: 12 }}
                  />
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 12, flexShrink: 0 }}
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/view/${boardId}`)}
                  >
                    Kopieren
                  </button>
                </div>
              )}
            </div>
            {isOwner && (
              <ConfirmButton
                className="btn-danger"
                style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: 14, fontWeight: 600, borderRadius: 6 }}
                label="Board löschen"
                confirmText="Board wirklich löschen? Das kann nicht rückgängig gemacht werden."
                onConfirm={async () => { await deleteBoard(boardId); navigate('/') }}
              />
            )}
          </div>
        }
      />

      <div style={boardAreaStyle}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board-lists" direction="horizontal" type="LIST">
            {(listsProvided) => (
              <div style={styles.listsRow} ref={listsProvided.innerRef} {...listsProvided.droppableProps}>
                {lists.map((list, idx) => (
                  <Draggable key={list.id} draggableId={`list-${list.id}`} index={idx}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{ height: '100%', ...dragProvided.draggableProps.style }}
                      >
                        <List
                          list={list}
                          cards={(cardsByList[list.id] || []).slice().sort((a, b) => a.order - b.order)}
                          labels={board.labels || []}
                          members={board.memberEmails || []}
                          search={search}
                          dragHandleProps={dragProvided.dragHandleProps}
                          compactLabels={compactLabels}
                          onToggleCompactLabels={() => setCompactLabels((v) => !v)}
                          onAddCard={(title) => handleAddCard(list.id, title)}
                          onCardClick={(card) => setActiveCard(card)}
                          onDeleteList={() => deleteList(boardId, list.id)}
                          onRenameList={(title) => updateList(boardId, list.id, { title })}
                          onRecolorList={(color) => updateList(boardId, list.id, { color })}
                          onQuickUpdateCard={handleCardUpdate}
                          onDeleteCard={handleDeleteCard}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {listsProvided.placeholder}

            <div style={styles.newList}>
              {addingList ? (
                <form onSubmit={handleAddList}>
                  <input
                    autoFocus
                    className="text-input"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setAddingList(false)}
                    placeholder="Listentitel …"
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" style={{ fontSize: 13, padding: '6px 12px' }}>Hinzufügen</button>
                    <button type="button" className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => setAddingList(false)}>×</button>
                  </div>
                </form>
              ) : (
                <button style={styles.addListBtn} onClick={() => setAddingList(true)}>+ Liste hinzufügen</button>
              )}
            </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {activeCard && (
        <CardModal
          card={activeCard}
          labels={board.labels || []}
          members={board.memberEmails || []}
          currentUserEmail={user.email}
          onClose={() => setActiveCard(null)}
          onSave={(data) => handleCardUpdate(activeCard.id, data)}
          onDelete={async () => { await deleteCard(boardId, activeCard.id); setActiveCard(null) }}
          onManageLabels={() => setShowLabels(true)}
          onAddComment={(text) => addComment(boardId, activeCard.id, text, user.email)}
        />
      )}

      {showMembers && <MembersModal board={board} isOwner={isOwner} onClose={() => setShowMembers(false)} />}
      {showLabels && <ManageLabelsModal board={board} onClose={() => setShowLabels(false)} />}
      {showBackground && (
        <BackgroundModal
          value={board.background}
          onSave={(bg) => updateBoard(boardId, { background: bg })}
          onClose={() => setShowBackground(false)}
        />
      )}
      {showAutomations && <AutomationsModal board={board} lists={lists} onClose={() => setShowAutomations(false)} />}
    </div>
  )
}

const styles = {
  boardArea: {
    flex: 1, overflowX: 'auto', padding: '20px 24px',
    background: 'var(--board-felt)',
  },
  listsRow: { display: 'flex', gap: 16, height: '100%', alignItems: 'flex-start' },
  newList: { width: 268, flexShrink: 0 },
  addListBtn: {
    background: 'rgba(128,128,128,0.1)', color: 'var(--muted)', fontSize: 14,
    textAlign: 'left', padding: '10px 12px', borderRadius: 8, width: '100%',
  },
}
