import { pb } from './pocketbase.js'

export const TIERS = [
  { min: 1800, key: 'legende', name: 'Légende', emoji: '👑', color: '#FF5CE1' },
  { min: 1500, key: 'diamant', name: 'Diamant', emoji: '💎', color: '#3FE0FF' },
  { min: 1300, key: 'platine', name: 'Platine', emoji: '🔷', color: '#5CFFC8' },
  { min: 1100, key: 'or', name: 'Or', emoji: '🥇', color: '#FFD23F' },
  { min: 900, key: 'argent', name: 'Argent', emoji: '🥈', color: '#C0C8CC' },
  { min: 0, key: 'bronze', name: 'Bronze', emoji: '🥉', color: '#CD7F32' },
]
export function rankTier(elo) { return TIERS.find((t) => (elo ?? 1000) >= t.min) }
export function tierProgress(elo) {
  const e = elo ?? 1000
  const idx = TIERS.findIndex((t) => e >= t.min)
  if (idx <= 0) return 100
  const cur = TIERS[idx], next = TIERS[idx - 1]
  return Math.min(100, Math.round(((e - cur.min) / (next.min - cur.min)) * 100))
}

export async function getRankedLeaderboard() {
  try {
    const result = await pb.collection('users').getList(1, 50, {
      fields: 'id,username,level,elo,games_played,wins',
      sort: '-elo',
    })
    return result.items
  } catch { return [] }
}

// Appelle le hook serveur PocketBase qui gère le matchmaking atomique
export async function findRankedMatch() {
  const res = await pb.send('/api/actions/find_ranked_match', { method: 'POST' })
  return res?.match_id || null
}

export async function leaveQueue() {
  try {
    const me = pb.authStore.model?.id
    if (!me) return
    const row = await pb.collection('ranked_queue').getFirstListItem(`player_id = "${me}"`).catch(() => null)
    if (row) await pb.collection('ranked_queue').delete(row.id)
  } catch { /* ignore */ }
}

export async function rankingByMode(mode) {
  try {
    const res = await pb.send(`/api/actions/ranking_by_mode?mode=${encodeURIComponent(mode)}`, { method: 'GET' })
    return res || []
  } catch { return [] }
}
