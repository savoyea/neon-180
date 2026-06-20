import { defaultAdvance } from '../turn.js'

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

function aliveWin(g) {
  const alive = g.players.filter((o) => !o.elim)
  if (alive.length <= 1) { g.finished = true; g.winner = (alive[0] || g.players[0]).id; return true }
  return false
}

export const KILLER_TO_BECOME = 3 // marques sur son numéro pour devenir tueur

export default {
  key: 'killer',
  name: 'Killer',
  minPlayers: 2,
  board: null,
  defaultOptions: { lives: 3, assign: 'random', numbers: {} },
  optionFields: [
    { type: 'choice', key: 'lives', label: 'Vies par joueur', options: [3, 4, 5].map((v) => ({ value: v, label: v + ' vies' })) },
    { type: 'choice', key: 'assign', label: 'Numéros des joueurs', options: [
      { value: 'random', label: '🎲 Aléatoires', hint: 'Chaque joueur reçoit un numéro tiré au sort.' },
      { value: 'custom', label: '✍️ Choisis', hint: 'Attribue un numéro à chaque joueur.' },
    ] },
  ],
  info: 'Touche 3 fois ton numéro pour devenir Tueur ☠, puis vise les numéros adverses pour leur retirer des vies (double = 2, triple = 3). On ne peut pas se blesser soi-même. Dernier survivant gagne.',

  initGame(g) {
    const all = [...Array(20)].map((_, i) => i + 1)
    if (g.opts.assign === 'custom') {
      const chosen = g.opts.numbers || {}
      const used = new Set(Object.values(chosen).filter(Boolean))
      const pool = all.filter((n) => !used.has(n))
      g._nums = g.players.map((p) => chosen[p.id] || pool.shift())
    } else {
      g._nums = shuffle(all).slice(0, g.players.length)
    }
  },
  initPlayer(p, { index, game }) { p.number = game._nums[index]; p.lives = game.opts.lives; p.killer = false; p.killerHits = 0; p.elim = false },

  applyDart(g, p, dart) {
    if (dart.seg === 0 || g.finished || p.elim) return {}
    const seg = dart.seg
    // Toucher son propre numéro
    if (seg === p.number) {
      if (p.killer) return {} // déjà tueur — on ne peut pas se blesser soi-même
      p.killerHits = Math.min(KILLER_TO_BECOME, p.killerHits + dart.mult)
      if (p.killerHits >= KILLER_TO_BECOME) { p.killer = true; return { flash: 'TUEUR ☠', toast: `${p.name} devient TUEUR ☠` } }
      return { toast: `${p.name} : ${p.killerHits}/${KILLER_TO_BECOME} pour devenir tueur` }
    }
    // Toucher un adversaire (seulement si on est tueur)
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
      sub: p.elim ? 'Éliminé' : p.killer ? `N°${p.number} · TUEUR ☠` : `N°${p.number} · ${p.killerHits || 0}/${KILLER_TO_BECOME}`,
      pscoreStyle: { fontSize: '26px', color: p.lives > 0 ? 'var(--red)' : 'var(--muted)' },
    }
  },

  // Pavé : uniquement les numéros attribués aux joueurs + hors-cible.
  pad(g) {
    const nums = [...new Set(g.players.map((p) => p.number))].sort((a, b) => a - b)
    return { numbers: nums, multipliers: true, bull: false, miss: true, missLabel: '⊘ Hors cible' }
  },

  rank(g) {
    const ps = [...g.players].sort((a, b) => (b.id === g.winner) - (a.id === g.winner) || b.lives - a.lives)
    ps.sort((a, b) => (b.id === g.winner) - (a.id === g.winner))
    return ps
  },
  resultSub(g, p) { return p.elim ? 'Éliminé' : `${p.lives} vie(s)` },
}
