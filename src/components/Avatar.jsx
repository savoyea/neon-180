import { avatarStyle, frameOf } from '../game/cosmetics.js'

// Avatar stylisé (gradient + cadre cosmétique). Pour les grandes vignettes profil.
export default function Avatar({ profile, name, size = 88 }) {
  const label = (profile?.username || name || '?').slice(0, 2).toUpperCase()
  const grad = profile ? avatarStyle(profile) : 'linear-gradient(150deg,var(--neon),var(--neon-dim))'
  const frame = profile ? frameOf(profile) : { id: 'none' }
  const ringed = frame.id !== 'none'
  const style = {
    width: size, height: size, fontSize: Math.round(size * 0.38), background: grad,
    boxShadow: ringed
      ? `0 0 0 3px var(--bg), 0 0 0 6px ${frame.ring}, 0 0 22px ${frame.ring}`
      : '0 0 22px rgba(57,255,106,.35)',
  }
  return <div className={'cz-avatar' + (frame.pulse ? ' pulse' : '')} style={style}>{label}</div>
}
