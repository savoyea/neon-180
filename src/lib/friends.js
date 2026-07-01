import { pb } from './pocketbase.js'

const PROFILE_COLS = 'id, username, level, status, last_seen'

export function computeStatus(profile) {
  if (!profile?.last_seen) return 'offline'
  const fresh = Date.now() - new Date(profile.last_seen).getTime() < 90_000
  if (!fresh) return 'offline'
  if (profile.status === 'in_game') return 'in_game'
  if (profile.status === 'online') return 'online'
  return 'offline'
}
export const STATUS_LABEL = { online: 'En ligne', offline: 'Hors ligne', in_game: 'En partie' }

export async function getProfileById(id) {
  try {
    return await pb.collection('users').getOne(id)
  } catch { return null }
}

export async function searchProfiles(term, myId) {
  if (!term.trim()) return []
  try {
    const result = await pb.collection('users').getList(1, 20, {
      filter: `username ~ "${term.trim().replace(/"/g, '')}" && id != "${myId}"`,
      fields: PROFILE_COLS,
    })
    return result.items
  } catch { return [] }
}

export async function getFriendships(myId) {
  try {
    const result = await pb.collection('friendships').getFullList({
      filter: `requester_id = "${myId}" || addressee_id = "${myId}"`,
      expand: 'requester_id,addressee_id',
    })
    const friends = [], incoming = [], outgoing = []
    for (const f of result) {
      const other = f.requester_id === myId
        ? f.expand?.addressee_id
        : f.expand?.requester_id
      const entry = { friendshipId: f.id, profile: other }
      if (f.status === 'accepted') friends.push(entry)
      else if (f.addressee_id === myId) incoming.push(entry)
      else outgoing.push(entry)
    }
    return { friends, incoming, outgoing }
  } catch { return { friends: [], incoming: [], outgoing: [] } }
}

export async function relationMap(myId) {
  const { friends, incoming, outgoing } = await getFriendships(myId)
  const map = {}
  friends.forEach((e) => (map[e.profile?.id] = 'friend'))
  incoming.forEach((e) => (map[e.profile?.id] = 'incoming'))
  outgoing.forEach((e) => (map[e.profile?.id] = 'outgoing'))
  return map
}

export async function sendRequest(addresseeId, myId) {
  try {
    await pb.collection('friendships').create({ requester_id: myId, addressee_id: addresseeId, status: 'pending' })
  } catch (e) {
    if (!e.message?.includes('unique')) throw e
  }
}
export async function acceptRequest(friendshipId) {
  await pb.collection('friendships').update(friendshipId, { status: 'accepted' })
}
export async function removeFriendship(friendshipId) {
  await pb.collection('friendships').delete(friendshipId)
}
