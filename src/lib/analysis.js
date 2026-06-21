// Construit le rapport "Analyse de partie" à partir d'un enregistrement d'historique.
import { heatFromTotals } from './premium.js'

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)

export function analyzeGame(record, myId, myName) {
  if (!record) return null
  const players = record.players || []
  const mine = players.find((p) => p.id === myId) || players.find((p) => (p.name || '').toLowerCase() === (myName || '').toLowerCase()) || players[0]
  const opp = players.find((p) => p !== mine)
  const won = record.winner === mine.id

  const turns = mine.turnScores || []
  const premier9 = turns.length ? +mean(turns.slice(0, 3)).toFixed(1) : 0
  const avgTurn = turns.length ? +mean(turns).toFixed(1) : 0
  const bestTurn = turns.length ? Math.max(...turns) : 0
  const lowTurns = turns.filter((t) => t < 60).length
  const s180 = mine.s180 || 0
  const avg = mine.avg || 0

  // Performance (0-100) : moyenne X01 mise à l'échelle, sinon basée sur résultat + 180.
  let perf
  if (record.mode === 'x01') perf = Math.min(100, Math.round(avg * 1.25))
  else perf = Math.min(100, (won ? 70 : 40) + s180 * 6)

  // Forces / axes d'amélioration depuis la carte thermique du match.
  const heat = heatFromTotals(mine.dartHits || {})
  const topTarget = heat.targets.find((t) => t.label !== 'Raté' && t.count > 0)
  const doublesHit = Object.keys(mine.dartHits || {}).filter((k) => k[0] === 'D').reduce((s, k) => s + mine.dartHits[k], 0)
  const misses = (mine.dartHits || {})['—'] || 0

  const strengths = []
  if (record.mode === 'x01' && premier9 >= 50) strengths.push(`Excellent premier 9 (${premier9})`)
  if (avg >= 55) strengths.push(`Bonne moyenne (${avg})`)
  if (s180 > 0) strengths.push(`${s180} × 180 réalisé${s180 > 1 ? 's' : ''}`)
  if (topTarget) strengths.push(`Zone forte : ${topTarget.label}`)
  if (lowTurns && record.mode === 'x01') strengths.push(`${lowTurns} volée${lowTurns > 1 ? 's' : ''} sous 60`)

  const improvements = []
  if (record.mode === 'x01' && doublesHit < 2) improvements.push('Travailler les doubles (peu touchés)')
  if (misses >= 3) improvements.push(`Réduire les hors-cible (${misses})`)
  if (record.mode === 'x01' && avg < 45) improvements.push('Gagner en régularité')
  if (record.mode === 'x01' && bestTurn < 100) improvements.push('Viser des volées à 100+')
  if (improvements.length === 0) improvements.push('Continue comme ça, beau jeu !')

  return {
    mode: record.mode, modeName: record.modeName, variant: record.variant,
    oppName: opp?.name || 'Adversaire', won, date: record.date,
    perf, premier9, avgTurn, bestTurn, s180, avg, bestCheckout: mine.bestCheckout || 0,
    mySub: mine.sub, oppSub: opp?.sub,
    strengths: strengths.slice(0, 4), improvements: improvements.slice(0, 3),
  }
}
