import { useState, useEffect, useCallback, useRef } from 'react'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { isConfigured } from '../lib/supabase.js'
import {
  searchProfiles, getFriendships, relationMap,
  sendRequest, acceptRequest, removeFriendship,
  computeStatus, STATUS_LABEL,
} from '../lib/friends.js'

function StatusDot({ profile }) {
  const s = computeStatus(profile)
  const color = s === 'in_game' ? 'var(--amber)' : s === 'online' ? 'var(--neon)' : 'var(--muted-2)'
  return (
    <small style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: s !== 'offline' ? `0 0 8px ${color}` : 'none' }} />
      {STATUS_LABEL[s]}
    </small>
  )
}

function Avatar({ name }) { return <div className="avatar">{(name || '?').slice(0, 2).toUpperCase()}</div> }

export default function Friends() {
  const { user } = useAuth()
  const myId = user?.id
  const [tab, setTab] = useState('amis')
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] })
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [relations, setRelations] = useState({})
  const [busy, setBusy] = useState(false)
  const searchTimer = useRef(null)

  const refresh = useCallback(async () => {
    if (!myId) return
    try { setData(await getFriendships(myId)) } catch (e) { /* ignore */ }
  }, [myId])

  useEffect(() => { refresh() }, [refresh])

  // recherche debouncée
  useEffect(() => {
    if (tab !== 'recherche') return
    clearTimeout(searchTimer.current)
    if (!term.trim()) { setResults([]); return }
    searchTimer.current = setTimeout(async () => {
      try {
        const [res, rel] = await Promise.all([searchProfiles(term, myId), relationMap(myId)])
        setResults(res); setRelations(rel)
      } catch (e) { /* ignore */ }
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [term, tab, myId])

  async function act(fn) { setBusy(true); try { await fn() } finally { setBusy(false); refresh() } }

  if (!isConfigured) {
    return (
      <div className="screen">
        <TopBar title="Amis" />
        <div className="empty"><div className="big">👥</div><p>Connecte Supabase et crée un compte pour ajouter des amis.</p></div>
      </div>
    )
  }

  const pending = data.incoming.length

  return (
    <div className="screen">
      <TopBar title="Amis" />

      <div className="tabs">
        <button className={tab === 'amis' ? 'on' : ''} onClick={() => setTab('amis')}>Amis</button>
        <button className={tab === 'demandes' ? 'on' : ''} onClick={() => setTab('demandes')}>
          Demandes{pending > 0 && <span className="tab-badge">{pending}</span>}
        </button>
        <button className={tab === 'recherche' ? 'on' : ''} onClick={() => setTab('recherche')}>Rechercher</button>
      </div>

      {tab === 'amis' && (
        data.friends.length === 0
          ? <div className="empty"><div className="big">👥</div><p>Pas encore d’amis. Cherche un joueur par son pseudo !</p></div>
          : data.friends.map((e) => (
            <div className="row" key={e.friendshipId}>
              <Avatar name={e.profile.username} />
              <div className="meta"><b>{e.profile.username}</b><StatusDot profile={e.profile} /></div>
              <button className="btn sm danger" disabled={busy} onClick={() => act(() => removeFriendship(e.friendshipId))}>Retirer</button>
            </div>
          ))
      )}

      {tab === 'demandes' && (
        <>
          <div className="section-title"><h2>Reçues</h2></div>
          {data.incoming.length === 0
            ? <div className="empty" style={{ padding: 20 }}><p>Aucune demande reçue.</p></div>
            : data.incoming.map((e) => (
              <div className="row" key={e.friendshipId}>
                <Avatar name={e.profile.username} />
                <div className="meta"><b>{e.profile.username}</b><small>Niveau {e.profile.level}</small></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn sm primary" disabled={busy} onClick={() => act(() => acceptRequest(e.friendshipId))}>✓</button>
                  <button className="btn sm danger" disabled={busy} onClick={() => act(() => removeFriendship(e.friendshipId))}>✕</button>
                </div>
              </div>
            ))}
          <div className="section-title"><h2>Envoyées</h2></div>
          {data.outgoing.length === 0
            ? <div className="empty" style={{ padding: 20 }}><p>Aucune demande en attente.</p></div>
            : data.outgoing.map((e) => (
              <div className="row" key={e.friendshipId}>
                <Avatar name={e.profile.username} />
                <div className="meta"><b>{e.profile.username}</b><small>En attente…</small></div>
                <button className="btn sm ghost" disabled={busy} onClick={() => act(() => removeFriendship(e.friendshipId))}>Annuler</button>
              </div>
            ))}
        </>
      )}

      {tab === 'recherche' && (
        <>
          <input className="input" placeholder="Rechercher un joueur par pseudo…" value={term} onChange={(e) => setTerm(e.target.value)} style={{ marginBottom: 14 }} />
          {results.map((p) => {
            const rel = relations[p.id]
            return (
              <div className="row" key={p.id}>
                <Avatar name={p.username} />
                <div className="meta"><b>{p.username}</b><StatusDot profile={p} /></div>
                {rel === 'friend' ? <span className="muted" style={{ fontSize: 13 }}>✓ Ami</span>
                  : rel === 'outgoing' ? <span className="muted" style={{ fontSize: 13 }}>En attente</span>
                  : rel === 'incoming' ? <span className="muted" style={{ fontSize: 13 }}>Te suit</span>
                  : <button className="btn sm primary" disabled={busy} onClick={() => act(() => sendRequest(p.id, myId))}>Ajouter</button>}
              </div>
            )
          })}
          {term.trim() && results.length === 0 && <div className="empty" style={{ padding: 20 }}><p>Aucun joueur trouvé.</p></div>}
        </>
      )}
    </div>
  )
}
