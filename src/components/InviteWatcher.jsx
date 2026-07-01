import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { pb } from '../lib/pocketbase.js'
import { getIncomingInvites, acceptInvite, declineInvite } from '../lib/matches.js'
import { getMode } from '../game/engine/registry.js'

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
    if (!myId) return
    pb.collection('matches').subscribe('*', (e) => {
      if (e.record.guest_id === myId) refresh()
    }).catch(() => {})
    return () => { pb.collection('matches').unsubscribe() }
  }, [myId, refresh])

  if (invites.length === 0) return null
  const inv = invites[0]
  const mode = getMode(inv.mode)

  async function accept() {
    setBusy(true)
    try { await acceptInvite(inv); nav('/match/' + inv.id) }
    catch { setBusy(false); refresh() }
  }
  async function decline() {
    setBusy(true)
    try { await declineInvite(inv.id) } finally { setBusy(false); refresh() }
  }

  return (
    <div className="invite-banner">
      <div className="it">🎯 <b>{inv.host?.username || 'Un joueur'}</b> t'invite à jouer un <b>{mode?.name || inv.mode}</b> !</div>
      <div className="invite-actions">
        <button className="btn ghost" disabled={busy} onClick={decline}>Refuser</button>
        <button className="btn primary" disabled={busy} onClick={accept}>Accepter &amp; jouer</button>
      </div>
    </div>
  )
}
