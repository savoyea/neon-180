import { uid, clone, makeDart } from './constants.js'
import { defaultAdvance } from './turn.js'
import { getMode } from './registry.js'

// Crée une partie. `players` = [{id,name,color}]
export function createGame(modeKey, players, opts) {
  const mode = getMode(modeKey)
  const g = {
    mode: modeKey,
    opts,
    finished: false,
    winner: null,
    startTs: Date.now(),
    sudden: false,
    legStart: 0,
    legNo: 1,
    variant: '',
    turn: { pi: 0, darts: [] },
    snaps: [],
    players: players.map((p) => ({ id: p.id, name: p.name, color: p.color })),
  }
  if (mode.initGame) mode.initGame(g)
  g.players.forEach((p, i) => {
    if (mode.initPlayer) mode.initPlayer(p, { opts, index: i, total: g.players.length, game: g })
  })
  return g
}

function snapshot(g) {
  g.snaps.push(JSON.stringify({
    players: g.players, turn: g.turn, legStart: g.legStart, legNo: g.legNo,
    finished: g.finished, winner: g.winner, sudden: g.sudden, phase: g.phase, target: g.target,
  }))
  if (g.snaps.length > 60) g.snaps.shift()
}

// Applique un dard. Retourne { game, result } où result indique l'orchestration à faire.
export function applyDart(game, seg, mult) {
  const g = clone(game)
  if (g.finished || g.turn.darts.length >= 3) return { game: g, result: {} }
  const mode = getMode(g.mode)
  snapshot(g)
  const dart = makeDart(seg, mult)
  g.turn.darts.push(dart)
  const p = g.players[g.turn.pi]
  // Distribution des impacts (carte thermique premium) — clé = label du dard.
  p.dartHits = p.dartHits || {}
  p.dartHits[dart.label] = (p.dartHits[dart.label] || 0) + 1
  const result = mode.applyDart(g, p, dart) || {}

  // Décision d'orchestration (timers gérés par l'appelant)
  if (g.finished) result.finish = true
  else if (result.bust) result.deferEndTurn = true
  else if (g.mode === 'atw' && g.sudden && g.turn.darts.length === 1 && !dart.good) result.suddenMiss = true
  else if (result.endTurn) result.deferEndTurn = true
  else if (g.turn.darts.length >= 3) result.deferEndTurn = true
  return { game: g, result }
}

// Fin de volée — passe au joueur suivant (ou rejoue en mort subite).
export function endTurn(game) {
  const g = clone(game)
  if (g.finished) return { game: g, result: { finish: true } }
  const mode = getMode(g.mode)
  // Score de la volée du joueur courant (analyse de partie : premier 9, meilleure volée…)
  const cur = g.players[g.turn.pi]
  cur.turnScores = cur.turnScores || []
  cur.turnScores.push(g.turn.darts.reduce((s, d) => s + d.val, 0))
  let r = {}
  if (mode.endTurn) r = mode.endTurn(g) || {}
  else defaultAdvance(g)
  if (g.finished) r.finish = true
  return { game: g, result: r }
}

export function undo(game) {
  const g = clone(game)
  if (!g.snaps.length) return { game: g, result: { toast: 'Rien à annuler' } }
  const s = JSON.parse(g.snaps.pop())
  Object.assign(g, {
    players: s.players, turn: s.turn, legStart: s.legStart, legNo: s.legNo,
    finished: s.finished, winner: s.winner, sudden: s.sudden, phase: s.phase, target: s.target,
  })
  return { game: g, result: {} }
}

// Action générique pour les modes à écran propre (ex : bar.record / assignDrink / nextTurn)
export function modeAction(game, name, payload) {
  const g = clone(game)
  const mode = getMode(g.mode)
  const fn = mode[name]
  const result = fn ? fn(g, payload) || {} : {}
  return { game: g, result }
}

// Sérialise une partie terminée pour l'historique.
export function buildRecord(game) {
  const g = game
  const mode = getMode(g.mode)
  return {
    id: uid(),
    mode: g.mode,
    modeName: mode.name,
    variant: g.variant,
    date: Date.now(),
    winner: g.winner,
    players: mode.rank(g).map((p, i) => ({
      id: p.id, name: p.name, rank: i + 1,
      sub: mode.resultSub(g, p),
      s180: p.s180 || 0, tons: p.tons || 0, bestCheckout: p.bestCheckout || 0,
      avg: g.mode === 'x01' && p.dartsThrown ? +(p.scored / p.dartsThrown * 3).toFixed(1) : 0,
      dartHits: p.dartHits || {},
      turnScores: p.turnScores || [],
    })),
  }
}
