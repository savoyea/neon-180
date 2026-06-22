import { useState, useRef, useEffect } from 'react'
import { DARTBOARD_ORDER } from '../game/engine/constants.js'

const FILTERS = [
  { key: 'single', label: 'Simple' },
  { key: 'double', label: 'Double' },
  { key: 'triple', label: 'Triple' },
  { key: 'all', label: 'Toutes' },
]

// Palette type "heatmap foot" : bleu (froid) → vert → jaune → rouge (chaud).
const RAMP = [
  [0.00, [28, 52, 150]], [0.20, [34, 150, 210]], [0.40, [40, 200, 110]],
  [0.60, [220, 220, 50]], [0.80, [245, 150, 45]], [1.00, [230, 45, 45]],
]
function ramp(t) {
  t = Math.max(0, Math.min(1, t))
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [t0, c0] = RAMP[i - 1], [t1, c1] = RAMP[i]
      const k = (t - t0) / (t1 - t0)
      return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * k))
    }
  }
  return RAMP[RAMP.length - 1][1]
}

// Points d'impact (position normalisée 0..1 + poids) selon le filtre.
function buildPoints(totals, filter) {
  const pts = []
  const R = 0.46
  const add = (angDeg, rNorm, w) => {
    if (w > 0) { const a = (angDeg - 90) * Math.PI / 180; pts.push({ x: 0.5 + rNorm * R * Math.cos(a), y: 0.5 + rNorm * R * Math.sin(a), w }) }
  }
  DARTBOARD_ORDER.forEach((n, i) => {
    const ang = i * 18
    if (filter === 'all' || filter === 'single') add(ang, 0.62, totals[String(n)] || 0)
    if (filter === 'all' || filter === 'triple') add(ang, 0.42, totals['T' + n] || 0)
    if (filter === 'all' || filter === 'double') add(ang, 0.92, totals['D' + n] || 0)
  })
  if (filter === 'all' || filter === 'single') add(0, 0, totals['25'] || 0)
  if (filter === 'all' || filter === 'double') add(0, 0, totals['Bull'] || 0)
  return pts
}

function drawHeat(canvas, totals, filter) {
  const S = canvas.width
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, S, S)
  const pts = buildPoints(totals, filter)
  const max = Math.max(1, ...pts.map((p) => p.w))
  const blob = S * 0.17

  ctx.save()
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.47, 0, 7); ctx.clip()
  // base froide (tout le plateau au minimum = bleu)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 0.10; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S)
  // accumulation additive des blobs
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1
  for (const p of pts) {
    const a = 0.18 + 0.82 * (p.w / max)
    const g = ctx.createRadialGradient(p.x * S, p.y * S, 0, p.x * S, p.y * S, blob)
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(p.x * S, p.y * S, blob, 0, 7); ctx.fill()
  }
  ctx.restore()

  // colorisation : alpha accumulé → couleur de la palette
  const img = ctx.getImageData(0, 0, S, S), d = img.data
  let maxA = 1
  for (let i = 3; i < d.length; i += 4) if (d[i] > maxA) maxA = d[i]
  for (let i = 0; i < d.length; i += 4) {
    const al = d[i + 3]
    if (al === 0) continue
    const [r, g, b] = ramp(al / maxA)
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 225
  }
  ctx.putImageData(img, 0, 0)
}

// Contour du plateau (secteurs + anneaux + numéros), faible, par-dessus la heatmap.
function BoardOverlay() {
  const cx = 100, cy = 100, R = 92
  const polar = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] }
  return (
    <svg viewBox="0 0 200 200" className="heat-overlay">
      {DARTBOARD_ORDER.map((n, i) => { const [x1, y1] = polar(14, i * 18 + 9), [x2, y2] = polar(R, i * 18 + 9); return <line key={n} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeOpacity=".12" /> })}
      {[R, R * 0.85, R * 0.59, R * 0.5, 14, 7].map((r, i) => <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#fff" strokeOpacity=".14" />)}
      {DARTBOARD_ORDER.map((n, i) => { const [lx, ly] = polar(R + 7, i * 18); return <text key={n} x={lx} y={ly} fontSize="8" fill="#fff" fillOpacity=".75" fontFamily="Oswald" textAnchor="middle" dominantBaseline="central">{n}</text> })}
    </svg>
  )
}

export default function HeatBoard({ totals }) {
  const [filter, setFilter] = useState('all')
  const ref = useRef(null)
  useEffect(() => { if (ref.current) drawHeat(ref.current, totals || {}, filter) }, [totals, filter])

  return (
    <div>
      <div className="tabs heat-tabs">
        {FILTERS.map((f) => <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>{f.label}</button>)}
      </div>
      <div className="heat-wrap">
        <canvas ref={ref} width={400} height={400} className="heat-canvas" />
        <BoardOverlay />
      </div>
      <div className="heat-legend">
        <span><i style={{ background: 'rgb(28,52,150)' }} />Faibles</span>
        <span><i style={{ background: 'rgb(40,200,110)' }} />Moyennes</span>
        <span><i style={{ background: 'rgb(230,45,45)' }} />Chaudes</span>
      </div>
    </div>
  )
}
