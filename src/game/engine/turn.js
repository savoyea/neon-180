// Avancement par défaut : passe au joueur suivant en sautant les éliminés / terminés.
export function defaultAdvance(g) {
  let idx = g.turn.pi, guard = 0
  do {
    idx = (idx + 1) % g.players.length
    guard++
  } while (guard <= g.players.length && (g.players[idx].elim || g.players[idx].done))
  g.turn = { pi: idx, darts: [] }
}
