import { defaultAdvance } from '../turn.js'

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

function aliveWin(g) {
  const alive = g.players.filter((o) => !o.elim)
  if (alive.length <= 1) { g.finished = true; g.winner = (alive[0] || g.players[0]).id; return true }
  return false
}

export const KILLER_AT = 3   // marques sur son numéro pour devenir tueur (score = 3)
export const ELIM_AT = -2    // score d'élimination

export default {
  key: 'killer',
  name: 'Killer',
  minPlayers: 2,
  board: null,
  defaultOptions: { assign: 'random', numbers: {} },
  optionFields: [
    { type: 'choice', key: 'assign', label: 'Numéros des joueurs', options: [
      { value: 'random', label: '🎲 Aléatoires', hint: 'Chaque joueur reçoit un numéro tiré au sort.' },
      { value: 'custom', label: '✍️ Choisis', hint: 'Attribue un numéro à chaque joueur.' },
    ] },
  ],
  info: 'Tout le monde démarre à 0. Mets 3 marques dans ton numéro pour devenir Tueur ☠ (score 3). En tant que tueur, vise les numéros adverses pour faire baisser leur score : à −2, le joueur est éliminé. Dernier survivant gagne. On ne peut pas se toucher soi-même une fois tueur.',

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
  initPlayer(p, { index, game }) { p.number = game._nums[index]; p.score = 0; p.killer = false; p.elim = false },

  applyDart(g, p, dart) {
    if (dart.seg === 0 || g.finished || p.elim) return {}
    const seg = dart.seg
    // Son propre numéro → progression vers Tueur (pas d'auto-dégât)
    if (seg === p.number) {
      if (p.killer) return {}
      p.score = Math.min(KILLER_AT, p.score + dart.mult)
      if (p.score >= KILLER_AT) { p.killer = true; p.score = KILLER_AT; return { flash: 'TUEUR ☠', toast: `${p.name} devient TUEUR ☠` } }
      return { toast: `${p.name} : ${Math.max(0, p.score)}/${KILLER_AT} pour devenir tueur` }
    }
    // Numéro adverse → seul un tueur peut attaquer
    if (p.killer) {
      const target = g.players.find((o) => o !== p && o.number === seg && !o.elim)
      if (target) {
        target.score -= dart.mult
        let msg = `${target.name} → ${target.score}`
        if (target.score <= ELIM_AT) { target.elim = true; msg = `${target.name} ÉLIMINÉ 💀` }
        if (aliveWin(g)) return { flash: 'GAME !' }
        return { toast: msg }
      }
    }
    return {}
  },

  scoreboard(g, p) {
    return {
      big: p.elim ? '💀' : p.score,
      sub: p.elim ? 'Éliminé' : `N°${p.number}${p.killer ? ' · TUEUR ☠' : ` · ${Math.max(0, p.score)}/${KILLER_AT}`}`,
      pscoreStyle: { fontSize: '32px', color: p.elim ? 'var(--muted)' : p.score < 0 ? 'var(--red)' : p.killer ? 'var(--neon)' : 'var(--text)' },
    }
  },

  // Pavé : uniquement les numéros attribués aux joueurs + hors-cible.
  pad(g) {
    const nums = [...new Set(g.players.map((p) => p.number))].sort((a, b) => a - b)
    return { numbers: nums, multipliers: true, bull: false, miss: true, missLabel: '⊘ Hors cible' }
  },

  rank(g) {
    const ps = [...g.players].sort((a, b) => (a.elim ? 1 : 0) - (b.elim ? 1 : 0) || b.score - a.score)
    ps.sort((a, b) => (b.id === g.winner) - (a.id === g.winner))
    return ps
  },
  resultSub(g, p) { return p.elim ? 'Éliminé' : `${p.score} pts` },
}
