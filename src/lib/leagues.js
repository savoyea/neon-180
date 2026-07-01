import { pb } from './pocketbase.js'

export async function createLeague({ name, emoji, description, celebration }) {
  // Créer la ligue + ajouter le créateur comme owner (atomique côté hook PB)
  const league = await pb.collection('leagues').create({
    name, emoji: emoji || '🎯', description: description || '', celebration: celebration || '',
    owner_id: pb.authStore.model?.id, is_open: true,
  })
  await pb.collection('league_members').create({
    league_id: league.id, player_id: pb.authStore.model?.id, role: 'owner', status: 'active',
  })
  return league.id
}

export async function getMyLeagues(myId) {
  if (!myId) return []
  try {
    const result = await pb.collection('league_members').getFullList({
      filter: `player_id = "${myId}" && status = "active"`,
      expand: 'league_id',
    })
    return result.map((r) => ({ ...r.expand?.league_id, myRole: r.role })).filter(Boolean)
  } catch { return [] }
}

export async function discoverLeagues(myId) {
  try {
    const [all, mine] = await Promise.all([
      pb.collection('leagues').getList(1, 50, { sort: '-created' }),
      getMyLeagues(myId),
    ])
    const mineIds = new Set(mine.map((l) => l.id))
    return all.items.filter((l) => !mineIds.has(l.id))
  } catch { return [] }
}

export async function getLeague(id) {
  return await pb.collection('leagues').getOne(id)
}

export async function getMembers(leagueId) {
  try {
    const result = await pb.collection('league_members').getFullList({
      filter: `league_id = "${leagueId}"`,
      expand: 'player_id',
    })
    return result
      .map((r) => ({ role: r.role, status: r.status, ...r.expand?.player_id }))
      .sort((a, b) => (b.xp || 0) - (a.xp || 0) || (b.wins || 0) - (a.wins || 0))
  } catch { return [] }
}

export async function joinLeague(leagueId, myId, isOpen) {
  try {
    await pb.collection('league_members').create({
      league_id: leagueId, player_id: myId, status: isOpen ? 'active' : 'pending',
    })
  } catch (e) {
    if (!e.message?.includes('unique')) throw e
  }
}
export async function acceptMember(leagueId, playerId) {
  const result = await pb.collection('league_members').getFirstListItem(
    `league_id = "${leagueId}" && player_id = "${playerId}"`
  )
  await pb.collection('league_members').update(result.id, { status: 'active' })
}
export async function removeMember(leagueId, playerId) {
  const result = await pb.collection('league_members').getFirstListItem(
    `league_id = "${leagueId}" && player_id = "${playerId}"`
  )
  await pb.collection('league_members').delete(result.id)
}

export async function getWinnerCelebration(winnerId) {
  if (!winnerId) return null
  try {
    const result = await pb.collection('league_members').getFullList({
      filter: `player_id = "${winnerId}" && status = "active"`,
      expand: 'league_id',
    })
    const hit = result.map((r) => r.expand?.league_id).find((l) => l?.celebration)
    return hit || null
  } catch { return null }
}
