export default function CricketGrid({ game }) {
  const nums = game.cricketNums
  return (
    <div className="cricket-wrap">
      <table className="cricket">
        <thead>
          <tr>
            <th className="numcol" />
            {game.players.map((p, i) => (
              <th key={p.id} className={i === game.turn.pi ? 'activep' : ''}>{p.name.slice(0, 6)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nums.map((n) => (
            <tr key={n}>
              <td className="numcol">{n === 25 ? 'B' : n}</td>
              {game.players.map((p) => {
                const m = p.marks[n]
                const closed = m >= 3
                const sym = m === 0 ? '·' : m === 1 ? '/' : m === 2 ? '✕' : '⊗'
                return (
                  <td key={p.id} className={closed ? 'closed' : ''}>
                    <span className="mark" style={{ color: closed ? 'var(--muted-2)' : 'var(--neon)' }}>{sym}</span>
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="ptsrow">
            <td className="numcol" style={{ color: 'var(--amber)' }}>PTS</td>
            {game.players.map((p) => (
              <td key={p.id} style={{ color: p.color }}>{p.points}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
