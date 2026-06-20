import { supabase, isConfigured } from './supabase.js'

const MEMBER_PROFILE = 'player:player_id (id, username, level, xp, wins, games_played, total_180)'

export async function createLeague({ name, emoji, description, celebration }) {
  const { data, error } = await supabase.rpc('create_league', {
    p_name: name, p_emoji: emoji || '🎯', p_description: description || null, p_celebration: celebration || null,
  })
  if (error) throw error
  return data // league id
}

export async function getMyLeagues(myId) {
  if (!isConfigured || !myId) return []
  const { data, error } = await supabase
    .from('league_members').select('role, status, league:league_id (*)')
    .eq('player_id', myId).eq('status', 'active')
  if (error) throw error
  return (data || []).map((r) => ({ ...r.league, myRole: r.role }))
}

export async function discoverLeagues(myId) {
  if (!isConfigured) return []
  const [{ data: all }, mine] = await Promise.all([
    supabase.from('leagues').select('*').order('created_at', { ascending: false }).limit(50),
    getMyLeagues(myId),
  ])
  const mineIds = new Set(mine.map((l) => l.id))
  return (all || []).filter((l) => !mineIds.has(l.id))
}

export async function getLeague(id) {
  const { data, error } = await supabase.from('leagues').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function getMembers(leagueId) {
  const { data, error } = await supabase
    .from('league_members').select(`role, status, ${MEMBER_PROFILE}`).eq('league_id', leagueId)
  if (error) throw error
  return (data || [])
    .map((r) => ({ role: r.role, status: r.status, ...r.player }))
    .sort((a, b) => (b.xp || 0) - (a.xp || 0) || (b.wins || 0) - (a.wins || 0))
}

export async function joinLeague(leagueId, myId, isOpen) {
  const { error } = await supabase.from('league_members')
    .insert({ league_id: leagueId, player_id: myId, status: isOpen ? 'active' : 'pending' })
  if (error && error.code !== '23505') throw error
}
export async function acceptMember(leagueId, playerId) {
  const { error } = await supabase.from('league_members').update({ status: 'active' }).eq('league_id', leagueId).eq('player_id', playerId)
  if (error) throw error
}
export async function removeMember(leagueId, playerId) {
  const { error } = await supabase.from('league_members').delete().eq('league_id', leagueId).eq('player_id', playerId)
  if (error) throw error
}

// Phrase de célébration de la ligue du gagnant (affichée chez le perdant).
export async function getWinnerCelebration(winnerId) {
  if (!isConfigured || !winnerId) return null
  const { data } = await supabase
    .from('league_members').select('league:league_id (name, emoji, celebration)')
    .eq('player_id', winnerId).eq('status', 'active')
  const hit = (data || []).map((r) => r.league).find((l) => l && l.celebration)
  return hit || null
}
