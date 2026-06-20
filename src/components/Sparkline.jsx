// Mini graphe en ligne (évolution d'une métrique). values = nombres chronologiques.
export default function Sparkline({ values, height = 120, color = 'var(--neon)' }) {
  const data = (values || []).filter((v) => typeof v === 'number' && !isNaN(v))
  if (data.length < 2) {
    return <div className="empty" style={{ padding: 24 }}><p>Pas encore assez de parties pour tracer la courbe.</p></div>
  }
  const w = 320, h = height, pad = 10
  const min = Math.min(...data), max = Math.max(...data)
  const span = max - min || 1
  const x = (i) => pad + (i / (data.length - 1)) * (w - 2 * pad)
  const y = (v) => h - pad - ((v - min) / span) * (h - 2 * pad)
  const line = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${pad},${h - pad} ${line} ${(w - pad)},${h - pad}`
  const last = data[data.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-fill)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === data.length - 1 ? 3.5 : 1.6} fill={i === data.length - 1 ? color : 'var(--muted)'} />
      ))}
      <text x={w - pad} y={y(last) - 6} fontSize="11" fill={color} fontFamily="Oswald" fontWeight="700" textAnchor="end">{last.toFixed(1)}</text>
    </svg>
  )
}
