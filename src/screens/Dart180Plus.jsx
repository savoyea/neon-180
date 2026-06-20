import { useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { PRICING, PREMIUM_PERKS, isPremium } from '../lib/premium.js'

export default function Dart180Plus() {
  const { profile } = useAuth()
  const [plan, setPlan] = useState('yearly')
  const premium = isPremium(profile)

  return (
    <div className="screen">
      <TopBar back title="Dart-180+" />

      <div className="plus-hero">
        <div className="plus-logo">DART<span>180</span><b>+</b></div>
        <p>Passe en mode compétiteur. Progression complète, stats avancées et personnalisation.</p>
      </div>

      {premium ? (
        <div className="card glow" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 34 }}>⭐</div>
          <h2 style={{ color: 'var(--neon)', fontSize: 18 }}>Tu es Dart-180+</h2>
          <p className="muted" style={{ fontSize: 13 }}>Merci de soutenir l’app — profite de tous les avantages !</p>
        </div>
      ) : (
        <>
          <div className="plan-row">
            <button className={'plan' + (plan === 'monthly' ? ' on' : '')} onClick={() => setPlan('monthly')}>
              <b>{PRICING.monthly}</b><small>par mois</small>
            </button>
            <button className={'plan' + (plan === 'yearly' ? ' on' : '')} onClick={() => setPlan('yearly')}>
              <span className="plan-tag">-50%</span><b>{PRICING.yearly}</b><small>par an · {PRICING.yearlyPerMonth}</small>
            </button>
          </div>
          <button className="btn primary" style={{ marginTop: 4 }} onClick={() => alert('Le paiement Stripe sera bientôt disponible 🙌')}>
            S’abonner — {plan === 'yearly' ? PRICING.yearly + '/an' : PRICING.monthly + '/mois'}
          </button>
          <p className="muted" style={{ textAlign: 'center', fontSize: 11.5, marginTop: 8 }}>Sans engagement · résiliable à tout moment</p>
        </>
      )}

      <div className="section-title"><h2>Tout ce que tu débloques</h2></div>
      {PREMIUM_PERKS.map((p) => (
        <div className="perk" key={p.title}>
          <div className="perk-emoji">{p.emoji}</div>
          <div className="meta"><b>{p.title}</b><small>{p.desc}</small></div>
          <span className="perk-check">✓</span>
        </div>
      ))}

      <p className="muted" style={{ textAlign: 'center', fontSize: 12, margin: '18px 6px' }}>
        La version gratuite reste complète : jouer, scorer, amis, parties en ligne, ligues.
      </p>
    </div>
  )
}
