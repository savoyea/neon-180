import { supabase, isConfigured } from './supabase.js'

const PROFILE_COLS = 'id, username, level, status, last_seen'

// Présence : en ligne si vu il y a moins de 90 s.
export function computeStatus(profile) {
  if (!profile?.last_seen) return 'offline'
  const fresh = Date.now() - new Date(profile.last_seen).getTime() < 90_000
  if (!fresh) return 'offline'
  if (profile.status === 'in_game') return 'in_game'
  if (profile.status === 'online') return 'online'
  return 'offline' // status 'offline' (joueur invisible) ou inconnu
}
export const STATUS_LABEL = { online: 'En ligne', offline: 'Hors ligne', in_game: 'En partie' }

export async function getProfileById(id) {
  if (!isConfigured) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function searchProfiles(term, myId) {
  if (!isConfigured || !term.trim()) return []
  const { data, error } = await supabase
    .from('profiles').select(PROFILE_COLS)
    .ilike('username', `%${term.trim()}%`).neq('id', myId).limit(20)
  if (error) throw error
  return data || []
}

// Récupère toutes mes relations, résolues avec les deux profils.
export async function getFriendships(myId) {
  if (!isConfigured) return { friends: [], incoming: [], outgoing: [] }
  const { data, error } = await supabase
    .from('friendships')
    .select(`id, status, requester_id, addressee_id,
             requester:requester_id (${PROFILE_COLS}),
             addressee:addressee_id (${PROFILE_COLS})`)
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`)
  if (error) throw error
  const friends = [], incoming = [], outgoing = []
  for (const f of data || []) {
    const other = f.requester_id === myId ? f.addressee : f.requester
    const entry = { friendshipId: f.id, profile: other }
    if (f.status === 'accepted') friends.push(entry)
    else if (f.addressee_id === myId) incoming.push(entry)
    else outgoing.push(entry)
  }
  return { friends, incoming, outgoing }
}

// État relationnel pour annoter les résultats de recherche.
export async function relationMap(myId) {
  const { friends, incoming, outgoing } = await getFriendships(myId)
  const map = {}
  friends.forEach((e) => (map[e.profile.id] = 'friend'))
  incoming.forEach((e) => (map[e.profile.id] = 'incoming'))
  outgoing.forEach((e) => (map[e.profile.id] = 'outgoing'))
  return map
}

export async function sendRequest(addresseeId, myId) {
  const { error } = await supabase.from('friendships').insert({ requester_id: myId, addressee_id: addresseeId })
  if (error && error.code !== '23505') throw error // 23505 = déjà demandé
}
export async function acceptRequest(friendshipId) {
  const { error } = await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', friendshipId)
  if (error) throw error
}
export async function removeFriendship(friendshipId) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
  if (error) throw error
}
