import { useState } from 'react'

// Pavé "calculatrice" : multiplicateur courant + secteurs. onHit(seg, mult).
export default function DartPad({ config, onHit, disabled }) {
  const [mult, setMult] = useState(1)
  const { numbers, multipliers, bull, miss, missLabel } = config

  function hit(seg) {
    if (disabled) return
    onHit(seg, mult)
    setMult(1)
  }

  return (
    <div>
      {multipliers && (
        <div className="mult-row">
          <button className={'chip' + (mult === 1 ? ' on' : '')} onClick={() => setMult(1)}>Simple</button>
          <button className={'chip x2' + (mult === 2 ? ' on' : '')} onClick={() => setMult(2)}>Double ×2</button>
          <button className={'chip x3' + (mult === 3 ? ' on' : '')} onClick={() => setMult(3)}>Triple ×3</button>
        </div>
      )}
      <div className="pad">
        {numbers.map((n) => (
          <button key={n} onClick={() => hit(n)}>{n}</button>
        ))}
        {bull && <button className="bull wide" onClick={() => hit(25)}>BULL (25)</button>}
        {miss && <button className="miss wide" onClick={() => hit(0)}>{missLabel || '⊘ Manqué'}</button>}
      </div>
    </div>
  )
}
