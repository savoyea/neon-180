import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { BADGES, badgeState } from '../game/badges.js'

const TIER_LABEL = { common: 'Commun', rare: 'Rare', elite: 'Elite' }

export default function Badges() {
  const { profile } = useAuth()
  const states = BADGES.map((b) => ({ b, s: badgeState(b, profile) }))
  const earned = states.filter((x) => x.s.earned).length

  return (
    <div className="screen">
      <TopBar back title="Badges" />
      <div className="section-title"><h2>Collection</h2><span className="hint">{earned}/{BADGES.length} débloqués</span></div>

      {states.map(({ b, s }) => (
        <div key={b.id} className={'badge-row' + (s.earned ? ' on' : '')}>
          <div className={'badge ' + b.tier + (s.earned ? '' : ' locked')}><span className="b-emoji">{b.emoji}</span></div>
          <div className="meta">
            <b>{b.name} <span className={'tier-tag ' + b.tier}>{TIER_LABEL[b.tier]}</span></b>
            <small>{b.desc}</small>
            {!s.earned && (
              <div className="badge-prog"><i style={{ width: s.pct + '%' }} /><span>{s.value}/{b.goal}</span></div>
            )}
          </div>
          {s.earned && <span className="badge-check">✓</span>}
        </div>
      ))}
    </div>
  )
}
