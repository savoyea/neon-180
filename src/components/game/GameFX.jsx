import { useEffect, useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useAuth } from '../../lib/auth.jsx'
import { effectColor } from '../../game/cosmetics.js'

// Overlay plein écran (180 !, BUST, GAME !…) + toast léger.
export default function GameFX() {
  const { fx, clearFlash, clearToast } = useGame()
  const { profile } = useAuth()
  const [flashShown, setFlashShown] = useState(false)

  useEffect(() => {
    if (!fx.flash) return
    setFlashShown(true)
    const t1 = setTimeout(() => setFlashShown(false), 600)
    const t2 = setTimeout(() => clearFlash(), 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [fx.flash, clearFlash])

  useEffect(() => {
    if (!fx.toast) return
    const t = setTimeout(() => clearToast(), 1800)
    return () => clearTimeout(t)
  }, [fx.toast, clearToast])

  const isBust = fx.flash && fx.flash.text === 'BUST'
  return (
    <>
      {fx.flash && (
        <div className={'flash' + (flashShown ? ' show' : '')}>
          <div className={'txt' + (isBust ? ' bust' : '')}
            style={isBust ? undefined : { color: effectColor(profile), textShadow: `0 0 40px ${effectColor(profile)}` }}>
            {fx.flash.text}
          </div>
        </div>
      )}
      {fx.toast && <div className="toast">{fx.toast.text}</div>}
    </>
  )
}
