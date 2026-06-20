import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Sparkline from '../components/Sparkline.jsx'
import { useGame } from '../game/GameContext.jsx'
import { useAuth } from '../lib/auth.jsx'

const TABS = [
  { key: 'general', label: 'Général', modes: null },
  { key: 'x01', label: '501', modes: ['x01'] },
  { key: 'cricket', label: 'Cricket', modes: ['cricket'] },
  { key: 'defis', label: 'Défis', modes: ['atw', 'killer', 'countup', 'bar'] },
]

function compute(history, me, modes) {
  const games = history
    .filter((h) => !modes || modes.includes(h.mode))
    .map((h) => ({ h, mine: h.players.find((p) => (p.name || '').toLowerCase() === me) }))
    .filter((x) => x.mine)
    .sort((a, b) => a.h.date - b.h.date)
  let wins = 0, s180 = 0, best = 0
  const avgSeries = []
  for (const { h, mine } of games) {
    if (h.winner === mine.id) wins++
    s180 += mine.s180 || 0
    if ((mine.bestCheckout || 0) > best) best = mine.bestCheckout
    if (mine.avg) avgSeries.push(mine.avg)
  }
  const played = games.length
  const avg = avgSeries.length ? +(avgSeries.reduce((s, v) => s + v, 0) / avgSeries.length).toFixed(1) : 0
  return { played, wins, winrate: played ? Math.round((wins / played) * 100) : 0, s180, best, avg, avgSeries }
}

export default function Stats() {
  const { history } = useGame()
  const { profile } = useAuth()
  const nav = useNavigate()
  const me = (profile?.username || '').toLowerCase()
  const [tab, setTab] = useState('general')
  const modes = TABS.find((t) => t.key === tab).modes
  const s = compute(history, me, modes)

  return (
    <div className="screen">
      <TopBar title="Statistiques" />
      <div className="tabs">
        {TABS.map((t) => <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {s.played === 0 ? (
        <div className="empty"><div className="big">📊</div><p>Aucune partie {tab !== 'general' ? 'dans ce mode ' : ''}pour l’instant.</p></div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-cell"><b>{s.played}</b><small>Parties</small></div>
            <div className="stat-cell"><b>{s.wins}</b><small>Victoires</small></div>
            <div className="stat-cell"><b>{s.winrate}%</b><small>Winrate</small></div>
            {(tab === 'general' || tab === 'x01') && <>
              <div className="stat-cell"><b>{s.avg || '—'}</b><small>Moyenne</small></div>
              <div className="stat-cell"><b>{s.s180}</b><small>180</small></div>
              <div className="stat-cell"><b>{s.best || '—'}</b><small>Meilleur finish</small></div>
            </>}
            {tab === 'cricket' && <div className="stat-cell"><b>{s.played - s.wins}</b><small>Défaites</small></div>}
            {tab === 'defis' && <>
              <div className="stat-cell"><b>{s.s180}</b><small>180</small></div>
              <div className="stat-cell"><b>{s.played - s.wins}</b><small>Défaites</small></div>
            </>}
          </div>

          {s.avgSeries.length >= 2 && (
            <>
              <div className="section-title"><h2>Évolution moyenne</h2><span className="hint">{s.avgSeries.length} parties</span></div>
              <div className="card"><Sparkline values={s.avgSeries} /></div>
            </>
          )}
        </>
      )}

      <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => nav('/advanced-stats')}>
        🔥 Carte thermique &amp; précision ›
      </button>
    </div>
  )
}
