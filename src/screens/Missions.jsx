import { useState, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { useGame } from '../game/GameContext.jsx'
import { DAILY, WEEKLY, periodTotals, getClaimed, markClaimed, seasonTier, SEASON } from '../game/missions.js'

export default function Missions() {
  const { profile, updateProfile } = useAuth()
  const { history } = useGame()
  const nav = useNavigate()
  const [tab, setTab] = useState('daily')
  const [, force] = useReducer((x) => x + 1, 0)

  const list = tab === 'daily' ? DAILY : WEEKLY
  const totals = periodTotals(history, profile?.username, tab)
  const claimed = getClaimed(tab)

  function claim(m) {
    const newXp = (profile?.xp || 0) + m.xp
    const newSeason = (profile?.season_xp || 0) + m.xp
    updateProfile({ xp: newXp, season_xp: newSeason, level: Math.max(1, Math.floor(newXp / 1000) + 1) })
    markClaimed(tab, m.id)
    force()
  }

  return (
    <div className="screen">
      <TopBar back title="Missions" />

      <button className="ranked-cta" onClick={() => nav('/battlepass')}>
        <span className="rc-ic">🎟️</span>
        <span className="rc-text"><b>{SEASON.name}</b><small>Battle Pass · Palier {seasonTier(profile?.season_xp)}</small></span>
        <span className="rc-arrow">›</span>
      </button>

      <div className="tabs" style={{ marginTop: 16 }}>
        <button className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>Quotidiennes</button>
        <button className={tab === 'weekly' ? 'on' : ''} onClick={() => setTab('weekly')}>Hebdo</button>
      </div>

      {list.map((m) => {
        const prog = Math.min(m.goal, totals[m.metric] || 0)
        const done = prog >= m.goal
        const isClaimed = claimed.includes(m.id)
        return (
          <div className="mission" key={m.id}>
            <div className="m-main">
              <b>{m.name}</b>
              <div className="m-bar"><i style={{ width: Math.round((prog / m.goal) * 100) + '%' }} /><span>{prog}/{m.goal}</span></div>
            </div>
            {isClaimed
              ? <span className="m-done">✓</span>
              : done
                ? <button className="btn sm primary" onClick={() => claim(m)}>+{m.xp} XP</button>
                : <span className="m-xp">+{m.xp} XP</span>}
          </div>
        )
      })}

      <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 14 }}>
        Les missions se basent sur tes parties {tab === 'daily' ? 'du jour' : 'de la semaine'} et se réinitialisent automatiquement.
      </p>
    </div>
  )
}
