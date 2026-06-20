import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'

// Chat vocal P2P (WebRTC). Signaling via Supabase Realtime broadcast.
// Exactement 2 pairs : l'initiateur (id le plus petit) émet l'offre.
const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] }

export default function VoiceChat({ matchId, myId, oppName }) {
  const [status, setStatus] = useState('idle') // idle | connecting | live | error
  const [muted, setMuted] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const pcRef = useRef(null)
  const localRef = useRef(null)
  const chanRef = useRef(null)
  const otherRef = useRef(null)
  const negotiatedRef = useRef(false)
  const pendingIce = useRef([])
  const audioRef = useRef(null)
  const rafRef = useRef(null)

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (chanRef.current) { supabase.removeChannel(chanRef.current); chanRef.current = null }
    if (pcRef.current) { pcRef.current.ontrack = null; pcRef.current.onicecandidate = null; pcRef.current.close(); pcRef.current = null }
    if (localRef.current) { localRef.current.getTracks().forEach((t) => t.stop()); localRef.current = null }
    negotiatedRef.current = false
    pendingIce.current = []
    otherRef.current = null
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const broadcast = (payload) => chanRef.current?.send({ type: 'broadcast', event: 'signal', payload })

  function attachRemote(stream) {
    if (audioRef.current) { audioRef.current.srcObject = stream; audioRef.current.play().catch(() => {}) }
    // détecteur de niveau (anneau "parle")
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const src = ctx.createMediaStreamSource(stream)
      const an = ctx.createAnalyser(); an.fftSize = 256
      src.connect(an)
      const buf = new Uint8Array(an.frequencyBinCount)
      const tick = () => {
        an.getByteFrequencyData(buf)
        const avg = buf.reduce((s, v) => s + v, 0) / buf.length
        setSpeaking(avg > 18)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch (e) { /* analyser non critique */ }
  }

  async function flushIce() {
    const pc = pcRef.current
    while (pendingIce.current.length) {
      try { await pc.addIceCandidate(pendingIce.current.shift()) } catch (e) { /* ignore */ }
    }
  }

  async function initiate() {
    const pc = pcRef.current
    if (!pc || negotiatedRef.current || !otherRef.current) return
    if (myId > otherRef.current) return // seul le plus petit id émet l'offre
    negotiatedRef.current = true
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    broadcast({ kind: 'offer', from: myId, to: otherRef.current, data: offer })
  }

  async function onSignal(p) {
    const pc = pcRef.current
    if (!pc || p.to !== myId) return
    if (p.kind === 'offer') {
      negotiatedRef.current = true
      otherRef.current = p.from
      await pc.setRemoteDescription(p.data)
      await flushIce()
      const ans = await pc.createAnswer()
      await pc.setLocalDescription(ans)
      broadcast({ kind: 'answer', from: myId, to: p.from, data: ans })
    } else if (p.kind === 'answer') {
      await pc.setRemoteDescription(p.data)
      await flushIce()
    } else if (p.kind === 'ice') {
      if (pc.remoteDescription) { try { await pc.addIceCandidate(p.data) } catch (e) { /* ignore */ } }
      else pendingIce.current.push(p.data)
    }
  }

  async function join() {
    setErrMsg(''); setStatus('connecting')
    let stream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }) }
    catch (e) { setStatus('error'); setErrMsg('Micro refusé ou indisponible.'); return }
    localRef.current = stream

    const pc = new RTCPeerConnection(ICE)
    pcRef.current = pc
    stream.getTracks().forEach((t) => pc.addTrack(t, stream))
    pc.onicecandidate = (e) => { if (e.candidate && otherRef.current) broadcast({ kind: 'ice', from: myId, to: otherRef.current, data: e.candidate }) }
    pc.ontrack = (e) => attachRemote(e.streams[0])
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState
      if (s === 'connected') setStatus('live')
      else if (s === 'failed' || s === 'disconnected') { setStatus('error'); setErrMsg('Connexion vocale perdue.') }
    }

    const ch = supabase.channel('voice:' + matchId, { config: { broadcast: { self: false }, presence: { key: myId } } })
    chanRef.current = ch
    ch.on('broadcast', { event: 'signal' }, ({ payload }) => onSignal(payload))
    ch.on('presence', { event: 'sync' }, () => {
      const ids = Object.keys(ch.presenceState())
      const other = ids.find((k) => k !== myId)
      if (other) { otherRef.current = other; initiate() }
    })
    ch.subscribe(async (st) => { if (st === 'SUBSCRIBED') await ch.track({ id: myId, at: Date.now() }) })
  }

  function leave() { cleanup(); setStatus('idle'); setSpeaking(false) }
  function toggleMute() {
    const tr = localRef.current?.getAudioTracks?.()[0]
    if (tr) { tr.enabled = !tr.enabled; setMuted(!tr.enabled) }
  }

  return (
    <div className="voice-panel">
      <audio ref={audioRef} autoPlay />
      {status === 'idle' && <button className="btn sm primary" onClick={join}>🎙️ Rejoindre le vocal</button>}
      {status === 'connecting' && <span className="voice-status"><span className="spinner" style={{ width: 16, height: 16, margin: 0, display: 'inline-block', verticalAlign: 'middle' }} /> Connexion…</span>}
      {status === 'live' && (
        <div className="voice-live">
          <span className={'voice-dot' + (speaking ? ' on' : '')} />
          <span className="voice-status">Vocal · {oppName}{speaking ? ' parle…' : ''}</span>
          <button className={'icon-btn' + (muted ? ' muted' : '')} onClick={toggleMute} title={muted ? 'Activer le micro' : 'Couper le micro'}>{muted ? '🔇' : '🎙️'}</button>
          <button className="btn sm danger" onClick={leave}>Quitter</button>
        </div>
      )}
      {status === 'error' && (
        <div className="voice-live"><span className="voice-status" style={{ color: 'var(--red)' }}>{errMsg}</span><button className="btn sm" onClick={leave}>OK</button></div>
      )}
    </div>
  )
}
