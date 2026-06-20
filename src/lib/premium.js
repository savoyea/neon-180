// Offre Dart-180+ (premium). Le paiement Stripe sera branché ensuite ;
// pour l'instant le statut vient de profiles.is_premium.
export const PRICING = { monthly: '4,99 €', yearly: '29,99 €', yearlyPerMonth: '≈ 2,50 €/mois' }

export const PREMIUM_PERKS = [
  { emoji: '📊', title: 'Statistiques avancées', desc: 'Carte thermique, précision par numéro, T20/T19/Bull' },
  { emoji: '🏅', title: 'Badges exclusifs', desc: 'Des badges rares réservés aux abonnés' },
  { emoji: '😈', title: 'Emotes illimitées', desc: 'Plus de cooldown de 2 min en partie' },
  { emoji: '🎨', title: 'Personnalisation', desc: 'Cadres de profil, skins de fléchettes, effets' },
  { emoji: '🏆', title: 'Parties classées ELO', desc: 'Matchmaking & rangs Bronze → Légende' },
  { emoji: '🗂️', title: 'Historique illimité', desc: 'Toutes tes parties conservées et analysées' },
]

export const isPremium = (profile) => Boolean(profile?.is_premium)

// Agrège les impacts de fléchettes (carte thermique) depuis l'historique local
// pour le pseudo donné. Clés = labels de dard (20, D20, T20, 25, Bull, —).
export function aggregateDartHits(history, username) {
  const me = (username || '').toLowerCase()
  const totals = {}
  for (const h of history) {
    for (const p of h.players || []) {
      if ((p.name || '').toLowerCase() !== me) continue
      const dh = p.dartHits || {}
      for (const k in dh) totals[k] = (totals[k] || 0) + dh[k]
    }
  }
  return totals
}

export function heatFromTotals(totals) {
  const perNumber = {}
  for (let n = 1; n <= 20; n++) {
    perNumber[n] = (totals[String(n)] || 0) + (totals['D' + n] || 0) + (totals['T' + n] || 0)
  }
  const bull = (totals['25'] || 0) + (totals['Bull'] || 0)
  const targets = [
    { label: 'T20', count: totals['T20'] || 0 },
    { label: 'T19', count: totals['T19'] || 0 },
    { label: 'T18', count: totals['T18'] || 0 },
    { label: 'Bull', count: bull },
    { label: 'D20', count: totals['D20'] || 0 },
    { label: 'Raté', count: totals['—'] || 0 },
  ].sort((a, b) => b.count - a.count)
  const totalDarts = Object.values(totals).reduce((s, v) => s + v, 0)
  return { perNumber, bull, targets, totalDarts }
}
