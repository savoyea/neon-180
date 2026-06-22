// Missions (progression calculée depuis l'historique local) + Battle Pass.

export const DAILY = [
  { id: 'play3', name: 'Joue 3 parties', goal: 3, xp: 100, metric: 'games' },
  { id: 'win1', name: 'Gagne une partie', goal: 1, xp: 150, metric: 'wins' },
  { id: 'triples5', name: 'Réalise 5 triples', goal: 5, xp: 120, metric: 'triples' },
  { id: 'finish1', name: 'Réalise un finish', goal: 1, xp: 130, metric: 'finishes' },
]
export const WEEKLY = [
  { id: 'play15', name: 'Joue 15 parties', goal: 15, xp: 300, metric: 'games' },
  { id: 's180_3', name: 'Réalise 3 × 180', goal: 3, xp: 400, metric: 's180' },
  { id: 'win5', name: 'Gagne 5 parties', goal: 5, xp: 350, metric: 'wins' },
  { id: 'triples30', name: 'Réalise 30 triples', goal: 30, xp: 300, metric: 'triples' },
]

const todayKey = () => new Date().toISOString().slice(0, 10)
function weekKey() {
  const d = new Date(); const day = (d.getDay() + 6) % 7
  const monday = new Date(d); monday.setDate(d.getDate() - day)
  return monday.toISOString().slice(0, 10)
}
function startOfDay() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }
function startOfWeek() { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); return d.getTime() }

// Totaux de la période pour le joueur connecté (depuis l'historique).
export function periodTotals(history, username, period) {
  const me = (username || '').toLowerCase()
  const since = period === 'daily' ? startOfDay() : startOfWeek()
  const t = { games: 0, wins: 0, triples: 0, s180: 0, finishes: 0 }
  for (const h of history) {
    if (h.date < since) continue
    const mine = h.players.find((p) => (p.name || '').toLowerCase() === me)
    if (!mine) continue
    t.games++
    if (h.winner === mine.id) t.wins++
    t.s180 += mine.s180 || 0
    if ((mine.bestCheckout || 0) > 0) t.finishes++
    const dh = mine.dartHits || {}
    for (const k in dh) if (k[0] === 'T') t.triples += dh[k]
  }
  return t
}

// ---- Réclamations (localStorage, par jour / semaine) ----
const claimKey = (period) => `dart180_missions_${period}_${period === 'daily' ? todayKey() : weekKey()}`
export function getClaimed(period) { try { return JSON.parse(localStorage.getItem(claimKey(period))) || [] } catch { return [] } }
export function markClaimed(period, id) {
  const c = getClaimed(period)
  if (!c.includes(id)) { c.push(id); try { localStorage.setItem(claimKey(period), JSON.stringify(c)) } catch { /* ignore */ } }
}

// ---- Battle Pass ----
export const SEASON = {
  name: 'Saison 1 · Rise of Champions',
  tierSize: 250,
  endLabel: 'Fin de saison · ~28j',
  tiers: [
    { free: { e: '🎯', l: '100 XP' }, premium: { e: '🎨', l: 'Avatar Feu' } },
    { free: { e: '⚡', l: '150 XP' }, premium: { e: '😈', l: 'Pack emotes' } },
    { free: { e: '🏅', l: 'Badge' }, premium: { e: '🖼️', l: 'Cadre Or' } },
    { free: { e: '🎯', l: '200 XP' }, premium: { e: '🎇', l: 'Effet 180 Feu' } },
    { free: { e: '⚡', l: '250 XP' }, premium: { e: '🏆', l: 'Titre exclusif' } },
    { free: { e: '🎯', l: '300 XP' }, premium: { e: '🎨', l: 'Thème Or' } },
    { free: { e: '🏅', l: 'Badge rare' }, premium: { e: '🪄', l: 'Skin Futuriste' } },
    { free: { e: '⚡', l: '400 XP' }, premium: { e: '👑', l: 'Cadre Légende' } },
    { free: { e: '🎯', l: '500 XP' }, premium: { e: '🎇', l: 'Effet Électrique' } },
    { free: { e: '🏆', l: 'Badge saison' }, premium: { e: '🌈', l: 'Avatar Magma' } },
    { free: { e: '⚡', l: '600 XP' }, premium: { e: '💎', l: 'Thème Magenta' } },
    { free: { e: '👑', l: 'Titre saison' }, premium: { e: '🏅', l: 'Badge Légende S1' } },
  ],
}
export const seasonTier = (sxp) => Math.floor((sxp || 0) / SEASON.tierSize)
export const tierProgressPct = (sxp) => Math.round((((sxp || 0) % SEASON.tierSize) / SEASON.tierSize) * 100)
