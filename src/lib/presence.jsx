import { useEffect } from 'react'
import { pb } from './pocketbase.js'
import { useAuth } from './auth.jsx'
import { useGame } from '../game/GameContext.jsx'

export default function Presence() {
  const { user, profile } = useAuth()
  const { game } = useGame()
  const inGame = Boolean(game && !game.finished)
  const visible = profile?.visible !== false

  useEffect(() => {
    if (!user) return
    let alive = true
    const beat = async () => {
      if (!alive) return
      const status = !visible ? 'offline' : inGame ? 'in_game' : 'online'
      try {
        await pb.collection('users').update(user.id, {
          last_seen: new Date().toISOString(), status,
        })
      } catch { /* ignore */ }
    }
    beat()
    const id = setInterval(beat, 25_000)
    const onHide = () => { if (document.visibilityState === 'hidden') beat() }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      alive = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', onHide)
      pb.collection('users').update(user.id, { status: 'offline' }).catch(() => {})
    }
  }, [user, inGame, visible])

  return null
}
