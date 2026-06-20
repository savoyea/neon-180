import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { PALETTE, uid } from './engine/constants.js'
import { createGame, applyDart, endTurn as engineEndTurn, undo as engineUndo, modeAction, buildRecord } from './engine/core.js'

const GameContext = createContext(null)
const ROSTER_KEY = 'dart180_roster'
const HISTORY_KEY = 'dart180_history'

const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

export function GameProvider({ children }) {
  const { profile } = useAuth()
  const [roster, setRoster] = useState(() => load(ROSTER_KEY, []))
  const [history, setHistory] = useState(() => load(HISTORY_KEY, []))
  const [game, setGameState] = useState(null)
  const [fx, setFx] = useState({ flash: null, toast: null })
  const [winData, setWinData] = useState(null)

  const gameRef = useRef(null)
  const timers = useRef([])

  // Source de vérité synchrone pour l'orchestration (évite les setState imbriqués).
  const commit = (g) => { gameRef.current = g; setGameState(g) }

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t }
  useEffect(() => () => clearTimers(), [])

  const flash = (text) => setFx((f) => ({ ...f, flash: { text, key: Date.now() + Math.random() } }))
  const toast = (text) => setFx((f) => ({ ...f, toast: { text, key: Date.now() + Math.random() } }))

  // Amorce le roster avec le pseudo du joueur connecté
  useEffect(() => {
    if (roster.length === 0 && profile?.username) {
      const seed = [
        { id: uid(), name: profile.username, color: PALETTE[0] },
        { id: uid(), name: 'Joueur 2', color: PALETTE[1] },
      ]
      setRoster(seed); save(ROSTER_KEY, seed)
    }
  }, [profile, roster.length])

  const addPlayer = useCallback((name) => {
    const np = { id: uid(), name: name.trim(), color: PALETTE[roster.length % PALETTE.length] }
    const next = [...roster, np]
    setRoster(next); save(ROSTER_KEY, next)
    return np
  }, [roster])

  const saveRecord = useCallback((record) => {
    setHistory((h) => {
      if (h.some((r) => r.id === record.id)) return h
      const next = [record, ...h].slice(0, 200); save(HISTORY_KEY, next); return next
    })
  }, [])

  const finishGame = useCallback((g) => {
    const record = buildRecord(g)
    setHistory((h) => { const next = [record, ...h].slice(0, 200); save(HISTORY_KEY, next); return next })
    setWinData({ game: g, record })
  }, [])

  const runEndTurn = useCallback((g) => {
    const { game: g2, result: r } = engineEndTurn(g)
    commit(g2)
    if (r.flash) flash(r.flash)
    if (r.finish) later(() => finishGame(g2), 400)
  }, [finishGame])

  const startGame = useCallback((modeKey, playerIds, opts) => {
    clearTimers()
    const ps = playerIds.map((id) => roster.find((r) => r.id === id)).filter(Boolean)
    setWinData(null)
    commit(createGame(modeKey, ps, opts))
  }, [roster])

  const throwDart = useCallback((seg, mult) => {
    const cur = gameRef.current
    if (!cur || cur.finished) return
    const { game: g, result } = applyDart(cur, seg, mult)
    commit(g)
    if (result.flash) flash(result.flash)
    if (result.toast) toast(result.toast)
    if (result.finish) { later(() => finishGame(g), result.flash ? 750 : 200); return }
    if (result.legDone) return
    if (result.bust) { later(() => runEndTurn(g), 650); return }
    if (result.suddenMiss) { toast('Raté en mort subite — au suivant'); later(() => runEndTurn(g), 450); return }
    if (result.endTurn) { later(() => runEndTurn(g), result.flash ? 700 : 120); return }
    if (g.turn.darts.length >= 3) { later(() => runEndTurn(g), result.flash ? 700 : 480) }
  }, [finishGame, runEndTurn])

  const passTurn = useCallback(() => {
    const cur = gameRef.current
    if (!cur || cur.finished) return
    runEndTurn(cur)
  }, [runEndTurn])

  const undoDart = useCallback(() => {
    const cur = gameRef.current
    if (!cur) return
    const { game: g, result } = engineUndo(cur)
    commit(g)
    if (result.toast) toast(result.toast)
  }, [])

  const dispatchAction = useCallback((name, payload, onResult) => {
    const cur = gameRef.current
    if (!cur) return
    const { game: g, result } = modeAction(cur, name, payload)
    commit(g)
    if (result.flash) flash(result.flash)
    if (result.toast) toast(result.toast)
    if (result.finished) later(() => finishGame(g), 400)
    if (onResult) onResult(result)
  }, [finishGame])

  const quitGame = useCallback(() => { clearTimers(); gameRef.current = null; setGameState(null); setWinData(null) }, [])
  const dismissWin = useCallback(() => setWinData(null), [])
  const clearFlash = useCallback(() => setFx((f) => ({ ...f, flash: null })), [])
  const clearToast = useCallback(() => setFx((f) => ({ ...f, toast: null })), [])

  const value = {
    roster, history, game, fx, winData,
    addPlayer, startGame, throwDart, passTurn, undoDart, dispatchAction,
    quitGame, dismissWin, clearFlash, clearToast, saveRecord,
  }
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>')
  return ctx
}
