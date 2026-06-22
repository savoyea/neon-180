import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import TopBar from '../components/TopBar.jsx'
import { BADGES, earnedBadges } from '../game/badges.js'
import { isPremium } from '../lib/premium.js'
import ShareModal from '../components/ShareModal.jsx'
import Avatar from '../components/Avatar.jsx'
import { IosInstructions } from '../components/InstallPrompt.jsx'
import { isStandalone, canPrompt, isIOS, promptInstall } from '../lib/pwa.js'
import { titleOf } from '../game/cosmetics.js'

export default function Profile() {
  const nav = useNavigate()
  const { profile, signOut, updateProfile } = useAuth()
  const name = profile?.username || 'Joueur'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpNext = level * 1000
  const pct = Math.min(100, Math.round((xp / xpNext) * 100))
  const earned = earnedBadges(profile)
  const premium = isPremium(profile)
  const visible = profile?.visible !== false
  const [share, setShare] = useState(false)
  const [ios, setIos] = useState(false)

  async function logout() {
    await signOut()
    nav('/welcome', { replace: true })
  }
  async function install() {
    if (canPrompt()) await promptInstall()
    else setIos(true)
  }

  return (
    <div className="screen">
      <TopBar title="Profil" />

      <div className="card glow">
        <div className="profile-head">
          <Avatar profile={profile} size={88} />
          <div className="profile-name" style={{ marginTop: 12 }}>{name}{premium && <span className="premium-tag">⭐ 180+</span>}</div>
          <span className="level-pill">Niveau {level} · {titleOf(profile)}</span>
          <div className="xpbar"><i style={{ width: pct + '%' }} /></div>
          <small className="muted">{xp} / {xpNext} XP</small>
        </div>
      </div>

      {!premium && (
        <button className="btn primary" style={{ marginTop: 14 }} onClick={() => nav('/premium')}>⭐ Passer à Dart-180+</button>
      )}

      <div className="section-title"><h2>Statistiques</h2><span className="hint">Parties en ligne</span></div>
      <div className="stat-grid">
        <div className="stat-cell"><b>{profile?.games_played ?? 0}</b><small>Parties</small></div>
        <div className="stat-cell"><b>{profile?.wins ?? 0}</b><small>Victoires</small></div>
        <div className="stat-cell"><b>{profile?.games_played ? Math.round((profile.wins / profile.games_played) * 100) : 0}%</b><small>Winrate</small></div>
        <div className="stat-cell"><b>{profile?.total_180 ?? 0}</b><small>180</small></div>
        <div className="stat-cell"><b>{profile?.best_checkout || '—'}</b><small>Meilleur finish</small></div>
        <div className="stat-cell"><b>{level}</b><small>Niveau</small></div>
      </div>
      <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => nav('/advanced-stats')}>
        📊 Stats avancées {premium ? '' : '⭐'} ›
      </button>

      <div className="section-title"><h2>Badges</h2><span className="hint">{earned.length}/{BADGES.length}</span></div>
      {earned.length === 0
        ? <div className="empty" style={{ padding: 20 }}><div className="big">🏅</div><p>Joue en ligne pour débloquer tes premiers badges.</p></div>
        : <div className="badge-grid">
            {earned.slice(0, 8).map((b) => (
              <div key={b.id} className={'badge ' + b.tier} title={b.desc}><span className="b-emoji">{b.emoji}</span><small>{b.name}</small></div>
            ))}
          </div>}
      <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => nav('/badges')}>Voir tous les badges ›</button>

      <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => nav('/customize')}>🎨 Personnalisation</button>

      <div className="section-title"><h2>Réglages</h2></div>
      <div className="toggle-row" onClick={() => updateProfile({ visible: !visible })}>
        <div className="lbl"><b>Visible en ligne</b><small>{visible ? 'Tes amis te voient connecté' : 'Tu apparais hors ligne pour tes amis'}</small></div>
        <div className={'switch' + (visible ? ' on' : '')}><div className="knob" /></div>
      </div>
      <button className="btn ghost" style={{ marginTop: 4 }} onClick={() => setShare(true)}>🔗 Partager l’app</button>
      {!isStandalone() && (
        <button className="btn ghost" style={{ marginTop: 9 }} onClick={install}>📲 Installer l’app</button>
      )}

      <button className="btn danger" style={{ marginTop: 22 }} onClick={logout}>Déconnexion</button>

      {share && <ShareModal onClose={() => setShare(false)} />}
      {ios && <IosInstructions onClose={() => setIos(false)} />}
    </div>
  )
}
