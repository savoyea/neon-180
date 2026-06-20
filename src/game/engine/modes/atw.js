import { ATW_SEQ } from '../constants.js'
import { defaultAdvance } from '../turn.js'

export default {
  key: 'atw',
  name: 'Tour du monde',
  minPlayers: 1,
  board: 'atw',
  defaultOptions: {},
  optionFields: [],
  info: 'Touche les numéros 1 à 20 puis le Bull dans l’ordre. Un double avance de 2 cases, un triple de 3. Mort subite : réussis tes 3 flèches et tu rejoues aussitôt.',

  initGame() {},
  initPlayer(p) { p.ti = 0; p.done = false; p.place = 0 },

  applyDart(g, p, dart) {
    dart.good = false
    if (p.done) return {}
    const tgt = ATW_SEQ[p.ti]
    if (dart.seg === tgt && dart.seg !== 0) {
      dart.good = true
      const adv = tgt === 25 ? 1 : dart.mult
      p.ti = Math.min(ATW_SEQ.length, p.ti + adv)
      if (p.ti >= ATW_SEQ.length) {
        p.done = true
        p.place = g.players.filter((x) => x.done).length
        g.finished = true; g.winner = p.id
        return { flash: 'GAME !' }
      }
      if (adv > 1) return { toast: `+${adv} → cible ${ATW_SEQ[p.ti] === 25 ? 'Bull' : ATW_SEQ[p.ti]}` }
    }
    return {}
  },

  endTurn(g) {
    const p = g.players[g.turn.pi]
    if (!p.done) {
      const cleanSweep = g.turn.darts.length === 3 && g.turn.darts.every((d) => d.good)
      if (cleanSweep) {
        g.sudden = true
        g.turn = { pi: g.turn.pi, darts: [] }
        return { replay: true, flash: 'MORT SUBITE ☠' }
      }
      g.sudden = false
    }
    defaultAdvance(g)
    return {}
  },

  scoreboard(g, p) {
    const tgt = ATW_SEQ[p.ti]
    return { big: p.done ? '✓' : tgt === 25 ? 'B' : tgt, sub: p.done ? 'Terminé' : `Cible ${p.ti + 1}/21` }
  },
  boardData(g) {
    const p = g.players[g.turn.pi]
    return { big: p.done ? '✓' : ATW_SEQ[p.ti] === 25 ? 'BULL' : ATW_SEQ[p.ti], label: p.done ? 'TERMINÉ' : 'CIBLE DE ' + p.name.toUpperCase() }
  },

  pad() { return { numbers: Array.from({ length: 20 }, (_, i) => i + 1), multipliers: true, bull: true, miss: true, missLabel: '⊘ Manqué' } },

  rank(g) {
    const ps = [...g.players].sort((a, b) => (b.done ? 1 : 0) - (a.done ? 1 : 0) || b.ti - a.ti)
    ps.sort((a, b) => (b.id === g.winner) - (a.id === g.winner))
    return ps
  },
  resultSub(g, p) { return p.done ? 'Terminé' : `Cible ${p.ti + 1}/21` },
}
