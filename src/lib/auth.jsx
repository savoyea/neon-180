import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from './supabase'

const AuthContext = createContext(null)
const DEMO_KEY = 'dart180_demo_session'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ----- Chargement initial -----
  useEffect(() => {
    let active = true
    async function init() {
      if (isConfigured) {
        const { data } = await supabase.auth.getSession()
        if (!active) return
        setSession(data.session)
        if (data.session) await loadProfile(data.session.user)
        setLoading(false)
        supabase.auth.onAuthStateChange((_e, s) => {
          setSession(s)
          if (s) loadProfile(s.user)
          else setProfile(null)
        })
      } else {
        // Mode démo : session locale
        try {
          const raw = localStorage.getItem(DEMO_KEY)
          if (raw) {
            const p = JSON.parse(raw)
            setSession({ user: { id: p.id, email: p.email } })
            setProfile(p)
          }
        } catch (e) { /* ignore */ }
        setLoading(false)
      }
    }
    init()
    return () => { active = false }
  }, [])

  async function loadProfile(user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (data) {
      setProfile(data)
    } else {
      // fallback minimal si la ligne profil n'existe pas encore
      setProfile({ id: user.id, username: user.user_metadata?.username || 'Joueur', level: 1, xp: 0 })
    }
  }

  // ----- Inscription -----
  const signUp = useCallback(async ({ username, email, password }) => {
    if (!isConfigured) {
      const demo = { id: 'demo-' + Date.now(), username, email, level: 1, xp: 0, demo: true }
      localStorage.setItem(DEMO_KEY, JSON.stringify(demo))
      setSession({ user: { id: demo.id, email } })
      setProfile(demo)
      return { error: null }
    }
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { username } },
    })
    if (error) return { error }
    // Si une session existe déjà (confirmation email désactivée), complète le profil.
    if (data.session && data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, username }, { onConflict: 'id' })
    }
    // Sinon, confirmation email requise : pas encore de session.
    return { error: null, needsConfirm: !data.session }
  }, [])

  // ----- Connexion -----
  const signIn = useCallback(async ({ email, password }) => {
    if (!isConfigured) {
      const raw = localStorage.getItem(DEMO_KEY)
      const demo = raw ? JSON.parse(raw) : { id: 'demo-' + Date.now(), username: email.split('@')[0], email, level: 1, xp: 0, demo: true }
      localStorage.setItem(DEMO_KEY, JSON.stringify(demo))
      setSession({ user: { id: demo.id, email: demo.email } })
      setProfile(demo)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  // ----- Mise à jour du profil (réglages) -----
  const updateProfile = useCallback(async (fields) => {
    if (!isConfigured) {
      setProfile((prev) => {
        const next = { ...prev, ...fields }
        try { localStorage.setItem(DEMO_KEY, JSON.stringify(next)) } catch (e) { /* ignore */ }
        return next
      })
      return { error: null }
    }
    setProfile((prev) => ({ ...prev, ...fields }))
    const uid = session?.user?.id
    if (!uid) return { error: null }
    const { error } = await supabase.from('profiles').update(fields).eq('id', uid)
    return { error }
  }, [session])

  // ----- Déconnexion -----
  const signOut = useCallback(async () => {
    if (!isConfigured) {
      localStorage.removeItem(DEMO_KEY)
    } else {
      await supabase.auth.signOut()
    }
    setSession(null)
    setProfile(null)
  }, [])

  const value = {
    session, profile, loading,
    user: session?.user || null,
    isAuthed: Boolean(session),
    isDemo: !isConfigured,
    signUp, signIn, signOut, updateProfile,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
