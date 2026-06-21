import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useGame } from '../game/GameContext.jsx'
import { useAuth } from '../lib/auth.jsx'
import { analyzeGame } from '../lib/analysis.js'

function Gauge({ value }) {
  const r = 52, c = 2 * Math.PI * r
  const off = c * (1 - Math.min(100, value) / 100)
  return (
    <svg viewBox="0 0 130 130" style={{ width: 150, height: 150 }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--surface2)" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--neon)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 65 65)" style={{ filter: 'drop-shadow(0 0 6px rgba(57,255,106,.6))' }} />
      <text x="65" y="60" textAnchor="middle" fontSize="30" fontFamily="Oswald" fontWeight="700" fill="#fff">{value}</text>
      <text x="65" y="80" textAnchor="middle" fontSize="10" fontFamily="Oswald" fill="var(--muted)" letterSpacing="1">PERF</text>
    </svg>
  )
}

export default function GameAnalysis() {
  const { id } = useParams()
  const nav = useNavigate()
  const { history } = useGame()
  const { user, profile } = useAuth()
  const record = history.find((h) => h.id === id)
  const a = analyzeGame(record, user?.id, profile?.username)

  if (!a) return <div className="screen"><TopBar back title="Analyse" /><div className="empty"><div className="big">🔍</div><p>Partie introuvable.</p></div></div>

  return (
    <div className="screen">
      <TopBar back title="Analyse de partie" />

      <div className="card glow" style={{ textAlign: 'center' }}>
        <div className="eyebrow">{a.modeName}{a.variant ? ' · ' + a.variant : ''} · contre {a.oppName}</div>
        <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 20, color: a.won ? 'var(--neon)' : 'var(--red)', margin: '4px 0 10px' }}>
          {a.won ? '🏆 Victoire' : 'Défaite'}
        </div>
        <Gauge value={a.perf} />
        <div className="ana-metrics">
          <div><b>{a.premier9 || '—'}</b><small>Premier 9</small></div>
          <div><b>{a.avgTurn || '—'}</b><small>Moy. volée</small></div>
          <div><b>{a.bestTurn || '—'}</b><small>Meilleure volée</small></div>
          <div><b>{a.s180}</b><small>180</small></div>
        </div>
      </div>

      <div className="section-title"><h2>Points forts</h2></div>
      {a.strengths.map((s, i) => <div className="ana-line ok" key={i}><span>✅</span>{s}</div>)}

      <div className="section-title"><h2>À améliorer</h2></div>
      {a.improvements.map((s, i) => <div className="ana-line warn" key={i}><span>🎯</span>{s}</div>)}

      <button className="btn ghost" style={{ marginTop: 18 }} onClick={() => nav('/advanced-stats')}>🔥 Voir ma carte thermique ›</button>
    </div>
  )
}
