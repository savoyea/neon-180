import { pb } from './pocketbase.js'
import { createGame } from '../game/engine/core.js'
import { PALETTE } from '../game/engine/constants.js'

export const ONLINE_MODES = ['x01', 'cricket', 'atw', 'killer', 'countup']

export async function createInvite(hostId, guestId, mode, options, ranked = false) {
  return await pb.collection('matches').create({
    host_id: hostId, guest_id: guestId, mode, options, status: 'invited', ranked,
  })
}

export async function getIncomingInvites(myId) {
  try {
    const result = await pb.collection('matches').getFullList({
      filter: `guest_id = "${myId}" && status = "invited"`,
      expand: 'host_id',
      sort: '-created',
    })
    return result.map((r) => ({ ...r, host: r.expand?.host_id }))
  } catch { return [] }
}

export async function getActiveMatches(myId) {
  try {
    const result = await pb.collection('matches').getFullList({
      filter: `(host_id = "${myId}" || guest_id = "${myId}") && status = "active"`,
      expand: 'host_id,guest_id',
      sort: '-updated',
    })
    return result.map((r) => ({ ...r, host: r.expand?.host_id, guest: r.expand?.guest_id }))
  } catch { return [] }
}

export async function getMatch(id) {
  const record = await pb.collection('matches').getOne(id, { expand: 'host_id,guest_id' })
  return { ...record, host: record.expand?.host_id, guest: record.expand?.guest_id }
}

export async function acceptInvite(match) {
  const players = [
    { id: match.host_id, name: match.host?.username || 'Hôte', color: PALETTE[0] },
    { id: match.guest_id, name: match.guest?.username || 'Invité', color: PALETTE[1] },
  ]
  const state = createGame(match.mode, players, match.options)
  state.snaps = []
  await pb.collection('matches').update(match.id, {
    state, status: 'active', turn_player_id: state.players[state.turn.pi].id,
  })
}

export async function declineInvite(id) {
  await pb.collection('matches').update(id, { status: 'declined' })
}

export async function persistMatch(id, fields) {
  await pb.collection('matches').update(id, fields)
}

// ---- Chat ----
export async function getMessages(matchId) {
  try {
    const result = await pb.collection('match_messages').getFullList({
      filter: `match_id = "${matchId}"`,
      sort: 'created',
    })
    return result
  } catch { return [] }
}
export async function sendMessage(matchId, senderId, body) {
  await pb.collection('match_messages').create({ match_id: matchId, sender_id: senderId, body })
}
