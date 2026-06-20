import { DARTBOARD_ORDER } from '../../game/engine/constants.js'

const cx = 100, cy = 100
const rDoubO = 86, rDoubI = 78, rTripO = 54, rTripI = 46, rBullO = 13, rBullI = 6.5

function polar(r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] }
function sector(r1, r2, a1, a2) {
  const [x1, y1] = polar(r2, a1), [x2, y2] = polar(r2, a2)
  const [x3, y3] = polar(r1, a2), [x4, y4] = polar(r1, a1)
  const large = a2 - a1 > 180 ? 1 : 0
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r2} ${r2} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${x3.toFixed(2)} ${y3.toFixed(2)} A${r1} ${r1} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`
}

// Géométrie précalculée une seule fois.
const SEGMENTS = []
const LABELS = []
DARTBOARD_ORDER.forEach((num, idx) => {
  const a1 = idx * 18 - 9, a2 = idx * 18 + 9, green = idx % 2 === 0
  const single = green ? '#0c130f' : '#16231b'
  const ring = green ? '#39FF6A' : '#FF4D4D'
  SEGMENTS.push({ k: `${num}-1`, d: sector(rTripO, rDoubI, a1, a2), fill: single })
  SEGMENTS.push({ k: `${num}-3`, d: sector(rTripI, rTripO, a1, a2), fill: ring, op: 0.88 })
  SEGMENTS.push({ k: `${num}-1i`, d: sector(rBullO, rTripI, a1, a2), fill: single })
  SEGMENTS.push({ k: `${num}-2`, d: sector(rDoubI, rDoubO, a1, a2), fill: ring, op: 0.88 })
  const [lx, ly] = polar(rDoubO + 8, idx * 18)
  LABELS.push({ num, x: lx.toFixed(1), y: ly.toFixed(1) })
})

function litfKeys(t) {
  if (!t) return []
  if (t.num === 25) return [`25-${t.mult}`]
  if (t.mult === 1) return [`${t.num}-1`, `${t.num}-1i`]
  return [`${t.num}-${t.mult}`]
}

// target = cible courante ; final = true quand la loterie est figée.
export default function BarBoard({ target, final }) {
  const litf = new Set(final ? litfKeys(target) : [])
  const lit = !final && target ? target.num : null
  return (
    <svg className="bar-board" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="92" fill="#05080699" stroke="var(--line-strong)" strokeWidth="1.5" />
      {SEGMENTS.map((s) => {
        let cls = 'seg'
        if (litf.has(s.k)) cls += ' litf'
        else if (lit != null && s.k.startsWith(lit + '-')) cls += ' lit'
        return <path key={s.k} className={cls} d={s.d} fill={s.fill} fillOpacity={s.op ?? 1} data-k={s.k} />
      })}
      <circle className={'seg' + (litf.has('25-1') ? ' litf' : (lit === 25 ? ' lit' : ''))} cx={cx} cy={cy} r={rBullO} fill="#1f7a3f" data-k="25-1" />
      <circle className={'seg' + (litf.has('25-2') ? ' litf' : (lit === 25 ? ' lit' : ''))} cx={cx} cy={cy} r={rBullI} fill="#FF4D4D" data-k="25-2" />
      {LABELS.map((l) => (
        <text key={l.num} className={'bl' + (target && target.num === l.num ? ' lit' : '')} x={l.x} y={l.y}
          textAnchor="middle" dominantBaseline="central">{l.num}</text>
      ))}
    </svg>
  )
}
