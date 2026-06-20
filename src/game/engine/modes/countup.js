import { defaultAdvance } from '../turn.js'

export default {
  key: 'countup',
  name: 'Score Max',
  minPlayers: 1,
  board: null,
  defaultOptions: { rounds: 8 },
  optionFields: [
    { type: 'choice', key: 'rounds', label: 'Nombre de volées', options: [8, 10, 15].map((v) => ({ value: v, label: v + ' volées' })) },
  ],

  initGame() {},
  initPlayer(p) { p.total = 0; p.turns = 0 },

  applyDart(g, p, dart) { p.total += dart.val; return {} },

  endTurn(g) {
    const p = g.players[g.turn.pi]
    p.turns++
    defaultAdvance(g)
    if (g.players.every((x) => x.turns >= g.opts.rounds)) {
      let best = g.players[0]
      g.players.forEach((x) => { if (x.total > best.total) best = x })
      g.finished = true; g.winner = best.id
    }
    return {}
  },

  scoreboard(g, p) { return { big: p.total, sub: `Volée ${p.turns}/${g.opts.rounds}` } },

  pad() { return { numbers: Array.from({ length: 20 }, (_, i) => i + 1), multipliers: true, bull: true, miss: true, missLabel: '⊘ Manqué' } },

  rank(g) {
    const ps = [...g.players].sort((a, b) => b.total - a.total)
    ps.sort((a, b) => (b.id === g.winner) - (a.id === g.winner))
    return ps
  },
  resultSub(g, p) { return `${p.total} pts` },
}
