import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../../game/GameContext.jsx'
import { randomBarTarget, barTargetLabel } from '../../game/engine/modes/bar.js'
import { DARTBOARD_ORDER } from '../../game/engine/constants.js'
import TopBar from '../TopBar.jsx'
import BarBoard from './BarBoard.jsx'

export default function BarGame() {
  const { game, dispatchAction, quitGame } = useGame()
  const nav = useNavigate()
  const [spinTarget, setSpinTarget] = useState(null) // cible animée pendant la loterie
  const [spinning, setSpinning] = useState(false)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const cur = game.players[game.turn.pi]
  const totalTurns = game.opts.rounds
  const displayTarget = spinning ? spinTarget : game.target

  function quit() {
    if (confirm('Quitter la partie en cours ? Elle ne sera pas enregistrée.')) { quitGame(); nav('/') }
  }

  function lottery() {
    if (spinning || game.phase !== 'lottery') return
    setSpinning(true)
    const finalT = randomBarTarget(game.opts.difficulty)
    const steps = 22 + Math.floor(Math.random() * 8)
    let i = 0, idx = Math.floor(Math.random() * 20)
    const tick = () => {
      if (i >= steps - 1) setSpinTarget(finalT)
      else { idx = (idx + 1) % 20; setSpinTarget({ num: DARTBOARD_ORDER[idx], mult: 1 }) }
      i++
      if (i >= steps) {
        setSpinning(false)
        dispatchAction('setTarget', finalT)
        return
      }
      const p = i / steps
      timers.current.push(setTimeout(tick, 30 + Math.pow(p, 3) * 300))
    }
    tick()
  }

  function record(n) {
    dispatchAction('record', n, (r) => { if (r.next) timers.current.push(setTimeout(() => dispatchAction('nextTurn'), 300)) })
  }

  return (
    <div className="screen">
      <TopBar back={quit} />
      <div className="bar-round">
        Tour {Math.min(totalTurns, cur.turns + 1)} / {totalTurns} · {cur.name} · {game.opts.difficulty === 'easy' ? '🟢 Facile' : '🔥 Expert'}
      </div>

      <div className="players-strip">
        {game.players.map((p, i) => {
          const active = i === game.turn.pi && !game.finished
          return (
            <div key={p.id} className={'pcard' + (active ? ' active' : '')} style={{ minWidth: 96 }}>
              {active && <span className="crown">À TOI</span>}
              <div className="pname" style={{ color: p.color }}>{p.name}</div>
              <div className="pscore" style={{ fontSize: 22 }}>🍻 {p.sipsGiven}</div>
              <div className="psub">{p.hits} dans · {p.turns}/{totalTurns} tours</div>
            </div>
          )
        })}
      </div>

      <div className="bar-wrap">
        <BarBoard target={displayTarget} final={!spinning && game.phase !== 'lottery'} />
      </div>

      <div className="bar-panel">
        {game.phase === 'lottery' && (
          <>
            <div className="bar-turn">Tour de <b style={{ color: cur.color }}>{cur.name}</b></div>
            <button className="btn primary lottery-btn" disabled={spinning} onClick={lottery}>
              {spinning ? '🎰 …' : '🎰 LOTERIE'}
            </button>
            <div className="bar-hint">Lance la loterie pour découvrir ta cible</div>
          </>
        )}
        {game.phase === 'aim' && (
          <>
            <div className="bar-target">🎯 Cible : <b>{barTargetLabel(game.target)}</b></div>
            <div className="bar-hint">Combien de flèches dans la cible ?</div>
            <div className="count-row">
              {[0, 1, 2, 3].map((n) => <button key={n} className="count-btn" onClick={() => record(n)}>{n}</button>)}
            </div>
          </>
        )}
        {game.phase === 'drink' && (
          <>
            <div className="bar-target" style={{ color: 'var(--neon)' }}>✔ {game.lastCount} dans le {barTargetLabel(game.target)} !</div>
            <div className="bar-hint"><b style={{ color: 'var(--red)' }}>Qui boit {game.lastCount} gorgée{game.lastCount > 1 ? 's' : ''} ?</b></div>
            <div className="chips" style={{ justifyContent: 'center' }}>
              {game.players.filter((p) => p.id !== cur.id).map((p) => (
                <button key={p.id} className="chip" style={{ borderColor: p.color }} onClick={() => dispatchAction('assignDrink', p.id)}>{p.name}</button>
              ))}
            </div>
          </>
        )}
        {game.phase === 'announce' && game.drinkMsg && (
          <>
            <div className="bar-announce" style={{ color: game.drinkMsg.color }}>
              {game.drinkMsg.name}<br />boit {game.drinkMsg.n} gorgée{game.drinkMsg.n > 1 ? 's' : ''} 🍺
            </div>
            <button className="btn ghost sm next-after" onClick={() => dispatchAction('nextTurn')}>Suivant ›</button>
          </>
        )}
      </div>
    </div>
  )
}
