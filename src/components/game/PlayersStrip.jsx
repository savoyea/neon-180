import { useEffect, useRef } from 'react'

// Bandeau des joueurs. Centre le joueur actif par scroll HORIZONTAL uniquement
// (jamais la page) — corrige le "remontée auto" décrit dans le brief.
export default function PlayersStrip({ game, mode }) {
  const ref = useRef(null)
  const activeIdx = game.turn.pi

  useEffect(() => {
    const strip = ref.current
    if (!strip) return
    const act = strip.querySelector('.active')
    if (act) strip.scrollTo({ left: act.offsetLeft - (strip.clientWidth - act.clientWidth) / 2, behavior: 'smooth' })
  }, [activeIdx, game])

  return (
    <div className="players-strip" ref={ref}>
      {game.players.map((p, i) => {
        const active = i === activeIdx && !game.finished
        const done = p.done || p.elim
        const sb = mode.scoreboard(game, p, active)
        return (
          <div key={p.id} className={'pcard' + (active ? ' active' : '') + (done ? ' done' : '')}>
            {active && <span className="crown">À TOI</span>}
            {sb.extra && <span className="legs">{sb.extra}</span>}
            <div className="pname" style={{ color: p.color }}>{p.name}</div>
            <div className="pscore" style={sb.pscoreStyle}>{sb.big}</div>
            <div className="psub">{sb.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
