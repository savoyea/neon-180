import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import HeatBoard from '../components/HeatBoard.jsx'
import { useAuth } from '../lib/auth.jsx'
import { useGame } from '../game/GameContext.jsx'
import { isPremium, aggregateDartHits, heatFromTotals } from '../lib/premium.js'

export default function AdvancedStats() {
  const { profile } = useAuth()
  const { history } = useGame()
  const nav = useNavigate()

  if (!isPremium(profile)) {
    return (
      <div className="screen">
        <TopBar back title="Stats avancées" />
        <div className="card glow" style={{ textAlign: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 40 }}>📊</div>
          <h2 style={{ color: '#fff', fontSize: 18, marginTop: 6 }}>Réservé à Dart-180+</h2>
          <p className="muted" style={{ fontSize: 13.5, margin: '8px 0 16px', lineHeight: 1.5 }}>
            Carte thermique de tes impacts, précision par numéro, T20/T19/Bull, zones fortes &amp; faibles.
          </p>
          <button className="btn primary" onClick={() => nav('/premium')}>⭐ Débloquer avec Dart-180+</button>
        </div>
      </div>
    )
  }

  const totals = aggregateDartHits(history, profile?.username)
  const { targets, totalDarts } = heatFromTotals(totals)
  const top = Object.entries(totals).filter(([k]) => k !== '—').sort((a, b) => b[1] - a[1])[0]
  const sumZone = (pfx) => Object.keys(totals).filter((k) => (pfx === 'S' ? /^\d+$/.test(k) || k === '25' : k[0] === pfx)).reduce((s, k) => s + totals[k], 0)
  const doublesHit = sumZone('D') + (totals['Bull'] || 0), triplesHit = sumZone('T')
  const tip = top ? `Tu touches souvent le ${top[0]}` + (doublesHit < triplesHit / 2 ? ' · tu rates souvent les doubles' : '') : ''

  return (
    <div className="screen">
      <TopBar back title="Stats avancées" right={<span className="premium-pill">⭐</span>} />

      {totalDarts === 0 ? (
        <div className="empty"><div className="big">📊</div><p>Joue quelques parties pour générer ta carte thermique.</p></div>
      ) : (
        <>
          <div className="section-title"><h2>Carte thermique</h2><span className="hint">{totalDarts} fléchettes · précision par zone</span></div>
          <HeatBoard totals={totals} />
          {tip && <div className="heat-tip">💡 {tip}.</div>}

          <div className="section-title"><h2>Cibles clés</h2></div>
          {targets.map((t) => (
            <div className="rank-row" key={t.label}>
              <div className="meta"><b>{t.label}</b></div>
              <div className="metric">{t.count}</div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
