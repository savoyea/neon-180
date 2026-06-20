import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useGame } from '../game/GameContext.jsx'
import { supabase } from '../lib/supabase.js'
import { getMatch, getMessages, sendMessage, persistMatch } from '../lib/matches.js'
import { getWinnerCelebration } from '../lib/leagues.js'
import { applyDart, endTurn as engineEndTurn, buildRecord } from '../game/engine/core.js'
import { getMode } from '../game/engine/registry.js'
import TopBar from '../components/TopBar.jsx'
import PlayersStrip from '../components/game/PlayersStrip.jsx'
import CricketGrid from '../components/game/CricketGrid.jsx'
import AtwBoard from '../components/game/AtwBoard.jsx'
import DartPad from '../components/game/DartPad.jsx'
import VoiceChat from '../components/game/VoiceChat.jsx'

const fxKey = () => Date.now() + Math.random()
const EMOTES = ['😈', '🔥', '💪', '😂', '🎯', '😮', '👏', '🥶']
const EMOTE_PREFIX = '::emote::'
const EMOTE_COOLDOWN = 120 // secondes (offre gratuite)

export default function OnlineGame() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const { saveRecord } = useGame()
  const myId = user?.id

  const [match, setMatch] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatOpen, setChatOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState(null)
  const [flash, setFlash] = useState(null)
  const [unread, setUnread] = useState(0)
  const [notif, setNotif] = useState(null)
  const [celeb, setCeleb] = useState(null)
  const [emoteFly, setEmoteFly] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  const matchRef = useRef(null)
  const timers = useRef([])
  const savedRef = useRef(false)
  const lastFx = useRef(null)
  const chatOpenRef = useRef(false)

  // garde une réf à jour de l'état du chat + remet le compteur à 0 à l'ouverture
  useEffect(() => { chatOpenRef.current = chatOpen; if (chatOpen) setUnread(0) }, [chatOpen])
  // la petite notif s'efface seule
  useEffect(() => { if (!notif) return; const t = setTimeout(() => setNotif(null), 3200); return () => clearTimeout(t) }, [notif])
  // l'emote géante s'efface seule
  useEffect(() => { if (!emoteFly) return; const t = setTimeout(() => setEmoteFly(null), 1600); return () => clearTimeout(t) }, [emoteFly])
  // décompte du cooldown des emotes
  useEffect(() => { const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000); return () => clearInterval(t) }, [])

  function sendEmote(e) {
    if (cooldown > 0) return
    setCooldown(EMOTE_COOLDOWN)
    sendMessage(id, myId, EMOTE_PREFIX + e).catch(() => {})
  }

  const setMatchBoth = (updater) => setMatch((prev) => { const next = typeof updater === 'function' ? updater(prev) : updater; matchRef.current = next; return next })

  // Chargement + abonnement temps réel (état de partie + chat)
  useEffect(() => {
    let active = true
    getMatch(id).then((m) => { if (active) setMatchBoth(m) }).catch(() => setErr('Partie introuvable'))
    getMessages(id).then((m) => active && setMessages(m)).catch(() => {})
    const ch = supabase.channel('match:' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: 'id=eq.' + id },
        (p) => setMatchBoth((prev) => ({ ...prev, ...p.new })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_messages', filter: 'match_id=eq.' + id },
        (p) => {
          const body = p.new.body || ''
          if (body.startsWith(EMOTE_PREFIX)) { setEmoteFly({ e: body.slice(EMOTE_PREFIX.length), key: Date.now() }); return }
          setMessages((m) => (m.some((x) => x.id === p.new.id) ? m : [...m, p.new]))
          if (p.new.sender_id !== myId && !chatOpenRef.current) {
            setUnread((u) => u + 1)
            setNotif({ text: body, key: Date.now() })
          }
        })
      .subscribe()
    return () => { active = false; supabase.removeChannel(ch); timers.current.forEach(clearTimeout); timers.current = [] }
  }, [id])

  const g = match?.state
  const mode = g ? getMode(g.mode) : null
  const isMyTurn = match?.status === 'active' && g && g.players[g.turn.pi].id === myId

  // Flash synchronisé (depuis state.fx)
  useEffect(() => {
    if (g?.fx && g.fx.key !== lastFx.current) {
      lastFx.current = g.fx.key
      setFlash(g.fx.text)
      const t = setTimeout(() => setFlash(null), 750)
      return () => clearTimeout(t)
    }
  }, [g?.fx])

  // Fin de partie → historique + stats serveur + phrase de célébration (perdant)
  useEffect(() => {
    if (match?.status === 'finished' && g && !savedRef.current) {
      savedRef.current = true
      saveRecord(buildRecord(g))
      supabase.rpc('apply_match_result', { p_match: id }).catch(() => {})
      if (g.winner && g.winner !== myId) {
        getWinnerCelebration(g.winner).then((c) => c && setCeleb(c)).catch(() => {})
      }
    }
  }, [match?.status, g, saveRecord, id, myId])

  const runEndTurn = useCallback((state) => {
    const { game: g2, result: r } = engineEndTurn(state)
    g2.snaps = []
    if (r.flash) g2.fx = { text: r.flash, key: fxKey() }
    setMatchBoth((prev) => ({ ...prev, state: g2, turn_player_id: g2.players[g2.turn.pi].id, status: g2.finished ? 'finished' : prev.status, winner_id: g2.winner || prev.winner_id }))
    const fields = { state: g2, turn_player_id: g2.players[g2.turn.pi].id }
    if (g2.finished) { fields.status = 'finished'; fields.winner_id = g2.winner }
    persistMatch(id, fields).catch(() => {})
  }, [id])

  const throwDart = useCallback((seg, mult) => {
    const cur = matchRef.current
    if (!cur || cur.status !== 'active') return
    const g0 = cur.state
    if (g0.players[g0.turn.pi].id !== myId || g0.finished) return
    const { game: ng, result } = applyDart(g0, seg, mult)
    ng.snaps = []
    if (result.flash) ng.fx = { text: result.flash, key: fxKey() }
    setMatchBoth((prev) => ({ ...prev, state: ng, turn_player_id: ng.players[ng.turn.pi].id }))
    const fields = { state: ng, turn_player_id: ng.players[ng.turn.pi].id }
    if (result.finish) { fields.status = 'finished'; fields.winner_id = ng.winner }
    persistMatch(id, fields).catch(() => {})

    if (result.finish || result.legDone) return
    let delay = null
    if (result.bust) delay = 650
    else if (result.suddenMiss) delay = 450
    else if (result.endTurn) delay = result.flash ? 700 : 120
    else if (ng.turn.darts.length >= 3) delay = result.flash ? 700 : 480
    if (delay != null) timers.current.push(setTimeout(() => runEndTurn(ng), delay))
  }, [id, myId, runEndTurn])

  async function send() {
    const body = draft.trim(); if (!body) return
    setDraft('')
    try { await sendMessage(id, myId, body) } catch (e) { /* ignore */ }
  }

  function quit() { if (confirm('Quitter ? La partie reste reprenable depuis l’accueil.')) nav('/') }

  if (err) return <div className="screen"><TopBar back={() => nav('/')} title="Partie" /><div className="empty"><div className="big">🚫</div><p>{err}</p></div></div>
  if (!match) return <div className="center-screen"><div><div className="spinner" />Chargement de la partie…</div></div>

  if (match.status === 'declined' || match.status === 'cancelled') {
    return <div className="screen"><TopBar back={() => nav('/')} title="Partie en ligne" /><div className="empty"><div className="big">🙅</div><p>Invitation {match.status === 'declined' ? 'refusée' : 'annulée'}.</p></div></div>
  }
  if (match.status === 'invited' || !g) {
    return <div className="screen"><TopBar back={() => nav('/')} title="Partie en ligne" /><div className="empty"><div className="big">⏳</div><p>En attente que ton ami accepte l’invitation…</p></div></div>
  }

  const ranked = match.status === 'finished' ? mode.rank(g) : null
  const winner = ranked ? (g.players.find((p) => p.id === g.winner) || ranked[0]) : null
  const p = g.players[g.turn.pi]
  const total = g.turn.darts.reduce((s, d) => s + d.val, 0)
  const hint = mode.turnHint ? mode.turnHint(g, p, total) : ''
  const oppName = g.players.find((pl) => pl.id !== myId)?.name || 'Adversaire'

  return (
    <div className="screen playing">
      <TopBar back={quit} right={
        <button className="icon-btn" style={{ position: 'relative' }} onClick={() => setChatOpen((o) => !o)}>
          💬{unread > 0 && <span className="nbadge">{unread}</span>}
        </button>
      } />
      <PlayersStrip game={g} mode={mode} />
      <VoiceChat matchId={id} myId={myId} oppName={oppName} />

      <div className="game-mid">
        {mode.board === 'cricket' && <CricketGrid game={g} />}
        {mode.board === 'atw' && <AtwBoard game={g} mode={mode} />}
        <div className="turn-display">
          <div className="who">
            {isMyTurn ? <>À <b style={{ color: 'var(--neon)' }}>toi</b> de jouer</> : <>Au tour de <b style={{ color: p.color }}>{p.name}</b></>}
            {mode.key === 'atw' && g.sudden && <span className="sudden-badge">MORT SUBITE ☠</span>}
          </div>
          <div className="darts">
            {[0, 1, 2].map((i) => { const d = g.turn.darts[i]; return <div key={i} className={'dart-slot' + (d ? ' filled' : '')}>{d ? d.label : '·'}</div> })}
          </div>
          <div className="turn-total">VOLÉE : {total}</div>
          <div className="checkout-hint">{hint}</div>
        </div>
      </div>

      <div className="pad-dock">
        {isMyTurn
          ? <DartPad config={mode.pad(g)} onHit={throwDart} />
          : <div className="waiting-turn">⏳ En attente de <b>{oppName}</b>…</div>}
      </div>

      {chatOpen && (
        <div className="chat-sheet">
          <div className="chat-head"><b>Discussion</b><button className="icon-btn" onClick={() => setChatOpen(false)}>✕</button></div>
          <div className="emote-bar">
            {EMOTES.map((e) => <button key={e} className="emote-btn" disabled={cooldown > 0} onClick={() => sendEmote(e)}>{e}</button>)}
          </div>
          {cooldown > 0 && <div className="emote-cooldown">⏱ Emote dispo dans {cooldown}s · illimité avec Dart-180+</div>}
          <div className="chat-quick">
            {['Bien joué ! 🎯', 'Quel tir ! 🔥', 'Presque… 😂', 'À moi 💪', 'GG 🤝'].map((q) => (
              <button key={q} className="chip sm" onClick={() => sendMessage(id, myId, q).catch(() => {})}>{q}</button>
            ))}
          </div>
          <div className="chat-msgs">
            {messages.map((m) => (
              <div key={m.id} className={'chat-msg' + (m.sender_id === myId ? ' mine' : '')}>{m.body}</div>
            ))}
            {messages.length === 0 && <div className="muted" style={{ textAlign: 'center', fontSize: 13, padding: 12 }}>Envoie un message à ton adversaire 👋</div>}
          </div>
          <div className="chat-input">
            <input className="input" placeholder="Message…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
            <button className="btn sm primary" style={{ flex: 'none' }} onClick={send}>›</button>
          </div>
        </div>
      )}

      {notif && !chatOpen && (
        <button className="chat-notif" onClick={() => setChatOpen(true)}>
          <span className="cn-ic">💬</span>
          <span className="cn-body">{notif.text}</span>
        </button>
      )}

      {emoteFly && <div className="emote-fly"><div className="e" key={emoteFly.key}>{emoteFly.e}</div></div>}

      {flash && <div className="flash show"><div className={'txt' + (flash === 'BUST' ? ' bust' : '')}>{flash}</div></div>}

      {match.status === 'finished' && winner && (
        <div className="modal-back">
          <div className="modal">
            <div className="trophy">🏆</div>
            <h2>Vainqueur</h2>
            <div className="winner" style={{ color: winner.color }}>{winner.name}</div>
            {celeb && (
              <div className="celebration">
                <div className="cel-emoji">{celeb.emoji}</div>
                <div className="cel-text">{celeb.celebration}</div>
                <div className="cel-league">— {celeb.name}</div>
              </div>
            )}
            <div className="standings">
              {ranked.map((pl, i) => (
                <div className="row" key={pl.id}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>{i + 1}</div>
                  <div className="meta"><b style={{ color: pl.color }}>{pl.name}</b><small>{mode.resultSub(g, pl)}</small></div>
                </div>
              ))}
            </div>
            <div className="modal-actions"><button className="btn primary" onClick={() => nav('/')}>Accueil</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
