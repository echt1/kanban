import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { isDiscord } from '../discord'
import { discordLogin, discordSession } from '../lib/discordAuth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = lädt noch, null = ausgeloggt
  const [discordError, setDiscordError] = useState(null)

  useEffect(() => {
    let unsub = () => {}
    let cancelled = false

    async function start() {
      // In Discord zuerst automatisch per Discord anmelden
      if (isDiscord) {
        try {
          await discordLogin()
        } catch (e) {
          console.error('Discord-Login fehlgeschlagen:', e)
          setDiscordError(e.message || 'Discord-Login fehlgeschlagen')
        }
      }
      if (cancelled) return
      unsub = onAuthStateChanged(auth, async (u) => {
        if (!u) { setUser(null); return }
        let claims = {}
        try { claims = (await u.getIdTokenResult()).claims } catch { /* ignorieren */ }
        setUser({
          uid: u.uid,
          // Bei Discord-Login (Custom Token) steckt die E-Mail in den Claims
          email: u.email || claims.email || '',
          photoURL: u.photoURL || discordSession.discord?.avatar || null,
          displayName: u.displayName || discordSession.discord?.name || null,
          isDiscordOnly: u.uid.startsWith('discord_'),
        })
      })
    }
    start()
    return () => { cancelled = true; unsub() }
  }, [])

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, logout, loading: user === undefined, discordError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
