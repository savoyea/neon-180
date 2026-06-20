import TopBar from '../components/TopBar.jsx'
import { useGame } from '../game/GameContext.jsx'
import { useAuth } from '../lib/auth.jsx'

export default function Stats() {
  const { history } = useGame()
  const { profile } = useAuth()
  const me = (profile?.username || '').toLowerCase()

  // Agrège les parties locales pour le joueur connecté (par pseudo).
  let played = 0, wins = 0, s180 = 0, bestCheckout = 0, avgSum = 0, avgN = 0
  for (const h of history) {
    const mine = h.players.find((p) => p.name.toLowerCase() === me)
    if (!mine) continue
    played++
    if (h.winner === mine.id) wins++
    s180 += mine.s180 || 0
    if ((mine.bestCheckout || 0) > bestCheckout) bestCheckout = mine.bestCheckout
    if (mine.avg) { avgSum += mine.avg; avgN++ }
  }
  const winrate = played ? Math.round((wins / played) * 100) : 0
  const avg = avgN ? (avgSum / avgN).toFixed(1) : '0.0'

  return (
    <div className="screen">
      <TopBar title="Statistiques" />
      <div className="section-title"><h2>Tableau de bord</h2><span className="hint">Parties locales</span></div>

      {played === 0 ? (
        <div className="empty"><div className="big">📊</div><p>Joue quelques parties pour voir tes statistiques apparaître ici.</p></div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-cell"><b>{played}</b><small>Parties</small></div>
            <div className="stat-cell"><b>{wins}</b><small>Victoires</small></div>
            <div className="stat-cell"><b>{winrate}%</b><small>Winrate</small></div>
            <div className="stat-cell"><b>{avg}</b><small>Moy. X01</small></div>
            <div className="stat-cell"><b>{s180}</b><small>180</small></div>
            <div className="stat-cell"><b>{bestCheckout || '—'}</b><small>Meilleur finish</small></div>
          </div>
          <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
            Les statistiques avancées (carte thermique, précision par zone, progression…) arriveront avec Dart-180+.
          </p>
        </>
      )}
    </div>
  )
}
