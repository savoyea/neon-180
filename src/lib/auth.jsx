import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { pb } from './pocketbase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.isValid ? pb.authStore.model : null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      if (pb.authStore.isValid) {
        await loadProfile(pb.authStore.model.id)
      }
      setLoading(false)
    }
    init()

    const unsub = pb.authStore.onChange((_token, model) => {
      setUser(model || null)
      if (model) loadProfile(model.id)
      else setProfile(null)
    })
    return () => unsub()
  }, [])

  async function loadProfile(id) {
    try {
      const data = await pb.collection('users').getOne(id)
      setProfile(data)
    } catch {
      setProfile({ id, username: 'Joueur', level: 1, xp: 0 })
    }
  }

  // ----- Inscription -----
  const signUp = useCallback(async ({ username, email, password }) => {
    try {
      await pb.collection('users').create({
        username, email, password, passwordConfirm: password,
      })
      await pb.collection('users').authWithPassword(email, password)
      // Le hook PocketBase crée automatiquement le profil après création
      return { error: null }
    } catch (e) {
      return { error: { message: e.message } }
    }
  }, [])

  // ----- Connexion -----
  const signIn = useCallback(async ({ email, password }) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (e) {
      return { error: { message: e.message } }
    }
  }, [])

  // Recharge le profil depuis la base (après une partie).
  const refreshProfile = useCallback(async () => {
    if (user?.id) await loadProfile(user.id)
  }, [user])

  // ----- Mise à jour du profil -----
  const updateProfile = useCallback(async (fields) => {
    const uid = user?.id
    if (!uid) return { error: null }
    try {
      const data = await pb.collection('users').update(uid, fields)
      setProfile(data)
      return { error: null }
    } catch (e) {
      return { error: { message: e.message } }
    }
  }, [user])

  // ----- Déconnexion -----
  const signOut = useCallback(async () => {
    pb.authStore.clear()
    setUser(null)
    setProfile(null)
  }, [])

  const value = {
    session: user ? { user } : null,
    profile, loading,
    user,
    isAuthed: Boolean(user),
    isDemo: false,
    signUp, signIn, signOut, updateProfile, refreshProfile,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
