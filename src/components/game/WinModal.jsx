import { useNavigate } from 'react-router-dom'
import { useGame } from '../../game/GameContext.jsx'
import { getMode } from '../../game/engine/registry.js'

export default function WinModal() {
  const { winData, startGame, quitGame, dismissWin } = useGame()
  const nav = useNavigate()
  if (!winData) return null

  const { game, record } = winData
  const mode = getMode(game.mode)
  const ranked = mode.rank(game)
  const winner = game.players.find((p) => p.id === game.winner) || ranked[0]

  function rematch() {
    startGame(game.mode, game.players.map((p) => p.id), game.opts)
  }
  function home() {
    quitGame()
    nav('/')
  }

  return (
    <div className="modal-back">
      <div className="modal">
        <div className="trophy">🏆</div>
        <h2>Vainqueur</h2>
        <div className="winner" style={{ color: winner.color }}>{winner.name}</div>
        <div className="standings">
          {ranked.map((p, i) => (
            <div className="row" key={p.id}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>{i + 1}</div>
              <div className="meta">
                <b style={{ color: p.color }}>{p.name}</b>
                <small>{mode.resultSub(game, p)}</small>
              </div>
            </div>
          ))}
        </div>
        {record && <button className="btn ghost" style={{ marginBottom: 9 }} onClick={() => { const rid = record.id; dismissWin(); nav('/game-analysis/' + rid); setTimeout(quitGame, 60) }}>📊 Voir l’analyse de partie</button>}
        <div className="modal-actions">
          <button className="btn ghost" onClick={home}>Accueil</button>
          <button className="btn primary" onClick={rematch}>Revanche</button>
        </div>
      </div>
    </div>
  )
}
