import { supabase, isConfigured } from './supabase.js'
import { createGame } from '../game/engine/core.js'
import { PALETTE } from '../game/engine/constants.js'

const HOST = 'host:host_id (id, username)'
const GUEST = 'guest:guest_id (id, username)'

// Modes jouables en ligne (on exclut le Défi de bar, jeu de comptoir local).
export const ONLINE_MODES = ['x01', 'cricket', 'atw', 'killer', 'countup']

export async function createInvite(hostId, guestId, mode, options) {
  const { data, error } = await supabase.from('matches')
    .insert({ host_id: hostId, guest_id: guestId, mode, options, status: 'invited' })
    .select().single()
  if (error) throw error
  return data
}

export async function getIncomingInvites(myId) {
  if (!isConfigured) return []
  const { data, error } = await supabase.from('matches')
    .select(`*, ${HOST}`).eq('guest_id', myId).eq('status', 'invited')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getActiveMatches(myId) {
  if (!isConfigured) return []
  const { data, error } = await supabase.from('matches')
    .select(`*, ${HOST}, ${GUEST}`)
    .or(`host_id.eq.${myId},guest_id.eq.${myId}`).eq('status', 'active')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getMatch(id) {
  const { data, error } = await supabase.from('matches').select(`*, ${HOST}, ${GUEST}`).eq('id', id).single()
  if (error) throw error
  return data
}

// Le destinataire accepte : on initialise l'état de jeu et on passe en "active".
export async function acceptInvite(match) {
  const players = [
    { id: match.host_id, name: match.host?.username || 'Hôte', color: PALETTE[0] },
    { id: match.guest_id, name: match.guest?.username || 'Invité', color: PALETTE[1] },
  ]
  const state = createGame(match.mode, players, match.options)
  state.snaps = []
  const { error } = await supabase.from('matches')
    .update({ state, status: 'active', turn_player_id: state.players[state.turn.pi].id, updated_at: new Date().toISOString() })
    .eq('id', match.id)
  if (error) throw error
}

export async function declineInvite(id) {
  const { error } = await supabase.from('matches').update({ status: 'declined' }).eq('id', id)
  if (error) throw error
}

export async function persistMatch(id, fields) {
  const { error } = await supabase.from('matches').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

// ---- Chat ----
export async function getMessages(matchId) {
  const { data, error } = await supabase.from('match_messages')
    .select('*').eq('match_id', matchId).order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}
export async function sendMessage(matchId, senderId, body) {
  const { error } = await supabase.from('match_messages').insert({ match_id: matchId, sender_id: senderId, body })
  if (error) throw error
}
