import { DARTBOARD_ORDER } from '../game/engine/constants.js'

const cx = 100, cy = 100, rOut = 90, rIn = 20
const polar = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] }
function wedge(a1, a2) {
  const [x1, y1] = polar(rOut, a1), [x2, y2] = polar(rOut, a2)
  const [x3, y3] = polar(rIn, a2), [x4, y4] = polar(rIn, a1)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${rOut} ${rOut} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} A${rIn} ${rIn} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`
}

// perNumber: { 1..20: count }, bull: count. Colore chaque secteur par fréquence.
export default function HeatBoard({ perNumber, bull }) {
  const max = Math.max(1, bull, ...Object.values(perNumber))
  const heat = (c) => {
    const t = c / max // 0..1
    if (c === 0) return 'rgba(120,140,130,.10)'
    // froid (vert sombre) → chaud (ambre)
    const r = Math.round(57 + t * 198), g = Math.round(255 - t * 45), b = Math.round(106 - t * 43)
    return `rgba(${r},${g},${b},${(0.25 + t * 0.7).toFixed(2)})`
  }
  return (
    <svg viewBox="0 0 200 200" style={{ width: 'min(72vw,300px)', display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={rOut + 4} fill="#05080699" stroke="var(--line-strong)" strokeWidth="1.5" />
      {DARTBOARD_ORDER.map((num, idx) => {
        const a1 = idx * 18 - 9, a2 = idx * 18 + 9
        const [lx, ly] = polar(rOut + 9, idx * 18)
        return (
          <g key={num}>
            <path d={wedge(a1, a2)} fill={heat(perNumber[num] || 0)} stroke="#040705" strokeWidth=".5" />
            <text x={lx} y={ly} fontSize="8" fill="#9FB4A6" fontFamily="Oswald" textAnchor="middle" dominantBaseline="central">{num}</text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={rIn} fill={heat(bull)} stroke="#040705" strokeWidth=".5" />
      <text x={cx} y={cy} fontSize="9" fill="#EAFFF0" fontFamily="Oswald" textAnchor="middle" dominantBaseline="central">B</text>
    </svg>
  )
}
