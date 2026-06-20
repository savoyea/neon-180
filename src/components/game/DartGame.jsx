import { useNavigate } from 'react-router-dom'
import { useGame } from '../../game/GameContext.jsx'
import { getMode } from '../../game/engine/registry.js'
import TopBar from '../TopBar.jsx'
import PlayersStrip from './PlayersStrip.jsx'
import CricketGrid from './CricketGrid.jsx'
import AtwBoard from './AtwBoard.jsx'
import DartPad from './DartPad.jsx'

export default function DartGame() {
  const { game, throwDart, undoDart, passTurn, quitGame } = useGame()
  const nav = useNavigate()
  const mode = getMode(game.mode)
  const p = game.players[game.turn.pi]
  const total = game.turn.darts.reduce((s, d) => s + d.val, 0)
  const hint = mode.turnHint ? mode.turnHint(game, p, total) : ''

  function quit() {
    if (confirm('Quitter la partie en cours ? Elle ne sera pas enregistrée.')) { quitGame(); nav('/') }
  }

  return (
    <div className="screen playing">
      <TopBar back={quit} />
      <PlayersStrip game={game} mode={mode} />

      <div className="game-mid">
        {mode.board === 'cricket' && <CricketGrid game={game} />}
        {mode.board === 'atw' && <AtwBoard game={game} mode={mode} />}
        <div className="turn-display">
          <div className="who">
            Volée de <b style={{ color: p.color }}>{p.name}</b>
            {mode.key === 'atw' && game.sudden && <span className="sudden-badge">MORT SUBITE ☠</span>}
          </div>
          <div className="darts">
            {[0, 1, 2].map((i) => {
              const d = game.turn.darts[i]
              return <div key={i} className={'dart-slot' + (d ? ' filled' : '')}>{d ? d.label : '·'}</div>
            })}
          </div>
          <div className="turn-total">VOLÉE : {total}</div>
          <div className="checkout-hint">{hint}</div>
        </div>
      </div>

      <div className="pad-dock">
        <DartPad config={mode.pad(game)} onHit={throwDart} disabled={game.finished} />
        <div className="game-actions">
          <button className="btn ghost" onClick={undoDart}>↶ Annuler</button>
          <button className="btn ghost" onClick={passTurn}>Valider la volée ›</button>
        </div>
      </div>
    </div>
  )
}
