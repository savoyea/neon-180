import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useGame } from '../game/GameContext.jsx'
import { listModes, getMode } from '../game/engine/registry.js'
import TopBar from '../components/TopBar.jsx'

export default function Play() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { roster, addPlayer, startGame } = useGame()
  const modes = listModes()

  const [modeKey, setModeKey] = useState(params.get('mode') && getMode(params.get('mode')) ? params.get('mode') : 'x01')
  const mode = getMode(modeKey)
  const [opts, setOpts] = useState(() => ({ ...mode.defaultOptions }))
  const [pids, setPids] = useState(() => roster.slice(0, 2).map((r) => r.id))
  const [quick, setQuick] = useState('')
  const [err, setErr] = useState('')

  function pickMode(k) {
    setModeKey(k)
    setOpts({ ...getMode(k).defaultOptions })
    setErr('')
  }
  function togglePlayer(id) {
    setPids((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }
  function addQuick() {
    const v = quick.trim(); if (!v) return
    const np = addPlayer(v); setPids((cur) => [...cur, np.id]); setQuick('')
  }
  function launch() {
    if (pids.length < mode.minPlayers) { setErr(`Ce mode demande ${mode.minPlayers} joueur${mode.minPlayers > 1 ? 's' : ''} minimum.`); return }
    startGame(modeKey, pids, opts)
    nav('/game')
  }

  return (
    <div className="screen">
      <TopBar back title="Nouvelle partie" />

      <div className="section-title"><h2>Mode de jeu</h2></div>
      <div className="chips">
        {modes.map((m) => (
          <button key={m.key} className={'chip' + (m.key === modeKey ? ' on' : '')} onClick={() => pickMode(m.key)}>
            {m.ico} {m.name}
          </button>
        ))}
      </div>

      <div className="section-title"><h2>Joueurs</h2><span className="hint">{pids.length} sélectionné{pids.length > 1 ? 's' : ''}</span></div>
      <div className="chips">
        {roster.map((p) => (
          <button key={p.id} className={'chip' + (pids.includes(p.id) ? ' on' : '')}
            style={pids.includes(p.id) ? undefined : { borderColor: p.color }} onClick={() => togglePlayer(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
        <input className="input" placeholder="Ajouter un joueur rapide…" value={quick}
          onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addQuick()} />
        <button className="btn sm" style={{ flex: 'none' }} onClick={addQuick}>+ Ajout</button>
      </div>

      <OptionsForm mode={mode} opts={opts} setOpts={setOpts} />

      {mode.info && <p className="muted" style={{ fontSize: 13, lineHeight: 1.45, margin: '14px 2px 0' }}>{mode.info}</p>}

      <div className="form-error" style={{ marginTop: 14 }}>{err}</div>
      <button className="btn primary" onClick={launch}>Lancer la partie ›</button>
    </div>
  )
}

function OptionsForm({ mode, opts, setOpts }) {
  if (!mode.optionFields?.length) return null
  const set = (k, v) => setOpts((o) => ({ ...o, [k]: v }))
  return (
    <>
      <div className="section-title"><h2>Réglages {mode.name}</h2></div>
      {mode.optionFields.map((f) => {
        if (f.type === 'choice') {
          const sel = opts[f.key]
          const hint = f.options.find((o) => o.value === sel)?.hint
          return (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <div className="eyebrow" style={{ margin: '0 2px 8px' }}>{f.label}</div>
              <div className="chips">
                {f.options.map((o) => (
                  <button key={String(o.value)} className={'chip' + (o.value === sel ? ' on' : '')} onClick={() => set(f.key, o.value)}>{o.label}</button>
                ))}
              </div>
              {hint && <p className="muted" style={{ fontSize: 12.5, margin: '8px 2px 0', lineHeight: 1.4 }}>{hint}</p>}
            </div>
          )
        }
        if (f.type === 'toggle') {
          return (
            <div key={f.key} className="toggle-row" onClick={() => set(f.key, !opts[f.key])}>
              <div className="lbl"><b>{f.label}</b><small>{f.hint}</small></div>
              <div className={'switch' + (opts[f.key] ? ' on' : '')}><div className="knob" /></div>
            </div>
          )
        }
        return null
      })}
    </>
  )
}
