import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { isPremium } from '../lib/premium.js'
import { SEASON, seasonTier, tierProgressPct } from '../game/missions.js'

export default function BattlePass() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const premium = isPremium(profile)
  const sxp = profile?.season_xp || 0
  const tier = seasonTier(sxp)

  return (
    <div className="screen">
      <TopBar back title="Battle Pass" />

      <div className="card glow" style={{ textAlign: 'center' }}>
        <div className="eyebrow">{SEASON.endLabel}</div>
        <h2 style={{ fontSize: 20, color: '#fff', marginTop: 4 }}>{SEASON.name}</h2>
        <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: 30, marginTop: 6 }}>Palier {tier}</div>
        <div className="xpbar" style={{ marginTop: 10 }}><i style={{ width: tierProgressPct(sxp) + '%' }} /></div>
        <small className="muted">{sxp % SEASON.tierSize} / {SEASON.tierSize} XP saison · prochain palier</small>
      </div>

      {!premium && (
        <button className="btn primary" style={{ marginTop: 14 }} onClick={() => nav('/premium')}>⭐ Débloquer le Pass Premium</button>
      )}

      <div className="bp-head"><span>Palier</span><span>Gratuit</span><span className="bp-prem">Premium {premium ? '⭐' : '🔒'}</span></div>
      <div className="bp-track">
        {SEASON.tiers.map((t, i) => {
          const reached = i + 1 <= tier
          return (
            <div className={'bp-row' + (reached ? ' on' : '')} key={i}>
              <div className="bp-tier">{i + 1}</div>
              <div className={'bp-reward' + (reached ? ' unlocked' : '')}>
                <span className="bp-e">{t.free.e}</span><small>{t.free.l}</small>
              </div>
              <div className={'bp-reward prem' + (reached && premium ? ' unlocked' : '') + (!premium ? ' locked' : '')}>
                <span className="bp-e">{t.premium.e}</span><small>{t.premium.l}</small>
              </div>
            </div>
          )
        })}
      </div>

      <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', margin: '14px 6px' }}>
        Gagne de l’XP de saison en complétant des <a onClick={() => nav('/missions')} style={{ cursor: 'pointer' }}>missions</a> pour grimper les paliers.
      </p>
    </div>
  )
}
