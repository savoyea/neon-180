import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { pb } from '../lib/pocketbase.js'
import { getMyLeagues, discoverLeagues, createLeague, joinLeague } from '../lib/leagues.js'

function LeagueCard({ league, onClick, right }) {
  return (
    <button className="league-card" onClick={onClick}>
      <div className="lemoji">{league.emoji || '🎯'}</div>
      <div className="meta"><b>{league.name}</b><small>{league.description || 'Ligue de fléchettes'}</small></div>
      {right}
    </button>
  )
}

export default function Leagues() {
  const { user } = useAuth()
  const nav = useNavigate()
  const myId = user?.id
  const [mine, setMine] = useState([])
  const [discover, setDiscover] = useState([])
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', emoji: '🎯', description: '', celebration: '' })

  const refresh = useCallback(() => {
    if (!myId) return
    getMyLeagues(myId).then(setMine).catch(() => {})
    discoverLeagues(myId).then(setDiscover).catch(() => {})
  }, [myId])
  useEffect(() => { refresh() }, [refresh])

  async function submitCreate() {
    if (form.name.trim().length < 3) return
    setBusy(true)
    try { const id = await createLeague(form); setCreating(false); nav('/leagues/' + id) }
    catch (e) { setBusy(false) }
  }
  async function join(l) {
    setBusy(true)
    try { await joinLeague(l.id, myId, l.is_open); nav('/leagues/' + l.id) }
    finally { setBusy(false); refresh() }
  }

  if (!pb.authStore.isValid) {
    return <div className="screen"><TopBar title="Ligues" /><div className="empty"><div className="big">🛡️</div><p>Connecte-toi pour rejoindre des ligues.</p></div></div>
  }

  return (
    <div className="screen">
      <TopBar title="Ligues" right={<button className="icon-btn" onClick={() => setCreating(true)}>＋</button>} />

      <div className="section-title"><h2>Mes ligues</h2></div>
      {mine.length === 0
        ? <div className="empty" style={{ padding: 20 }}><p>Tu n’as pas encore de ligue.</p></div>
        : mine.map((l) => <LeagueCard key={l.id} league={l} onClick={() => nav('/leagues/' + l.id)}
            right={<span className="val" style={{ fontSize: 13, color: 'var(--neon)' }}>›</span>} />)}

      <div className="section-title"><h2>Découvrir</h2></div>
      {discover.length === 0
        ? <div className="empty" style={{ padding: 20 }}><p>Aucune autre ligue pour l’instant. Crée la tienne !</p></div>
        : discover.map((l) => <LeagueCard key={l.id} league={l} onClick={() => nav('/leagues/' + l.id)}
            right={<span className="btn sm" style={{ pointerEvents: 'none' }}>{l.is_open ? 'Rejoindre' : 'Demander'}</span>} />)}

      <button className="btn primary" style={{ marginTop: 18 }} onClick={() => setCreating(true)}>＋ Créer une ligue</button>

      {creating && (
        <div className="modal-back" onClick={() => setCreating(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <h2 style={{ color: 'var(--text)', fontSize: 18, textAlign: 'center', marginBottom: 14 }}>Nouvelle ligue</h2>
            <div className="field"><label>Emoji & nom</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" style={{ width: 64, textAlign: 'center' }} value={form.emoji} maxLength={2} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
                <input className="input" placeholder="Les Fléchettes d’Or" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <div className="field"><label>Description</label>
              <input className="input" placeholder="Unis par la passion du triple 20" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="field"><label>Phrase de célébration</label>
              <input className="input" placeholder="Bienvenue chez les machines du T20 🎯" value={form.celebration} onChange={(e) => setForm((f) => ({ ...f, celebration: e.target.value }))} />
              <small className="muted" style={{ fontSize: 12 }}>S’affiche chez l’adversaire qu’un membre vient de battre.</small>
            </div>
            <div className="modal-actions" style={{ marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setCreating(false)}>Annuler</button>
              <button className="btn primary" disabled={busy || form.name.trim().length < 3} onClick={submitCreate}>Créer ›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
