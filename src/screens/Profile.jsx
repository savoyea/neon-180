import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import TopBar from '../components/TopBar.jsx'
import { BADGES, earnedBadges } from '../game/badges.js'

export default function Profile() {
  const nav = useNavigate()
  const { profile, signOut } = useAuth()
  const name = profile?.username || 'Joueur'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpNext = level * 1000
  const pct = Math.min(100, Math.round((xp / xpNext) * 100))
  const earned = earnedBadges(profile)

  async function logout() {
    await signOut()
    nav('/welcome', { replace: true })
  }

  return (
    <div className="screen">
      <TopBar title="Profil" />

      <div className="card glow">
        <div className="profile-head">
          <div className="profile-avatar">{name.slice(0, 2).toUpperCase()}</div>
          <div className="profile-name">{name}</div>
          <span className="level-pill">Niveau {level} · Le Tireur</span>
          <div className="xpbar"><i style={{ width: pct + '%' }} /></div>
          <small className="muted">{xp} / {xpNext} XP</small>
        </div>
      </div>

      <div className="section-title"><h2>Statistiques</h2><span className="hint">Parties en ligne</span></div>
      <div className="stat-grid">
        <div className="stat-cell"><b>{profile?.games_played ?? 0}</b><small>Parties</small></div>
        <div className="stat-cell"><b>{profile?.wins ?? 0}</b><small>Victoires</small></div>
        <div className="stat-cell"><b>{profile?.games_played ? Math.round((profile.wins / profile.games_played) * 100) : 0}%</b><small>Winrate</small></div>
        <div className="stat-cell"><b>{profile?.total_180 ?? 0}</b><small>180</small></div>
        <div className="stat-cell"><b>{profile?.best_checkout || '—'}</b><small>Meilleur finish</small></div>
        <div className="stat-cell"><b>{level}</b><small>Niveau</small></div>
      </div>

      <div className="section-title"><h2>Badges</h2><span className="hint">{earned.length}/{BADGES.length}</span></div>
      {earned.length === 0
        ? <div className="empty" style={{ padding: 20 }}><div className="big">🏅</div><p>Joue en ligne pour débloquer tes premiers badges.</p></div>
        : <div className="badge-grid">
            {earned.slice(0, 8).map((b) => (
              <div key={b.id} className={'badge ' + b.tier} title={b.desc}><span className="b-emoji">{b.emoji}</span><small>{b.name}</small></div>
            ))}
          </div>}
      <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => nav('/badges')}>Voir tous les badges ›</button>

      <button className="btn danger" style={{ marginTop: 22 }} onClick={logout}>Déconnexion</button>
    </div>
  )
}
