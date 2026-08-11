import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove, getDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

/* ---------- Boards ---------- */

export function subscribeBoards(uid, email, callback) {
  // Wir laden alle Boards und filtern client-seitig nach Mitgliedschaft,
  // da Firestore keine "array-contains OR email-contains" Query in einem Call kann.
  const q = query(collection(db, 'boards'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const boards = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (b) =>
          (b.members || []).includes(uid) ||
          (b.memberEmails || []).includes(email)
      )
    callback(boards)
  })
}

export async function createBoard(title, color, uid, email) {
  return addDoc(collection(db, 'boards'), {
    title,
    color,
    ownerId: uid,
    members: [uid],
    memberEmails: [email],
    labels: [
      { id: 'l1', name: 'Wichtig', color: '#c1502e' },
      { id: 'l2', name: 'Warten', color: '#d4a017' },
      { id: 'l3', name: 'Erledigt bald', color: '#6b8f71' },
    ],
    createdAt: serverTimestamp(),
  })
}

export async function updateBoard(boardId, data) {
  return updateDoc(doc(db, 'boards', boardId), data)
}

export async function deleteBoard(boardId) {
  return deleteDoc(doc(db, 'boards', boardId))
}

export async function inviteMember(boardId, email) {
  return updateDoc(doc(db, 'boards', boardId), {
    memberEmails: arrayUnion(email.toLowerCase().trim()),
  })
}

export async function removeMember(boardId, email, uid) {
  const updates = { memberEmails: arrayRemove(email.toLowerCase().trim()) }
  if (uid) updates.members = arrayRemove(uid)
  return updateDoc(doc(db, 'boards', boardId), updates)
}

// Fügt die eigene UID zu members hinzu, falls man per E-Mail eingeladen wurde
// (wird beim Öffnen eines Boards aufgerufen).
export async function ensureMembership(boardId, uid) {
  const ref = doc(db, 'boards', boardId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  if (!(data.members || []).includes(uid)) {
    await updateDoc(ref, { members: arrayUnion(uid) })
  }
}

/* ---------- Lists ---------- */

export function subscribeLists(boardId, callback) {
  const q = query(collection(db, 'boards', boardId, 'lists'), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function createList(boardId, title, order) {
  return addDoc(collection(db, 'boards', boardId, 'lists'), { title, order })
}

export async function updateList(boardId, listId, data) {
  return updateDoc(doc(db, 'boards', boardId, 'lists', listId), data)
}

export async function deleteList(boardId, listId) {
  return deleteDoc(doc(db, 'boards', boardId, 'lists', listId))
}

/* ---------- Cards ---------- */

export function subscribeCards(boardId, callback) {
  const q = query(collection(db, 'boards', boardId, 'cards'), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function createCard(boardId, listId, title, order) {
  return addDoc(collection(db, 'boards', boardId, 'cards'), {
    listId,
    title,
    description: '',
    dueDate: null,
    labelIds: [],
    order,
    createdAt: serverTimestamp(),
  })
}

export async function updateCard(boardId, cardId, data) {
  return updateDoc(doc(db, 'boards', boardId, 'cards', cardId), data)
}

export async function deleteCard(boardId, cardId) {
  return deleteDoc(doc(db, 'boards', boardId, 'cards', cardId))
}
