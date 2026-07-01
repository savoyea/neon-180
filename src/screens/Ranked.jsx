import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { pb } from '../lib/pocketbase.js'
import { getRankedLeaderboard, findRankedMatch, leaveQueue, rankTier, tierProgress } from '../lib/ranked.js'
import { getMatch, acceptInvite } from '../lib/matches.js'

export default function Ranked() {
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const myId = user?.id
  const [board, setBoard] = useState([])
  const [searching, setSearching] = useState(false)
  const searchingRef = useRef(false)

  useEffect(() => { getRankedLeaderboard().then(setBoard).catch(() => {}) }, [])
  useEffect(() => () => {
    if (searchingRef.current) leaveQueue()
    pb.collection('matches').unsubscribe()
  }, [])

  const elo = profile?.elo ?? 1000
  const tier = rankTier(elo)
  const myPos = board.findIndex((p) => p.id === myId)

  async function quickMatch() {
    setSearching(true)
    searchingRef.current = true
    try {
      const matchId = await findRankedMatch()
      if (matchId) { // apparié : je suis l'invité, j'initialise l'état
        const m = await getMatch(matchId)
        await acceptInvite(m)
        nav('/match/' + matchId)
      } else { // en attente : je serai l'hôte quand on m'appariera
        pb.collection('matches').subscribe('*', (e) => {
          if (e.action === 'create' && e.record.host_id === myId && e.record.ranked) {
            pb.collection('matches').unsubscribe()
            nav('/match/' + e.record.id)
          }
        }).catch(() => {})
      }
    } catch { setSearching(false); searchingRef.current = false }
  }
  function cancel() {
    leaveQueue()
    pb.collection('matches').unsubscribe()
    setSearching(false)
    searchingRef.current = false
  }

  if (!pb.authStore.isValid) {
    return <div className="screen"><TopBar back title="Mode classé" /><div className="empty"><div className="big">🏆</div><p>Connecte-toi pour jouer en classé.</p></div></div>
  }

  return (
    <div className="screen">
      <TopBar back title="Mode classé" />

      <div className="card glow rank-hero">
        <div className="rank-emoji" style={{ color: tier.color }}>{tier.emoji}</div>
        <div className="rank-name" style={{ color: tier.color }}>{tier.name}</div>
        <div className="rank-elo">{elo} <span>ELO</span></div>
        <div className="xpbar" style={{ marginTop: 12 }}><i style={{ width: tierProgress(elo) + '%', background: tier.color }} /></div>
        <small className="muted">{myPos >= 0 ? `${myPos + 1}ᵉ au classement` : 'Joue une partie classée pour entrer au classement'}</small>
      </div>

      {searching ? (
        <div className="card" style={{ textAlign: 'center', marginTop: 14 }}>
          <div className="spinner" />
          <p style={{ fontWeight: 600 }}>Recherche d’un adversaire…</p>
          <button className="btn ghost sm" style={{ marginTop: 10, width: 'auto' }} onClick={cancel}>Annuler</button>
        </div>
      ) : (
        <>
          <button className="btn primary" style={{ marginTop: 14 }} onClick={quickMatch}>🔍 Recherche rapide (501 classé)</button>
          <button className="btn ghost" style={{ marginTop: 9 }} onClick={() => nav('/friends')}>🎯 Défier un ami en classé</button>
        </>
      )}

      <div className="section-title"><h2>Classement classé</h2><span className="hint">ELO</span></div>
      {board.length === 0
        ? <div className="empty" style={{ padding: 20 }}><p>Aucun joueur classé pour l’instant.</p></div>
        : board.map((p, i) => {
          const t = rankTier(p.elo)
          return (
            <div key={p.id} className={'rank-row' + (p.id === myId ? ' me' : '')} style={{ cursor: 'pointer' }} onClick={() => p.id !== myId && nav('/player/' + p.id)}>
              <div className={'pos' + (i < 3 ? ' top' : '')}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</div>
              <div className="meta"><b>{p.username} <span style={{ color: t.color }}>{t.emoji}</span></b><small>{t.name} · {p.games_played} parties</small></div>
              <div className="metric">{p.elo}</div>
            </div>
          )
        })}
    </div>
  )
}
