import { useNavigate, useLocation } from 'react-router-dom'

const ITEMS = [
  { to: '/', icon: '◎', label: 'Accueil' },
  { to: '/play', icon: '🎯', label: 'Jouer' },
  { to: '/stats', icon: '📊', label: 'Stats' },
  { to: '/history', icon: '🕘', label: 'Historique' },
  { to: '/profile', icon: '👤', label: 'Profil' },
]

export default function BottomNav() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav className="nav">
      {ITEMS.map((it) => (
        <button key={it.to} className={pathname === it.to ? 'on' : ''} onClick={() => nav(it.to)}>
          <span className="ni">{it.icon}</span>
          {it.label}
        </button>
      ))}
    </nav>
  )
}
