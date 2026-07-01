/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// Dart-180 — PocketBase JS Hooks
// Remplace les RPCs Supabase : log_game, apply_match_result,
// find_ranked_match, ranking_by_mode
// Les champs de profil sont directement sur la collection users.
// ============================================================

// ---- Initialisation des champs de jeu après inscription ----
onRecordAfterCreateRequest((e) => {
  const user = e.record
  try {
    // Les valeurs par défaut pour les champs de jeu
    user.set("level", 1)
    user.set("xp", 0)
    user.set("elo", 1000)
    user.set("games_played", 0)
    user.set("wins", 0)
    user.set("total_180", 0)
    user.set("best_checkout", 0)
    user.set("win_streak", 0)
    user.set("best_streak", 0)
    user.set("mode_wins", {})
    user.set("status", "offline")
    user.set("visible", true)
    $app.dao().saveRecord(user)
  } catch (err) {
    console.log("user init error:", err)
  }
}, "users")

// ---- apply_match_result ----
routerAdd("POST", "/api/actions/apply_match_result", (c) => {
  const authRecord = c.get("authRecord")
  if (!authRecord) return c.json(401, { error: "non authentifié" })

  const body = $apis.requestInfo(c).data
  const matchId = body.match_id
  if (!matchId) return c.json(400, { error: "match_id manquant" })

  try {
    const match = $app.dao().findRecordById("matches", matchId)
    if (!match) return c.json(404, { error: "match introuvable" })
    if (match.get("status") !== "finished") return c.json(400, { error: "match pas terminé" })
    if (match.getBool("rated")) return c.json(200, { ok: true }) // idempotent

    match.set("rated", true)
    $app.dao().saveRecord(match)

    const state = match.get("state") || {}
    const players = state.players || []
    const winnerId = match.get("winner_id") || ""

    for (const pl of players) {
      const pid = pl.id || ""
      if (!pid) continue
      const isWin = pid === winnerId
      const s180 = parseInt(pl.s180) || 0
      const bestco = parseInt(pl.bestCheckout) || 0
      const addXp = (isWin ? 100 : 25) + s180 * 20

      try {
        const user = $app.dao().findRecordById("users", pid)
        const curStreak = user.getInt("win_streak") || 0
        const newStreak = isWin ? curStreak + 1 : 0
        const newXp = (user.getInt("xp") || 0) + addXp
        user.set("games_played", (user.getInt("games_played") || 0) + 1)
        user.set("wins", (user.getInt("wins") || 0) + (isWin ? 1 : 0))
        user.set("total_180", (user.getInt("total_180") || 0) + s180)
        user.set("best_checkout", Math.max(user.getInt("best_checkout") || 0, bestco))
        user.set("win_streak", newStreak)
        user.set("best_streak", Math.max(user.getInt("best_streak") || 0, newStreak))
        user.set("xp", newXp)
        user.set("level", Math.max(1, Math.floor(newXp / 1000) + 1))
        if (isWin && state.mode) {
          const mw = user.get("mode_wins") || {}
          mw[state.mode] = (mw[state.mode] || 0) + 1
          user.set("mode_wins", mw)
        }
        $app.dao().saveRecord(user)
      } catch (err) {
        console.log("user update error for " + pid + ":", err)
      }
    }

    // ELO (parties classées, 2 joueurs)
    if (match.getBool("ranked") && players.length === 2) {
      const p1id = players[0].id
      const p2id = players[1].id
      try {
        const u1 = $app.dao().findRecordById("users", p1id)
        const u2 = $app.dao().findRecordById("users", p2id)
        const e1 = u1.getInt("elo") || 1000
        const e2 = u2.getInt("elo") || 1000
        const exp1 = 1.0 / (1 + Math.pow(10, (e2 - e1) / 400.0))
        const s1 = winnerId === p1id ? 1 : 0
        u1.set("elo", Math.max(100, Math.round(e1 + 32 * (s1 - exp1))))
        u2.set("elo", Math.max(100, Math.round(e2 + 32 * ((1 - s1) - (1 - exp1)))))
        $app.dao().saveRecord(u1)
        $app.dao().saveRecord(u2)
      } catch (err) {
        console.log("ELO error:", err)
      }
    }

    return c.json(200, { ok: true })
  } catch (err) {
    return c.json(500, { error: String(err) })
  }
})

// ---- log_game ----
routerAdd("POST", "/api/actions/log_game", (c) => {
  const authRecord = c.get("authRecord")
  if (!authRecord) return c.json(401, { error: "non authentifié" })

  const body = $apis.requestInfo(c).data
  const record = body.record
  const updateStats = Boolean(body.update_stats)
  const online = Boolean(body.online)
  if (!record) return c.json(400, { error: "record manquant" })

  const me = authRecord.id
  const players = record.players || []
  const mine = players.find((p) => p.id === me)
  if (!mine) return c.json(200, { ok: true })

  try {
    const col = $app.dao().findCollectionByNameOrId("games")
    const game = new Record(col)
    game.set("created_by", me)
    game.set("mode", record.mode || "")
    game.set("variant", record.variant || "")
    game.set("is_online", online)
    game.set("winner_id", record.winner === me ? me : "")
    game.set("record", record)
    game.set("status", "finished")
    $app.dao().saveRecord(game)

    if (updateStats) {
      const user = $app.dao().findRecordById("users", me)
      const isWin = record.winner === me
      const s180 = parseInt(mine.s180) || 0
      const bestco = parseInt(mine.bestCheckout) || 0
      const addXp = (isWin ? 100 : 25) + s180 * 20
      const curStreak = user.getInt("win_streak") || 0
      const newStreak = isWin ? curStreak + 1 : 0
      const newXp = (user.getInt("xp") || 0) + addXp
      user.set("games_played", (user.getInt("games_played") || 0) + 1)
      user.set("wins", (user.getInt("wins") || 0) + (isWin ? 1 : 0))
      user.set("total_180", (user.getInt("total_180") || 0) + s180)
      user.set("best_checkout", Math.max(user.getInt("best_checkout") || 0, bestco))
      user.set("win_streak", newStreak)
      user.set("best_streak", Math.max(user.getInt("best_streak") || 0, newStreak))
      user.set("xp", newXp)
      user.set("level", Math.max(1, Math.floor(newXp / 1000) + 1))
      if (isWin && record.mode) {
        const mw = user.get("mode_wins") || {}
        mw[record.mode] = (mw[record.mode] || 0) + 1
        user.set("mode_wins", mw)
      }
      $app.dao().saveRecord(user)
    }

    return c.json(200, { ok: true, id: game.id })
  } catch (err) {
    return c.json(500, { error: String(err) })
  }
})

// ---- find_ranked_match ----
routerAdd("POST", "/api/actions/find_ranked_match", (c) => {
  const authRecord = c.get("authRecord")
  if (!authRecord) return c.json(401, { error: "non authentifié" })
  const me = authRecord.id

  try {
    const myUser = $app.dao().findRecordById("users", me)
    const myElo = myUser.getInt("elo") || 1000

    let opp = null
    try {
      const rows = $app.dao().findRecordsByFilter(
        "ranked_queue", `player_id != "${me}"`, "-created", 50, 0
      )
      if (rows && rows.length > 0) {
        rows.sort((a, b) => Math.abs(a.getInt("elo") - myElo) - Math.abs(b.getInt("elo") - myElo))
        opp = rows[0]
      }
    } catch { /* queue vide */ }

    if (opp) {
      try { $app.dao().deleteRecord(opp) } catch { /* ignore */ }
      try {
        const myRow = $app.dao().findFirstRecordByData("ranked_queue", "player_id", me)
        if (myRow) $app.dao().deleteRecord(myRow)
      } catch { /* pas dans la file */ }

      const col = $app.dao().findCollectionByNameOrId("matches")
      const match = new Record(col)
      match.set("host_id", opp.getString("player_id"))
      match.set("guest_id", me)
      match.set("mode", "x01")
      match.set("options", { start: 501, doubleOut: true, doubleIn: false, legs: 1 })
      match.set("ranked", true)
      match.set("status", "invited")
      $app.dao().saveRecord(match)
      return c.json(200, { match_id: match.id })
    } else {
      try {
        const existing = $app.dao().findFirstRecordByData("ranked_queue", "player_id", me)
        if (existing) {
          existing.set("elo", myElo)
          $app.dao().saveRecord(existing)
        } else {
          throw new Error("not found")
        }
      } catch {
        const col = $app.dao().findCollectionByNameOrId("ranked_queue")
        const row = new Record(col)
        row.set("player_id", me)
        row.set("elo", myElo)
        $app.dao().saveRecord(row)
      }
      return c.json(200, { match_id: null })
    }
  } catch (err) {
    return c.json(500, { error: String(err) })
  }
})

// ---- ranking_by_mode ----
routerAdd("GET", "/api/actions/ranking_by_mode", (c) => {
  const mode = c.queryParam("mode") || "x01"
  try {
    const records = $app.dao().findRecordsByFilter(
      "users", "games_played > 0", "-elo", 50, 0
    )
    const result = (records || []).map((u) => {
      const mw = u.get("mode_wins") || {}
      const count = mode === "defis"
        ? (mw.atw || 0) + (mw.killer || 0) + (mw.countup || 0) + (mw.bar || 0)
        : (mw[mode] || 0)
      return {
        id: u.id,
        username: u.getString("username"),
        level: u.getInt("level"),
        elo: u.getInt("elo"),
        games_played: u.getInt("games_played"),
        mode_wins_count: count,
      }
    }).sort((a, b) => b.mode_wins_count - a.mode_wins_count || b.elo - a.elo).slice(0, 50)
    return c.json(200, result)
  } catch (err) {
    return c.json(500, { error: String(err) })
  }
})
