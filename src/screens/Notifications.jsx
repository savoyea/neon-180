import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { isConfigured } from '../lib/supabase.js'
import { getFriendships, acceptRequest, removeFriendship } from '../lib/friends.js'
import { getIncomingInvites, acceptInvite, declineInvite } from '../lib/matches.js'
import { getMode } from '../game/engine/registry.js'

export default function Notifications() {
  const { user } = useAuth()
  const nav = useNavigate()
  const myId = user?.id
  const [tab, setTab] = useState('toutes')
  const [reqs, setReqs] = useState([])
  const [invites, setInvites] = useState([])
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => {
    if (!myId) return
    getFriendships(myId).then((d) => setReqs(d.incoming)).catch(() => {})
    getIncomingInvites(myId).then(setInvites).catch(() => {})
  }, [myId])
  useEffect(() => { refresh() }, [refresh])

  async function act(fn) { setBusy(true); try { await fn() } finally { setBusy(false); refresh() } }

  const items = [
    ...invites.map((i) => ({ kind: 'invite', cat: 'parties', data: i, ts: i.created_at })),
    ...reqs.map((r) => ({ kind: 'friend', cat: 'social', data: r, ts: null })),
  ].filter((it) => tab === 'toutes' || it.cat === tab)

  if (!isConfigured) {
    return <div className="screen"><TopBar back title="Notifications" /><div className="empty"><div className="big">🔔</div><p>Connecte-toi pour recevoir des notifications.</p></div></div>
  }

  return (
    <div className="screen">
      <TopBar back title="Notifications" />
      <div className="tabs">
        <button className={tab === 'toutes' ? 'on' : ''} onClick={() => setTab('toutes')}>Toutes</button>
        <button className={tab === 'social' ? 'on' : ''} onClick={() => setTab('social')}>Social</button>
        <button className={tab === 'parties' ? 'on' : ''} onClick={() => setTab('parties')}>Parties</button>
      </div>

      {items.length === 0 ? (
        <div className="empty"><div className="big">🔔</div><p>Aucune notification.</p></div>
      ) : items.map((it) => it.kind === 'invite' ? (
        <div className="row" key={'i' + it.data.id}>
          <div className="avatar" style={{ background: 'linear-gradient(150deg,var(--neon),var(--neon-dim))' }}>🎯</div>
          <div className="meta"><b>{it.data.host?.username || 'Un joueur'}</b><small>t’invite à jouer un {getMode(it.data.mode)?.name || it.data.mode}</small></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn sm primary" disabled={busy} onClick={() => act(async () => { await acceptInvite(it.data); nav('/match/' + it.data.id) })}>✓</button>
            <button className="btn sm danger" disabled={busy} onClick={() => act(() => declineInvite(it.data.id))}>✕</button>
          </div>
        </div>
      ) : (
        <div className="row" key={'f' + it.data.friendshipId}>
          <div className="avatar">{(it.data.profile.username || '?').slice(0, 2).toUpperCase()}</div>
          <div className="meta"><b>{it.data.profile.username}</b><small>t’a envoyé une demande d’ami</small></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn sm primary" disabled={busy} onClick={() => act(() => acceptRequest(it.data.friendshipId))}>✓</button>
            <button className="btn sm danger" disabled={busy} onClick={() => act(() => removeFriendship(it.data.friendshipId))}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
