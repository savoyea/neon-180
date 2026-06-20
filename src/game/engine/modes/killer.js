import { defaultAdvance } from '../turn.js'

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

function aliveWin(g) {
  const alive = g.players.filter((o) => !o.elim)
  if (alive.length <= 1) { g.finished = true; g.winner = (alive[0] || g.players[0]).id; return true }
  return false
}

export default {
  key: 'killer',
  name: 'Killer',
  minPlayers: 2,
  board: null,
  defaultOptions: { lives: 3 },
  optionFields: [
    { type: 'choice', key: 'lives', label: 'Vies par joueur', options: [3, 4, 5].map((v) => ({ value: v, label: v + ' vies' })) },
  ],
  info: 'Chaque joueur reçoit un numéro tiré au sort. Touche ton numéro pour devenir Tueur, puis vise les numéros adverses pour leur retirer des vies. Dernier survivant gagne.',

  initGame(g) { g._nums = shuffle([...Array(20)].map((_, i) => i + 1)).slice(0, g.players.length) },
  initPlayer(p, { index, game }) { p.number = game._nums[index]; p.lives = game.opts.lives; p.killer = false; p.elim = false },

  applyDart(g, p, dart) {
    if (dart.seg === 0 || g.finished || p.elim) return {}
    const seg = dart.seg
    if (seg === p.number) {
      if (!p.killer) { p.killer = true; return { toast: `${p.name} devient TUEUR ☠` } }
      p.lives = Math.max(0, p.lives - dart.mult)
      if (p.lives === 0) { p.elim = true; if (aliveWin(g)) return { flash: 'GAME !' } }
      return { toast: `${p.name} se blesse ! (-${dart.mult})` }
    }
    if (p.killer) {
      const target = g.players.find((o) => o !== p && o.number === seg && !o.elim)
      if (target) {
        target.lives = Math.max(0, target.lives - dart.mult)
        let msg = `${target.name} : -${dart.mult} vie${dart.mult > 1 ? 's' : ''}`
        if (target.lives === 0) { target.elim = true; msg = `${target.name} ÉLIMINÉ 💀` }
        if (aliveWin(g)) return { flash: 'GAME !' }
        return { toast: msg }
      }
    }
    return {}
  },

  scoreboard(g, p) {
    return {
      big: '♥'.repeat(Math.max(0, p.lives)) || '✗',
      sub: p.elim ? 'Éliminé' : `N°${p.number}${p.killer ? ' · TUEUR' : ''}`,
      pscoreStyle: { fontSize: '26px', color: p.lives > 0 ? 'var(--red)' : 'var(--muted)' },
    }
  },

  pad() { return { numbers: Array.from({ length: 20 }, (_, i) => i + 1), multipliers: true, bull: true, miss: true, missLabel: '⊘ Manqué' } },

  rank(g) {
    const ps = [...g.players].sort((a, b) => (b.id === g.winner) - (a.id === g.winner) || b.lives - a.lives)
    ps.sort((a, b) => (b.id === g.winner) - (a.id === g.winner))
    return ps
  },
  resultSub(g, p) { return p.elim ? 'Éliminé' : `${p.lives} vie(s)` },
}
