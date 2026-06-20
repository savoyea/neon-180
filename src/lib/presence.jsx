import { useEffect } from 'react'
import { supabase, isConfigured } from './supabase.js'
import { useAuth } from './auth.jsx'
import { useGame } from '../game/GameContext.jsx'

// Bat le cœur de présence : met à jour last_seen + status du joueur connecté.
// Monté une fois dans la zone authentifiée.
export default function Presence() {
  const { user } = useAuth()
  const { game } = useGame()
  const inGame = Boolean(game && !game.finished)

  useEffect(() => {
    if (!isConfigured || !user) return
    let alive = true
    const beat = async () => {
      if (!alive) return
      await supabase.from('profiles')
        .update({ last_seen: new Date().toISOString(), status: inGame ? 'in_game' : 'online' })
        .eq('id', user.id)
    }
    beat()
    const id = setInterval(beat, 25_000)
    const onHide = () => { if (document.visibilityState === 'hidden') beat() }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      alive = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', onHide)
      // meilleure tentative : se marquer hors ligne en quittant
      supabase.from('profiles').update({ status: 'offline' }).eq('id', user.id)
    }
  }, [user, inGame])

  return null
}
