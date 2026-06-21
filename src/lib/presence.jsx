import { useEffect } from 'react'
import { supabase, isConfigured } from './supabase.js'
import { useAuth } from './auth.jsx'
import { useGame } from '../game/GameContext.jsx'

// Bat le cœur de présence : met à jour last_seen + status du joueur connecté.
// Monté une fois dans la zone authentifiée.
export default function Presence() {
  const { user, profile } = useAuth()
  const { game } = useGame()
  const inGame = Boolean(game && !game.finished)
  const visible = profile?.visible !== false // par défaut visible

  useEffect(() => {
    if (!isConfigured || !user) return
    let alive = true
    const beat = async () => {
      if (!alive) return
      // Si le joueur se met "invisible", il apparaît hors ligne pour ses amis.
      const status = !visible ? 'offline' : inGame ? 'in_game' : 'online'
      await supabase.from('profiles')
        .update({ last_seen: new Date().toISOString(), status })
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
  }, [user, inGame, visible])

  return null
}
