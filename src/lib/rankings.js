import { supabase, isConfigured } from './supabase.js'

// Classement mondial selon une métrique.
export const RANK_METRICS = [
  { key: 'level', label: 'Niveau', col: 'xp', fmt: (p) => 'Niv ' + p.level },
  { key: 'wins', label: 'Victoires', col: 'wins', fmt: (p) => p.wins + ' V' },
  { key: 's180', label: '180', col: 'total_180', fmt: (p) => p.total_180 + ' × 180' },
]

export async function globalRanking(metricKey) {
  if (!isConfigured) return []
  const metric = RANK_METRICS.find((m) => m.key === metricKey) || RANK_METRICS[0]
  const { data, error } = await supabase
    .from('profiles').select('id, username, level, xp, wins, total_180, games_played')
    .order(metric.col, { ascending: false }).order('xp', { ascending: false }).limit(50)
  if (error) throw error
  return data || []
}
