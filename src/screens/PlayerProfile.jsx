import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { getProfileById, computeStatus, STATUS_LABEL } from '../lib/friends.js'
import { createInvite, ONLINE_MODES } from '../lib/matches.js'
import { getMode } from '../game/engine/registry.js'
import { BADGES, earnedBadges } from '../game/badges.js'
import { isPremium } from '../lib/premium.js'
import Avatar from '../components/Avatar.jsx'
import { titleOf } from '../game/cosmetics.js'

export default function PlayerProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [p, setP] = useState(null)
  const [err, setErr] = useState(null)
  const [invite, setInvite] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getProfileById(id).then((d) => d ? setP(d) : setErr('Joueur introuvable')).catch(() => setErr('Joueur introuvable'))
  }, [id])

  if (id === user?.id) return <Navigate to="/profile" replace />
  if (err) return <div className="screen"><TopBar back title="Profil" /><div className="empty"><div className="big">🚫</div><p>{err}</p></div></div>
  if (!p) return <div className="center-screen"><div><div className="spinner" />Chargement…</div></div>

  const level = p.level ?? 1
  const xpNext = level * 1000
  const pct = Math.min(100, Math.round(((p.xp ?? 0) / xpNext) * 100))
  const earned = earnedBadges(p)
  const status = computeStatus(p)

  async function sendInvite(mode) {
    setBusy(true)
    try { const m = await createInvite(user.id, p.id, mode, getMode(mode).defaultOptions); nav('/match/' + m.id) }
    catch (e) { setBusy(false) }
  }

  return (
    <div className="screen">
      <TopBar back title="Profil joueur" />

      <div className="card glow">
        <div className="profile-head">
          <Avatar profile={p} size={88} />
          <div className="profile-name" style={{ marginTop: 12 }}>{p.username}{isPremium(p) && <span className="premium-tag">⭐ 180+</span>}</div>
          <span className="level-pill">Niveau {level} · {titleOf(p)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'in_game' ? 'var(--amber)' : status === 'online' ? 'var(--neon)' : 'var(--muted-2)' }} />
            <small className="muted">{STATUS_LABEL[status]}</small>
          </div>
          <div className="xpbar"><i style={{ width: pct + '%' }} /></div>
          <small className="muted">{p.xp ?? 0} / {xpNext} XP</small>
        </div>
      </div>

      <button className="btn primary" style={{ marginTop: 14 }} disabled={busy} onClick={() => setInvite(true)}>🎯 Inviter à jouer</button>

      <div className="section-title"><h2>Statistiques</h2></div>
      <div className="stat-grid">
        <div className="stat-cell"><b>{p.games_played ?? 0}</b><small>Parties</small></div>
        <div className="stat-cell"><b>{p.wins ?? 0}</b><small>Victoires</small></div>
        <div className="stat-cell"><b>{p.games_played ? Math.round((p.wins / p.games_played) * 100) : 0}%</b><small>Winrate</small></div>
        <div className="stat-cell"><b>{p.total_180 ?? 0}</b><small>180</small></div>
        <div className="stat-cell"><b>{p.best_checkout || '—'}</b><small>Meilleur finish</small></div>
        <div className="stat-cell"><b>{p.best_streak ?? 0}</b><small>Série max</small></div>
      </div>

      <div className="section-title"><h2>Badges</h2><span className="hint">{earned.length}/{BADGES.length}</span></div>
      {earned.length === 0
        ? <div className="empty" style={{ padding: 20 }}><p>Aucun badge débloqué.</p></div>
        : <div className="badge-grid">{earned.slice(0, 8).map((b) => <div key={b.id} className={'badge ' + b.tier} title={b.desc}><span className="b-emoji">{b.emoji}</span><small>{b.name}</small></div>)}</div>}

      {invite && (
        <div className="modal-back" onClick={() => setInvite(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--text)', fontSize: 18 }}>Inviter {p.username}</h2>
            <p className="muted" style={{ fontSize: 13, margin: '6px 0 16px' }}>Choisis le mode :</p>
            <div className="chips" style={{ justifyContent: 'center', marginBottom: 16 }}>
              {ONLINE_MODES.map((k) => <button key={k} className="chip" disabled={busy} onClick={() => sendInvite(k)}>{getMode(k).ico} {getMode(k).name}</button>)}
            </div>
            <button className="btn ghost" onClick={() => setInvite(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
