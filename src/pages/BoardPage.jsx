import { useEffect, useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { DragDropContext } from '@hello-pangea/dnd'
import { doc, onSnapshot, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeLists, subscribeCards, createList, updateList, deleteList,
  createCard, updateCard, deleteCard, ensureMembership,
} from '../lib/firestore'
import Navbar from '../components/Navbar'
import List from '../components/List'
import CardModal from '../components/CardModal'
import MembersModal from '../components/MembersModal'
import ManageLabelsModal from '../components/ManageLabelsModal'
import BackgroundModal from '../components/BackgroundModal'

export default function BoardPage() {
  const { boardId } = useParams()
  const { user } = useAuth()
  const [board, setBoard] = useState(undefined)
  const [lists, setLists] = useState([])
  const [cards, setCards] = useState([])
  const [activeCard, setActiveCard] = useState(null)
  const [showMembers, setShowMembers] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [showBackground, setShowBackground] = useState(false)
  const [addingList, setAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')

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
    if (confirm('Karte löschen?')) await deleteCard(boardId, cardId)
  }

  async function handleDragEnd(result) {
    const { source, destination } = result
    if (!destination) return
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
        rightSlot={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={() => setShowBackground(true)}>Hintergrund</button>
            <button className="btn-ghost" onClick={() => setShowLabels(true)}>Kategorien</button>
            <button className="btn-ghost" onClick={() => setShowMembers(true)}>
              Mitglieder ({board.memberEmails?.length || 1})
            </button>
          </div>
        }
      />

      <div style={boardAreaStyle}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={styles.listsRow}>
            {lists.map((list) => (
              <List
                key={list.id}
                list={list}
                cards={(cardsByList[list.id] || []).slice().sort((a, b) => a.order - b.order)}
                labels={board.labels || []}
                onAddCard={(title) => createCard(boardId, list.id, title, (cardsByList[list.id] || []).length)}
                onCardClick={(card) => setActiveCard(card)}
                onDeleteList={() => confirm('Liste und alle Karten darin löschen?') && deleteList(boardId, list.id)}
                onRenameList={(title) => updateList(boardId, list.id, { title })}
                onRecolorList={(color) => updateList(boardId, list.id, { color })}
                onQuickUpdateCard={(cardId, data) => updateCard(boardId, cardId, data)}
                onDeleteCard={handleDeleteCard}
              />
            ))}

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
        </DragDropContext>
      </div>

      {activeCard && (
        <CardModal
          card={activeCard}
          labels={board.labels || []}
          onClose={() => setActiveCard(null)}
          onSave={(data) => updateCard(boardId, activeCard.id, data)}
          onDelete={async () => { await deleteCard(boardId, activeCard.id); setActiveCard(null) }}
          onManageLabels={() => setShowLabels(true)}
        />
      )}

      {showMembers && <MembersModal board={board} isOwner={isOwner} onClose={() => setShowMembers(false)} />}
      {showLabels && <ManageLabelsModal board={board} onClose={() => setShowLabels(false)} />}
      {showBackground && <BackgroundModal board={board} onClose={() => setShowBackground(false)} />}
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
