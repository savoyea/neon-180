import { supabase, isConfigured } from './supabase.js'

export const TIERS = [
  { min: 1800, key: 'legende', name: 'Légende', emoji: '👑', color: '#FF5CE1' },
  { min: 1500, key: 'diamant', name: 'Diamant', emoji: '💎', color: '#3FE0FF' },
  { min: 1300, key: 'platine', name: 'Platine', emoji: '🔷', color: '#5CFFC8' },
  { min: 1100, key: 'or', name: 'Or', emoji: '🥇', color: '#FFD23F' },
  { min: 900, key: 'argent', name: 'Argent', emoji: '🥈', color: '#C0C8CC' },
  { min: 0, key: 'bronze', name: 'Bronze', emoji: '🥉', color: '#CD7F32' },
]
export function rankTier(elo) { return TIERS.find((t) => (elo ?? 1000) >= t.min) }
// progression vers le rang suivant (0-100)
export function tierProgress(elo) {
  const e = elo ?? 1000
  const idx = TIERS.findIndex((t) => e >= t.min)
  if (idx <= 0) return 100
  const cur = TIERS[idx], next = TIERS[idx - 1]
  return Math.min(100, Math.round(((e - cur.min) / (next.min - cur.min)) * 100))
}

export async function getRankedLeaderboard() {
  if (!isConfigured) return []
  const { data, error } = await supabase
    .from('profiles').select('id, username, level, elo, games_played, wins')
    .order('elo', { ascending: false }).limit(50)
  if (error) throw error
  return data || []
}

export async function findRankedMatch() {
  const { data, error } = await supabase.rpc('find_ranked_match')
  if (error) throw error
  return data // match_id | null
}
export async function leaveQueue() {
  try { await supabase.rpc('leave_ranked_queue') } catch (e) { /* ignore */ }
}

export async function rankingByMode(mode) {
  if (!isConfigured) return []
  const { data, error } = await supabase.rpc('global_ranking_by_mode', { p_mode: mode })
  if (error) throw error
  return data || []
}
