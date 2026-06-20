import { checkoutHint } from '../constants.js'

function winLegs(g) { return g.opts.legs === 1 ? 1 : Math.ceil(g.opts.legs / 2) }
export function avgOf(p) { return p.dartsThrown ? (p.scored / p.dartsThrown * 3).toFixed(1) : '0.0' }

function bust(g, p) {
  let restore = p.score, removed = 0
  for (const d of g.turn.darts.slice(0, -1)) { restore += d.val; removed += d.val }
  p.score = restore
  p.scored = Math.max(0, p.scored - removed)
  return { bust: true, flash: 'BUST', toast: 'Volée perdue' }
}

function nextLeg(g) {
  g.legNo++
  g.legStart = (g.legStart + 1) % g.players.length
  g.players.forEach((p) => { p.score = g.opts.start; p.in = !g.opts.doubleIn })
  g.turn = { pi: g.legStart, darts: [] }
}

export default {
  key: 'x01',
  name: 'X01',
  minPlayers: 1,
  board: null,
  defaultOptions: { start: 501, doubleOut: true, doubleIn: false, legs: 1 },
  optionFields: [
    { type: 'choice', key: 'start', label: 'Score de départ', options: [501, 401, 301, 201].map((v) => ({ value: v, label: String(v) })) },
    { type: 'toggle', key: 'doubleOut', label: 'Sortie double', hint: 'Le dernier dard doit être un double' },
    { type: 'toggle', key: 'doubleIn', label: 'Entrée double', hint: 'Démarrer le score sur un double' },
    { type: 'choice', key: 'legs', label: 'Manches (legs) à gagner', options: [1, 3, 5].map((v) => ({ value: v, label: v === 1 ? '1 leg' : 'Au meilleur des ' + v })) },
  ],

  initGame(g) { g.legStart = 0; g.legNo = 1; g.variant = String(g.opts.start) },
  initPlayer(p, { opts }) { p.score = opts.start; p.legs = 0; p.in = !opts.doubleIn; p.dartsThrown = 0; p.scored = 0; p.s180 = 0; p.tons = 0; p.bestCheckout = 0 },

  applyDart(g, p, dart) {
    if (!p.in) {
      if (dart.mult === 2 || dart.label === 'Bull') { p.in = true }
      else { p.dartsThrown++; return {} }
    }
    const rem = p.score - dart.val
    p.dartsThrown++
    if (rem < 0 || (g.opts.doubleOut && rem === 1)) return bust(g, p)
    if (rem === 0) {
      const validDouble = dart.mult === 2 || dart.label === 'Bull'
      if (g.opts.doubleOut && !validDouble) return bust(g, p)
      p.scored += dart.val; p.score = 0
      const coVal = g.turn.darts.reduce((s, d) => s + d.val, 0)
      if (coVal > p.bestCheckout) p.bestCheckout = coVal
      p.legs++
      if (p.legs >= winLegs(g)) { g.finished = true; g.winner = p.id; return { flash: 'GAME !' } }
      nextLeg(g)
      return { flash: 'LEG !', legDone: true }
    }
    p.score = rem; p.scored += dart.val
    if (g.turn.darts.length === 3) {
      const tt = g.turn.darts.reduce((s, d) => s + d.val, 0)
      if (tt === 180) { p.s180++; return { flash: '180 !' } }
      if (tt >= 100) { p.tons++; return { flash: 'TON ' + tt } }
    }
    return {}
  },

  scoreboard(g, p) {
    return {
      big: p.score,
      sub: `Moy ${avgOf(p)} · ${p.dartsThrown} flé.`,
      extra: g.opts.legs > 1 ? `${p.legs}/${winLegs(g)}` : '',
    }
  },

  turnHint(g, p, total) {
    const rem = p.score - total
    const co = g.opts.doubleOut ? checkoutHint(rem) : ''
    return co && rem <= 170 && rem > 1 ? `Sortie possible : ${co}` : ''
  },

  pad() { return { numbers: Array.from({ length: 20 }, (_, i) => i + 1), multipliers: true, bull: true, miss: true, missLabel: '⊘ Manqué' } },

  rank(g) {
    const ps = [...g.players].sort((a, b) => b.legs - a.legs || a.score - b.score)
    ps.sort((a, b) => (b.id === g.winner) - (a.id === g.winner))
    return ps
  },
  resultSub(g, p) { return `${p.legs} leg(s) · moy ${avgOf(p)}` },
}
