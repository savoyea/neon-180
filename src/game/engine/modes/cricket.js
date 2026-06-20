import { cricketNums } from '../constants.js'

export function closedCount(p) { return Object.keys(p.marks).filter((n) => p.marks[n] >= 3).length }

function checkWin(g, p) {
  if (closedCount(p) < g.cricketNums.length) return false
  const maxOther = Math.max(0, ...g.players.filter((o) => o !== p).map((o) => o.points))
  return p.points >= maxOther
}

export default {
  key: 'cricket',
  name: 'Cricket',
  minPlayers: 1,
  board: 'cricket',
  defaultOptions: { start: 15 },
  optionFields: [
    { type: 'choice', key: 'start', label: 'Numéros en jeu', options: [
      { value: 15, label: '15 → 20 + Bull' },
      { value: 10, label: '10 → 20 + Bull' },
    ] },
  ],

  initGame(g) { g.cricketNums = cricketNums(g.opts.start || 15) },
  initPlayer(p, { game }) { p.marks = {}; game.cricketNums.forEach((n) => (p.marks[n] = 0)); p.points = 0 },

  applyDart(g, p, dart) {
    if (dart.seg === 0) return {}
    const num = dart.seg === 25 ? 25 : dart.seg
    if (!g.cricketNums.includes(num)) return { toast: 'Numéro hors cricket' }
    const marks = dart.mult
    for (let k = 0; k < marks; k++) {
      if (p.marks[num] < 3) p.marks[num]++
      else {
        const open = g.players.some((o) => o !== p && o.marks[num] < 3)
        if (open) p.points += num
      }
    }
    if (checkWin(g, p)) { g.finished = true; g.winner = p.id; return { flash: 'GAME !' } }
    return {}
  },

  scoreboard(g, p) { return { big: p.points, sub: `${closedCount(p)}/${g.cricketNums.length} fermés` } },

  pad(g) {
    return { numbers: g.cricketNums.filter((n) => n !== 25), multipliers: true, bull: true, miss: true, missLabel: '✕ Hors-cible' }
  },

  rank(g) {
    const ps = [...g.players].sort((a, b) => (b.id === g.winner) - (a.id === g.winner) || b.points - a.points || closedCount(b) - closedCount(a))
    ps.sort((a, b) => (b.id === g.winner) - (a.id === g.winner))
    return ps
  },
  resultSub(g, p) { return `${p.points} pts · ${closedCount(p)}/${g.cricketNums.length}` },
}
