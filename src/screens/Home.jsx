import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth.jsx'
import TopBar from '../components/TopBar.jsx'
import Board from '../components/Board.jsx'
import Icon from '../components/Icon.jsx'
import InstallBanner from '../components/InstallPrompt.jsx'
import { MODE_LIST } from '../game/modes.js'
import { getMode } from '../game/engine/registry.js'
import { getFriendships } from '../lib/friends.js'
import { getActiveMatches, getIncomingInvites } from '../lib/matches.js'

export default function Home() {
  const nav = useNavigate()
  const { profile, user } = useAuth()
  const name = profile?.username || 'Joueur'
  const [notifs, setNotifs] = useState(0)
  const [active, setActive] = useState([])

  useEffect(() => {
    if (!user?.id) return
    Promise.all([getFriendships(user.id), getIncomingInvites(user.id)])
      .then(([f, inv]) => setNotifs(f.incoming.length + inv.length)).catch(() => {})
    getActiveMatches(user.id).then(setActive).catch(() => {})
  }, [user])

  return (
    <div className="screen">
      <TopBar right={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" style={{ position: 'relative' }} onClick={() => nav('/notifications')}>
            <Icon name="bell" size={19} />{notifs > 0 && <span className="nbadge">{notifs}</span>}
          </button>
          <button className="icon-btn" onClick={() => nav('/friends')}><Icon name="friends" size={19} /></button>
          <button className="icon-btn" onClick={() => nav('/profile')}><Icon name="settings" size={18} /></button>
        </div>
      } />

      <div className="hero">
        <Board className="board" size={190} />
        <div className="eyebrow">Salut {name}</div>
        <h1>PRÊT À <span className="accent">VISER</span> ?</h1>
        <p>Choisis un mode, lance une partie et laisse l’app gérer le score, les stats et l’historique.</p>
        <button className="btn primary" style={{ width: 'auto', padding: '14px 26px' }} onClick={() => nav('/play')}>
          Nouvelle partie ›
        </button>
      </div>

      {active.length > 0 && (
        <>
          <div className="section-title"><h2>Parties en cours</h2><span className="hint">à distance</span></div>
          {active.map((m) => {
            const opp = m.host_id === user.id ? m.guest : m.host
            return (
              <button key={m.id} className="row" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => nav('/match/' + m.id)}>
                <div className="avatar">{(opp?.username || '?').slice(0, 2).toUpperCase()}</div>
                <div className="meta"><b>{getMode(m.mode)?.name || m.mode}</b><small>contre {opp?.username || 'adversaire'}</small></div>
                <div className="val" style={{ color: 'var(--neon)', fontSize: 14 }}>Reprendre ›</div>
              </button>
            )
          })}
        </>
      )}

      <button className="ranked-cta" onClick={() => nav('/ranked')}>
        <span className="rc-ic">⚔️</span>
        <span className="rc-text"><b>Mode classé</b><small>Grimpe les rangs · Bronze → Légende</small></span>
        <span className="rc-arrow">›</span>
      </button>

      <div className="quick-links">
        <button className="quick-link" onClick={() => nav('/missions')}><span className="ql-ic">🎖️</span>Missions</button>
        <button className="quick-link" onClick={() => nav('/leagues')}><span className="ql-ic">🛡️</span>Ligues</button>
        <button className="quick-link" onClick={() => nav('/rankings')}><span className="ql-ic">🏆</span>Classement</button>
      </div>

      <InstallBanner />

      <div className="section-title"><h2>Modes de jeu</h2><span className="hint">{MODE_LIST.length} disponibles</span></div>
      <div className="mode-grid">
        {MODE_LIST.map((m) => (
          <button key={m.key} className="mode-card" onClick={() => nav('/play?mode=' + m.key)}>
            <span className="tag">{m.tag}</span>
            <div>
              <div className="ico">{m.ico}</div>
              <h3>{m.name}</h3>
              <small>{m.desc}</small>
            </div>
          </button>
        ))}
      </div>

      <div className="section-title"><h2>Dernières parties</h2></div>
      <div className="empty">
        <div className="big">🎯</div>
        <p>Aucune partie pour l’instant.<br />Lance ta première manche !</p>
      </div>
    </div>
  )
}
