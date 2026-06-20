import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { supabase, isConfigured } from '../lib/supabase.js'
import { getIncomingInvites, acceptInvite, declineInvite } from '../lib/matches.js'
import { getMode } from '../game/engine/registry.js'

// Surveille les invitations entrantes et affiche une bannière "X t'invite à jouer".
export default function InviteWatcher() {
  const { user } = useAuth()
  const nav = useNavigate()
  const myId = user?.id
  const [invites, setInvites] = useState([])
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => {
    if (!myId) return
    getIncomingInvites(myId).then(setInvites).catch(() => {})
  }, [myId])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!isConfigured || !myId) return
    const ch = supabase.channel('invites:' + myId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: 'guest_id=eq.' + myId }, () => refresh())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [myId, refresh])

  if (invites.length === 0) return null
  const inv = invites[0]
  const mode = getMode(inv.mode)

  async function accept() {
    setBusy(true)
    try { await acceptInvite(inv); nav('/match/' + inv.id) }
    catch (e) { setBusy(false); refresh() }
  }
  async function decline() {
    setBusy(true)
    try { await declineInvite(inv.id) } finally { setBusy(false); refresh() }
  }

  return (
    <div className="invite-banner">
      <div className="it">🎯 <b>{inv.host?.username || 'Un joueur'}</b> t’invite à jouer un <b>{mode?.name || inv.mode}</b> !</div>
      <div className="invite-actions">
        <button className="btn ghost" disabled={busy} onClick={decline}>Refuser</button>
        <button className="btn primary" disabled={busy} onClick={accept}>Accepter &amp; jouer</button>
      </div>
    </div>
  )
}
