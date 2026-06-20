import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import { PRICING } from '../lib/premium.js'

const ROWS = [
  { label: 'Scoring & parties', free: true },
  { label: 'Parties en ligne', free: true },
  { label: 'Amis & chat', free: true },
  { label: 'Ligues & classements', free: true },
  { label: 'Stats de base', free: true },
  { label: 'Stats complètes & analyses', free: false },
  { label: 'Carte thermique', free: false },
  { label: 'Badges exclusifs', free: false },
  { label: 'Emotes premium (illimitées)', free: false },
  { label: 'Personnalisation (skins, cadres)', free: false },
  { label: 'Historique illimité', free: false },
  { label: 'Mode classé & matchmaking', free: false },
  { label: 'Battle Pass & saisons', free: false },
  { label: 'Support prioritaire', free: false },
]

export default function PlanCompare() {
  const nav = useNavigate()
  return (
    <div className="screen">
      <TopBar back title="Choisis ton plan" />
      <table className="plan-table">
        <thead>
          <tr><th></th><th>Gratuit</th><th className="pcol">Dart-180+</th></tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.label}>
              <td className="pl">{r.label}</td>
              <td>{r.free ? <span className="yes">✓</span> : <span className="no">—</span>}</td>
              <td className="pcol"><span className="yes">✓</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn primary" style={{ marginTop: 18 }} onClick={() => nav('/premium')}>
        ⭐ Passer à Dart-180+ — {PRICING.monthly}/mois
      </button>
      <p className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>ou {PRICING.yearly}/an ({PRICING.yearlyPerMonth})</p>
    </div>
  )
}
