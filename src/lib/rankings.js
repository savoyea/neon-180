import { pb } from './pocketbase.js'

export const RANK_METRICS = [
  { key: 'level', label: 'Niveau', col: 'xp', fmt: (p) => 'Niv ' + p.level },
  { key: 'wins', label: 'Victoires', col: 'wins', fmt: (p) => p.wins + ' V' },
  { key: 's180', label: '180', col: 'total_180', fmt: (p) => p.total_180 + ' × 180' },
]

export async function globalRanking(metricKey) {
  const metric = RANK_METRICS.find((m) => m.key === metricKey) || RANK_METRICS[0]
  try {
    const result = await pb.collection('users').getList(1, 50, {
      fields: 'id,username,level,xp,wins,total_180,games_played',
      sort: `-${metric.col},-xp`,
    })
    return result.items
  } catch { return [] }
}
