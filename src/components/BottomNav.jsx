import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'

const ITEMS = [
  { to: '/', icon: 'home', label: 'Accueil' },
  { to: '/play', icon: 'play', label: 'Jouer' },
  { to: '/stats', icon: 'stats', label: 'Stats' },
  { to: '/history', icon: 'history', label: 'Historique' },
  { to: '/profile', icon: 'profile', label: 'Profil' },
]

export default function BottomNav() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav className="nav">
      {ITEMS.map((it) => (
        <button key={it.to} className={pathname === it.to ? 'on' : ''} onClick={() => nav(it.to)}>
          <span className="ni"><Icon name={it.icon} size={22} /></span>
          {it.label}
        </button>
      ))}
    </nav>
  )
}
