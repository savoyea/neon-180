import { DARTBOARD_ORDER } from '../constants.js'

export function randomBarTarget(difficulty) {
  // Facile : uniquement des simples 1-20 (ni double, ni triple, ni bull)
  if (difficulty === 'easy') {
    return { num: DARTBOARD_ORDER[Math.floor(Math.random() * 20)], mult: 1 }
  }
  // Expert : ~12% bull, sinon 1-20 avec simple/double/triple pondérés
  if (Math.random() < 0.12) return { num: 25, mult: Math.random() < 0.3 ? 2 : 1 }
  const num = DARTBOARD_ORDER[Math.floor(Math.random() * 20)]
  const r = Math.random()
  const mult = r < 0.5 ? 1 : r < 0.75 ? 2 : 3
  return { num, mult }
}

export function barTargetLabel(t) {
  if (!t) return ''
  if (t.num === 25) return t.mult === 2 ? 'DOUBLE BULL (50)' : 'BULL (25)'
  return (t.mult === 2 ? 'DOUBLE ' : t.mult === 3 ? 'TRIPLE ' : '') + t.num + (t.mult > 1 ? ` (${t.num * t.mult})` : '')
}

export default {
  key: 'bar',
  name: 'Défi de bar',
  minPlayers: 2,
  custom: true, // utilise son propre écran (BarGame), pas le pavé standard
  defaultOptions: { rounds: 3, difficulty: 'expert' },
  optionFields: [
    { type: 'choice', key: 'difficulty', label: 'Niveau de difficulté', options: [
      { value: 'easy', label: '🟢 Facile', hint: 'Cibles dans les simples 1 à 20 — idéal débutant.' },
      { value: 'expert', label: '🔥 Expert', hint: 'Simple, double, triple et bull, comme en compétition.' },
    ] },
    { type: 'choice', key: 'rounds', label: 'Nombre de tours par joueur', options: [2, 3, 5].map((v) => ({ value: v, label: v + ' tours' })) },
  ],
  info: 'À ton tour, lance la loterie : la cible désigne un numéro. Touche-le avec tes 3 flèches, indique combien sont dedans. 1 ou plus → tu fais boire un joueur !',

  initGame(g) { g.phase = 'lottery'; g.target = null; g.spinning = false; g.lastCount = 0; g.drinkMsg = null },
  initPlayer(p) { p.hits = 0; p.sipsGiven = 0; p.sipsTaken = 0; p.turns = 0 },

  // ---- Actions (appelées par le composant BarGame) ----
  setTarget(g, t) { g.target = t; g.phase = 'aim'; g.spinning = false; return {} },
  record(g, n) {
    const cur = g.players[g.turn.pi]
    cur.hits += n
    g.lastCount = n
    if (n >= 1) { g.phase = 'drink'; return {} }
    return { toast: 'Raté… personne ne boit 🥲', next: true }
  },
  assignDrink(g, targetId) {
    const cur = g.players[g.turn.pi]
    const tgt = g.players.find((p) => p.id === targetId)
    if (!tgt) return {}
    const n = g.lastCount
    tgt.sipsTaken += n; cur.sipsGiven += n
    g.drinkMsg = { name: tgt.name, color: tgt.color, n }
    g.phase = 'announce'
    return {}
  },
  nextTurn(g) {
    const cur = g.players[g.turn.pi]
    cur.turns++
    if (g.players.every((p) => p.turns >= g.opts.rounds)) {
      const ranked = [...g.players].sort((a, b) => b.sipsGiven - a.sipsGiven || b.hits - a.hits)
      g.finished = true; g.winner = ranked[0].id
      return { finished: true }
    }
    g.turn = { pi: (g.turn.pi + 1) % g.players.length, darts: [] }
    g.phase = 'lottery'; g.target = null; g.drinkMsg = null
    return {}
  },

  rank(g) {
    const ps = [...g.players].sort((a, b) => b.sipsGiven - a.sipsGiven || b.hits - a.hits)
    ps.sort((a, b) => (b.id === g.winner) - (a.id === g.winner))
    return ps
  },
  resultSub(g, p) { return `${p.sipsGiven} gorgées données · ${p.hits} dans la cible` },
}
