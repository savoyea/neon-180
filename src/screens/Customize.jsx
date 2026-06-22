import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Avatar from '../components/Avatar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { isPremium } from '../lib/premium.js'
import { CATALOG, getEquipped, titleOf } from '../game/cosmetics.js'

const TABS = [
  { key: 'theme', label: 'Thème' },
  { key: 'avatar', label: 'Avatar' },
  { key: 'frame', label: 'Cadre' },
  { key: 'title', label: 'Titre' },
  { key: 'dart', label: 'Fléchettes' },
  { key: 'effect', label: 'Effets' },
]

function Preview({ kind, item }) {
  if (kind === 'theme') return <span className="cz-sw" style={{ background: item.neon }} />
  if (kind === 'avatar') return <span className="cz-sw" style={{ background: item.grad, borderRadius: '50%' }} />
  if (kind === 'frame') return <span className="cz-sw" style={{ background: 'var(--surface2)', borderRadius: '50%', boxShadow: item.id === 'none' ? 'none' : `0 0 0 2px ${item.ring}, 0 0 8px ${item.ring}` }} />
  if (kind === 'title') return <span style={{ fontFamily: 'Oswald', fontWeight: 600, fontSize: 13 }}>“{item.name}”</span>
  if (kind === 'dart') return <span style={{ fontSize: 20, filter: `drop-shadow(0 0 5px ${item.color})`, color: item.color }}>🎯</span>
  if (kind === 'effect') return <span className="cz-sw" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
  return null
}

export default function Customize() {
  const { profile, updateProfile } = useAuth()
  const nav = useNavigate()
  const premium = isPremium(profile)
  const [tab, setTab] = useState('theme')
  const equipped = getEquipped(profile)

  function equip(kind, item) {
    if (item.premium && !premium) { nav('/premium'); return }
    updateProfile({ cosmetics: { ...(profile?.cosmetics || {}), [kind]: item.id } })
  }

  return (
    <div className="screen">
      <TopBar back title="Personnalisation" />

      <div className="card glow" style={{ textAlign: 'center', paddingBottom: 18 }}>
        <Avatar profile={profile} size={84} />
        <div className="profile-name" style={{ fontSize: 20, marginTop: 10 }}>{profile?.username || 'Joueur'}</div>
        <span className="level-pill">{titleOf(profile)}</span>
      </div>

      <div className="tabs scroll" style={{ marginTop: 16 }}>
        {TABS.map((t) => <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      <div className="cz-grid">
        {CATALOG[tab].map((item) => {
          const on = equipped[tab] === item.id
          const locked = item.premium && !premium
          return (
            <button key={item.id} className={'cz-item' + (on ? ' on' : '') + (locked ? ' locked' : '')} onClick={() => equip(tab, item)}>
              {item.premium && <span className="cz-prem">{locked ? '🔒' : '⭐'}</span>}
              <Preview kind={tab} item={item} />
              <small>{item.name}</small>
              {on && <span className="cz-check">✓</span>}
            </button>
          )
        })}
      </div>

      {!premium && <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 14 }}>🔒 Les items premium se débloquent avec <a onClick={() => nav('/premium')} style={{ cursor: 'pointer' }}>Dart-180+</a>.</p>}
    </div>
  )
}
