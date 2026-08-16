import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot,
  query, orderBy, where, serverTimestamp, arrayUnion, arrayRemove, getDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

/* ---------- Boards ---------- */

export function subscribeBoards(uid, email, callback) {
  // Firestore-Regeln prüfen pro Board "uid in members ODER email in memberEmails".
  // Eine ungefilterte Collection-Query würde das nicht erfüllen (permission-denied),
  // deshalb zwei gezielte array-contains-Queries, deren Ergebnisse wir mergen.
  let membersResult = []
  let emailResult = []

  function emit() {
    const merged = new Map()
    for (const b of [...membersResult, ...emailResult]) merged.set(b.id, b)
    const boards = Array.from(merged.values()).sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0
      const tb = b.createdAt?.toMillis?.() || 0
      return tb - ta
    })
    callback(boards)
  }

  const qByMember = query(collection(db, 'boards'), where('members', 'array-contains', uid))
  const qByEmail = query(collection(db, 'boards'), where('memberEmails', 'array-contains', email))

  const unsub1 = onSnapshot(qByMember, (snap) => {
    membersResult = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    emit()
  })
  const unsub2 = onSnapshot(qByEmail, (snap) => {
    emailResult = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    emit()
  })

  return () => { unsub1(); unsub2() }
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

// Für Repeater-Kopien: legt eine Karte mit beliebigen vorbefüllten Feldern an
export async function createCardFull(boardId, listId, data, order) {
  return addDoc(collection(db, 'boards', boardId, 'cards'), {
    listId,
    title: data.title || 'Karte',
    description: data.description || '',
    dueDate: data.dueDate || null,
    labelIds: data.labelIds || [],
    link: data.link || null,
    cover: data.cover || null,
    checklist: (data.checklist || []).map((it) => ({ ...it, done: false })),
    repeat: data.repeat || null,
    done: false,
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

export async function addComment(boardId, cardId, text, authorEmail) {
  const comment = { id: crypto.randomUUID(), text, authorEmail, createdAt: Date.now() }
  return updateDoc(doc(db, 'boards', boardId, 'cards', cardId), {
    comments: arrayUnion(comment),
  })
}

/* ---------- Presence (wer schaut sich das Board gerade an) ---------- */

export async function upsertPresence(boardId, uid, email, photoURL) {
  return setDoc(doc(db, 'boards', boardId, 'presence', uid), {
    email, photoURL: photoURL || null, lastSeen: Date.now(),
  })
}

export function subscribePresence(boardId, callback) {
  return onSnapshot(collection(db, 'boards', boardId, 'presence'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

/* ---------- Tabellen (eigenständiges Feature, verlinkt auf Kanban-Karten) ---------- */

export function subscribeTables(uid, email, callback) {
  let membersResult = []
  let emailResult = []

  function emit() {
    const merged = new Map()
    for (const t of [...membersResult, ...emailResult]) merged.set(t.id, t)
    const tables = Array.from(merged.values()).sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0
      const tb = b.createdAt?.toMillis?.() || 0
      return tb - ta
    })
    callback(tables)
  }

  const qByMember = query(collection(db, 'tables'), where('members', 'array-contains', uid))
  const qByEmail = query(collection(db, 'tables'), where('memberEmails', 'array-contains', email))

  const unsub1 = onSnapshot(qByMember, (snap) => {
    membersResult = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    emit()
  })
  const unsub2 = onSnapshot(qByEmail, (snap) => {
    emailResult = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    emit()
  })

  return () => { unsub1(); unsub2() }
}

export async function createTable(title, uid, email, rows, columns) {
  return addDoc(collection(db, 'tables'), {
    title,
    ownerId: uid,
    members: [uid],
    memberEmails: [email],
    rows: rows || [],
    columns: columns || [],
    cells: {},
    createdAt: serverTimestamp(),
  })
}

export async function updateTable(tableId, data) {
  return updateDoc(doc(db, 'tables', tableId), data)
}

export async function deleteTable(tableId) {
  return deleteDoc(doc(db, 'tables', tableId))
}

/* ---------- Persönliche Einstellungen (z.B. Kalender-Hintergrund) ---------- */

export function subscribeUserSettings(uid, callback) {
  return onSnapshot(doc(db, 'userSettings', uid), (snap) => {
    callback(snap.exists() ? snap.data() : {})
  })
}

export async function updateUserSettings(uid, data) {
  return setDoc(doc(db, 'userSettings', uid), data, { merge: true })
}
