import { useState } from 'react'
import { DARTBOARD_ORDER } from '../game/engine/constants.js'

// Géométrie réaliste de la cible (identique au Défi de bar).
const cx = 100, cy = 100
const rDoubO = 86, rDoubI = 78, rTripO = 54, rTripI = 46, rBullO = 13, rBullI = 6.5
const polar = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] }
function sector(r1, r2, a1, a2) {
  const [x1, y1] = polar(r2, a1), [x2, y2] = polar(r2, a2)
  const [x3, y3] = polar(r1, a2), [x4, y4] = polar(r1, a1)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r2} ${r2} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${x3.toFixed(2)} ${y3.toFixed(2)} A${r1} ${r1} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`
}

// Chaque secteur = une zone (single / triple / double), précalculé une fois.
const SEGS = []
DARTBOARD_ORDER.forEach((num, idx) => {
  const a1 = idx * 18 - 9, a2 = idx * 18 + 9
  SEGS.push({ num, zone: 'single', d: sector(rTripO, rDoubI, a1, a2) })
  SEGS.push({ num, zone: 'triple', d: sector(rTripI, rTripO, a1, a2) })
  SEGS.push({ num, zone: 'single', d: sector(rBullO, rTripI, a1, a2) })
  SEGS.push({ num, zone: 'double', d: sector(rDoubI, rDoubO, a1, a2) })
})
const LABELS = DARTBOARD_ORDER.map((num, idx) => { const [lx, ly] = polar(rDoubO + 8, idx * 18); return { num, lx, ly } })

const FILTERS = [
  { key: 'single', label: 'Simple' },
  { key: 'double', label: 'Double' },
  { key: 'triple', label: 'Triple' },
  { key: 'all', label: 'Toutes' },
]

// échelle "performance" : rouge (faible) → ambre (moyen) → vert (excellent)
function heatColor(c, max, active) {
  if (!active) return 'rgba(90,110,100,.05)'
  if (c === 0) return 'rgba(120,140,130,.10)'
  const t = Math.min(1, c / max)
  let r, g, b
  if (t < 0.5) { const u = t / 0.5; r = 255; g = Math.round(70 + u * 140); b = 60 }
  else { const u = (t - 0.5) / 0.5; r = Math.round(255 - u * 198); g = Math.round(210 + u * 45); b = Math.round(60 + u * 46) }
  return `rgba(${r},${g},${b},${(0.55 + t * 0.45).toFixed(2)})`
}

export default function HeatBoard({ totals }) {
  const [filter, setFilter] = useState('all')
  const count = (num, zone) => totals[(zone === 'double' ? 'D' : zone === 'triple' ? 'T' : '') + num] || 0
  const bull25 = totals['25'] || 0   // bull simple (zone single)
  const bull50 = totals['Bull'] || 0 // bull double (zone double)
  const active = (zone) => filter === 'all' || filter === zone

  let max = 1
  SEGS.forEach((s) => { if (active(s.zone)) max = Math.max(max, count(s.num, s.zone)) })
  if (active('single')) max = Math.max(max, bull25)
  if (active('double')) max = Math.max(max, bull50)

  return (
    <div>
      <div className="tabs heat-tabs">
        {FILTERS.map((f) => (
          <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      <svg viewBox="0 0 200 200" style={{ width: 'min(80vw,320px)', display: 'block', margin: '4px auto 0' }}>
        <circle cx={cx} cy={cy} r="92" fill="#05080699" stroke="var(--line-strong)" strokeWidth="1.5" />
        {SEGS.map((s, i) => (
          <path key={i} d={s.d} fill={heatColor(count(s.num, s.zone), max, active(s.zone))} stroke="#040705" strokeWidth=".4" strokeOpacity=".6" />
        ))}
        <circle cx={cx} cy={cy} r={rBullO} fill={heatColor(bull25, max, active('single'))} stroke="#040705" strokeWidth=".4" />
        <circle cx={cx} cy={cy} r={rBullI} fill={heatColor(bull50, max, active('double'))} stroke="#040705" strokeWidth=".4" />
        {LABELS.map((l) => (
          <text key={l.num} x={l.lx} y={l.ly} fontSize="8" fill="#9FB4A6" fontFamily="Oswald" textAnchor="middle" dominantBaseline="central">{l.num}</text>
        ))}
      </svg>

      <div className="heat-legend">
        <span><i style={{ background: 'rgba(255,70,60,.85)' }} />Faibles</span>
        <span><i style={{ background: 'rgba(255,210,60,.85)' }} />Moyennes</span>
        <span><i style={{ background: 'rgba(57,255,106,.85)' }} />Excellentes</span>
      </div>
    </div>
  )
}
