import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { pb } from '../lib/pocketbase.js'
import { globalRanking } from '../lib/rankings.js'
import { rankingByMode } from '../lib/ranked.js'

const TABS = [
  { key: 'level', label: 'Niveau', kind: 'global', fmt: (p) => 'Niv ' + p.level },
  { key: 'wins', label: 'Victoires', kind: 'global', fmt: (p) => p.wins + ' V' },
  { key: 's180', label: '180', kind: 'global', fmt: (p) => p.total_180 + ' × 180' },
  { key: 'x01', label: '501', kind: 'mode', mode: 'x01', fmt: (p) => p.mode_wins_count + ' V' },
  { key: 'cricket', label: 'Cricket', kind: 'mode', mode: 'cricket', fmt: (p) => p.mode_wins_count + ' V' },
  { key: 'defis', label: 'Défis', kind: 'mode', mode: 'defis', fmt: (p) => p.mode_wins_count + ' V' },
]

export default function Rankings() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('level')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const t = TABS.find((x) => x.key === tab)

  useEffect(() => {
    setLoading(true)
    const p = t.kind === 'mode' ? rankingByMode(t.mode) : globalRanking(tab)
    p.then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="screen">
      <TopBar title="Classement mondial" />
      <div className="tabs scroll">
        {TABS.map((x) => <button key={x.key} className={tab === x.key ? 'on' : ''} onClick={() => setTab(x.key)}>{x.label}</button>)}
      </div>

      {!pb.authStore.isValid ? (
        <div className="empty"><div className="big">🏆</div><p>Connecte-toi pour voir le classement.</p></div>
      ) : loading ? (
        <div className="empty"><div className="spinner" /></div>
      ) : rows.length === 0 ? (
        <div className="empty"><div className="big">🏆</div><p>Pas encore de joueurs classés. Joue des parties en ligne !</p></div>
      ) : (
        rows.map((p, i) => (
          <div key={p.id} className={'rank-row' + (p.id === user?.id ? ' me' : '')} style={{ cursor: 'pointer' }}
            onClick={() => p.id !== user?.id && nav('/player/' + p.id)}>
            <div className={'pos' + (i < 3 ? ' top' : '')}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</div>
            <div className="meta"><b>{p.username}</b><small>Niv {p.level} · {p.games_played} parties</small></div>
            <div className="metric">{t.fmt(p)}</div>
          </div>
        ))
      )}
    </div>
  )
}
