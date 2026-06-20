import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import TopBar from '../components/TopBar.jsx'
import Board from '../components/Board.jsx'
import { MODE_LIST } from '../game/modes.js'

export default function Home() {
  const nav = useNavigate()
  const { profile } = useAuth()
  const name = profile?.username || 'Joueur'

  return (
    <div className="screen">
      <TopBar right={<button className="icon-btn" onClick={() => nav('/profile')}>⚙</button>} />

      <div className="hero">
        <Board className="board" size={190} />
        <div className="eyebrow">Salut {name}</div>
        <h1>PRÊT À <span className="accent">VISER</span> ?</h1>
        <p>Choisis un mode, lance une partie et laisse l’app gérer le score, les stats et l’historique.</p>
        <button className="btn primary" style={{ width: 'auto', padding: '14px 26px' }} onClick={() => nav('/play')}>
          Nouvelle partie ›
        </button>
      </div>

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
