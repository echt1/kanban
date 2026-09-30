import { isDiscord } from './discord'
import { initializeApp } from 'firebase/app'
import {
  getAuth, initializeAuth, GoogleAuthProvider,
  indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence,
} from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'

// Diese Werte kommen aus deiner .env.local (siehe .env.example).
// Firebase Web-Config ist zwar kein Geheimnis, aber sauberer ist sauberer.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// In Discord: kein Popup/iframe-Resolver (der lädt Google-Skripte, die geblockt werden)
// und Firestore per Long-Polling (funktioniert zuverlässiger hinter dem Proxy).
export const auth = isDiscord
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
    })
  : getAuth(app)

export const db = isDiscord
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app)

export const googleProvider = new GoogleAuthProvider()
