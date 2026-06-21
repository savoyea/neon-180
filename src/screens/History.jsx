import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useGame } from '../game/GameContext.jsx'
import { useAuth } from '../lib/auth.jsx'
import { getActiveMatches } from '../lib/matches.js'
import { getMode } from '../game/engine/registry.js'

function fmtDate(ts) {
  const d = new Date(ts), now = new Date()
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui · " + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function History() {
  const { history } = useGame()
  const { user } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('toutes')
  const [active, setActive] = useState([])

  useEffect(() => { if (user?.id) getActiveMatches(user.id).then(setActive).catch(() => {}) }, [user])

  const Finished = ({ items }) => items.map((h) => {
    const winner = h.players.find((p) => p.id === h.winner) || h.players[0]
    const mine = h.players.find((p) => p.id === user?.id) || h.players.find((p) => (p.name || '').toLowerCase() === (user?.username || '').toLowerCase())
    const won = mine && h.winner === mine.id
    return (
      <button className="row" style={{ width: '100%', textAlign: 'left' }} key={h.id} onClick={() => nav('/game-analysis/' + h.id)}>
        <div className="avatar">{(winner?.name || '?').slice(0, 2).toUpperCase()}</div>
        <div className="meta">
          <b>{h.modeName}{h.variant ? ' · ' + h.variant : ''}</b>
          <small>🏆 {winner?.name} · {h.players.length} joueur{h.players.length > 1 ? 's' : ''} · {fmtDate(h.date)}</small>
        </div>
        <div className="val" style={{ color: won ? 'var(--neon)' : 'var(--muted)', fontSize: 13 }}>{won ? 'Victoire' : winner?.sub?.split('·')[0]} ›</div>
      </button>
    )
  })

  const Ongoing = () => active.map((m) => {
    const opp = m.host_id === user?.id ? m.guest : m.host
    return (
      <button key={m.id} className="row" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav('/match/' + m.id)}>
        <div className="avatar" style={{ background: 'linear-gradient(150deg,var(--amber),#ff9d2f)' }}>{(opp?.username || '?').slice(0, 2).toUpperCase()}</div>
        <div className="meta"><b>{getMode(m.mode)?.name || m.mode} · en cours</b><small>contre {opp?.username || 'adversaire'}</small></div>
        <div className="val" style={{ color: 'var(--neon)', fontSize: 13 }}>Reprendre ›</div>
      </button>
    )
  })

  const empty = (tab === 'en-cours' && active.length === 0) || (tab === 'terminees' && history.length === 0) || (tab === 'toutes' && active.length === 0 && history.length === 0)

  return (
    <div className="screen">
      <TopBar title="Historique" />
      <div className="tabs">
        <button className={tab === 'toutes' ? 'on' : ''} onClick={() => setTab('toutes')}>Toutes</button>
        <button className={tab === 'terminees' ? 'on' : ''} onClick={() => setTab('terminees')}>Terminées</button>
        <button className={tab === 'en-cours' ? 'on' : ''} onClick={() => setTab('en-cours')}>
          En cours{active.length > 0 && <span className="tab-badge">{active.length}</span>}
        </button>
      </div>

      {empty ? (
        <div className="empty"><div className="big">🕘</div><p>Rien à afficher ici pour l’instant.</p></div>
      ) : (
        <>
          {(tab === 'toutes' || tab === 'en-cours') && <Ongoing />}
          {(tab === 'toutes' || tab === 'terminees') && <Finished items={history} />}
        </>
      )}
    </div>
  )
}
