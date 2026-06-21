import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { isConfigured } from '../lib/supabase.js'
import { globalRanking, RANK_METRICS } from '../lib/rankings.js'

export default function Rankings() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [metric, setMetric] = useState('level')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const m = RANK_METRICS.find((x) => x.key === metric)

  useEffect(() => {
    setLoading(true)
    globalRanking(metric).then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }, [metric])

  return (
    <div className="screen">
      <TopBar title="Classement mondial" />
      <div className="tabs">
        {RANK_METRICS.map((x) => (
          <button key={x.key} className={metric === x.key ? 'on' : ''} onClick={() => setMetric(x.key)}>{x.label}</button>
        ))}
      </div>

      {!isConfigured ? (
        <div className="empty"><div className="big">🏆</div><p>Connecte-toi pour voir le classement mondial.</p></div>
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
            <div className="metric">{m.fmt(p)}</div>
          </div>
        ))
      )}
    </div>
  )
}
