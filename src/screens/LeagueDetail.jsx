import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { getLeague, getMembers, joinLeague, acceptMember, removeMember } from '../lib/leagues.js'

export default function LeagueDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const myId = user?.id
  const [league, setLeague] = useState(null)
  const [members, setMembers] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const refresh = useCallback(() => {
    getLeague(id).then(setLeague).catch(() => setErr('Ligue introuvable'))
    getMembers(id).then(setMembers).catch(() => {})
  }, [id])
  useEffect(() => { refresh() }, [refresh])

  async function act(fn) { setBusy(true); try { await fn() } finally { setBusy(false); refresh() } }

  if (err) return <div className="screen"><TopBar back title="Ligue" /><div className="empty"><div className="big">🚫</div><p>{err}</p></div></div>
  if (!league) return <div className="center-screen"><div><div className="spinner" />Chargement…</div></div>

  const me = members.find((m) => m.id === myId)
  const isOwner = league.owner_id === myId
  const active = members.filter((m) => m.status === 'active')
  const pending = members.filter((m) => m.status === 'pending')

  return (
    <div className="screen">
      <TopBar back title="Ligue" />

      <div className="card glow" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>{league.emoji}</div>
        <h2 style={{ fontSize: 22, color: '#fff' }}>{league.name}</h2>
        <p className="muted" style={{ fontSize: 13, margin: '6px 0' }}>{league.description}</p>
        {league.celebration && (
          <div className="celebration" style={{ marginTop: 12 }}>
            <div className="cel-text">“{league.celebration}”</div>
          </div>
        )}
        <small className="muted">{active.length} membre{active.length > 1 ? 's' : ''}</small>
      </div>

      {!me && (
        <button className="btn primary" style={{ marginTop: 14 }} disabled={busy}
          onClick={() => act(() => joinLeague(id, myId, league.is_open))}>
          {league.is_open ? 'Rejoindre la ligue' : 'Demander l’accès'}
        </button>
      )}
      {me?.status === 'pending' && <div className="empty" style={{ padding: 16 }}><p>Demande en attente d’acceptation…</p></div>}

      {isOwner && pending.length > 0 && (
        <>
          <div className="section-title"><h2>Demandes d’accès</h2><span className="tab-badge">{pending.length}</span></div>
          {pending.map((p) => (
            <div className="row" key={p.id}>
              <div className="avatar">{p.username.slice(0, 2).toUpperCase()}</div>
              <div className="meta"><b>{p.username}</b><small>Niveau {p.level}</small></div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm primary" disabled={busy} onClick={() => act(() => acceptMember(id, p.id))}>✓</button>
                <button className="btn sm danger" disabled={busy} onClick={() => act(() => removeMember(id, p.id))}>✕</button>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="section-title"><h2>Classement</h2><span className="hint">par XP</span></div>
      {active.map((p, i) => (
        <div key={p.id} className={'rank-row' + (p.id === myId ? ' me' : '')} style={{ cursor: 'pointer' }}
          onClick={() => p.id !== myId && nav('/player/' + p.id)}>
          <div className={'pos' + (i < 3 ? ' top' : '')}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</div>
          <div className="meta"><b>{p.username}{p.role === 'owner' ? ' 👑' : ''}</b><small>{p.wins} V · {p.total_180} × 180</small></div>
          <div className="metric">Niv {p.level}</div>
        </div>
      ))}

      {me && !isOwner && (
        <button className="btn danger" style={{ marginTop: 18 }} disabled={busy} onClick={() => act(async () => { await removeMember(id, myId); nav('/leagues') })}>Quitter la ligue</button>
      )}
    </div>
  )
}
