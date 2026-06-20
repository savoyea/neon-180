import TopBar from '../components/TopBar.jsx'
import { useGame } from '../game/GameContext.jsx'

function fmtDate(ts) {
  const d = new Date(ts), now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return "Aujourd'hui · " + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function History() {
  const { history } = useGame()
  return (
    <div className="screen">
      <TopBar title="Historique" />
      {history.length === 0 ? (
        <div className="empty"><div className="big">🕘</div><p>Aucune partie enregistrée pour l’instant.</p></div>
      ) : (
        history.map((h) => {
          const winner = h.players.find((p) => p.id === h.winner) || h.players[0]
          return (
            <div className="row" key={h.id}>
              <div className="avatar">{(winner?.name || '?').slice(0, 2).toUpperCase()}</div>
              <div className="meta">
                <b>{h.modeName}{h.variant ? ' · ' + h.variant : ''}</b>
                <small>🏆 {winner?.name} · {h.players.length} joueur{h.players.length > 1 ? 's' : ''} · {fmtDate(h.date)}</small>
              </div>
              <div className="val">{winner?.sub?.split('·')[0]}</div>
            </div>
          )
        })
      )}
    </div>
  )
}
