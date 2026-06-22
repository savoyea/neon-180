// Catalogue cosmétique. Les items marqués premium nécessitent Dart-180+.

export const THEMES = [
  { id: 'neon', name: 'Néon', rgb: '57,255,106', neon: '#39FF6A', dim: '#23B84E' },
  { id: 'cyan', name: 'Cyan', rgb: '63,224,255', neon: '#3FE0FF', dim: '#1FA9CC' },
  { id: 'gold', name: 'Or', rgb: '255,210,63', neon: '#FFD23F', dim: '#CC9E1F', premium: true },
  { id: 'crimson', name: 'Cramoisi', rgb: '255,77,77', neon: '#FF4D4D', dim: '#CC2E2E', premium: true },
  { id: 'violet', name: 'Violet', rgb: '179,136,255', neon: '#B388FF', dim: '#8055CC', premium: true },
  { id: 'magenta', name: 'Magenta', rgb: '255,92,225', neon: '#FF5CE1', dim: '#CC33B0', premium: true },
]

export const AVATARS = [
  { id: 'neon', name: 'Néon', grad: 'linear-gradient(150deg,#39FF6A,#23B84E)' },
  { id: 'cyan', name: 'Glace', grad: 'linear-gradient(150deg,#3FE0FF,#1F7AcC)' },
  { id: 'fire', name: 'Feu', grad: 'linear-gradient(150deg,#FFB23F,#FF4D4D)', premium: true },
  { id: 'electric', name: 'Électrique', grad: 'linear-gradient(150deg,#B388FF,#3FE0FF)', premium: true },
  { id: 'gold', name: 'Or', grad: 'linear-gradient(150deg,#FFE98F,#C99E2F)', premium: true },
  { id: 'magma', name: 'Magma', grad: 'linear-gradient(150deg,#FF5CE1,#FF4D4D)', premium: true },
]

export const FRAMES = [
  { id: 'none', name: 'Aucun' },
  { id: 'neon', name: 'Néon', ring: 'var(--neon)', glow: true },
  { id: 'gold', name: 'Or', ring: '#FFD23F', glow: true, premium: true },
  { id: 'electric', name: 'Électrique', ring: '#3FE0FF', glow: true, pulse: true, premium: true },
  { id: 'magenta', name: 'Néon rose', ring: '#FF5CE1', glow: true, premium: true },
]

export const TITLES = [
  { id: 'recrue', name: 'Recrue' },
  { id: 'tireur', name: 'Le Tireur' },
  { id: 'herbe', name: 'Champion en herbe' },
  { id: 'sniper', name: 'Sniper', premium: true },
  { id: 'machine', name: 'Machine à T20', premium: true },
  { id: 'legende', name: 'Légende vivante', premium: true },
]

export const DARTS = [
  { id: 'neon', name: 'Néon', color: '#39FF6A' },
  { id: 'carbon', name: 'Carbone', color: '#9FB4A6' },
  { id: 'gold', name: 'Or', color: '#FFD23F', premium: true },
  { id: 'fire', name: 'Feu', color: '#FF6A3D', premium: true },
  { id: 'futurist', name: 'Futuriste', color: '#3FE0FF', premium: true },
]

export const EFFECTS = [
  { id: 'neon', name: 'Néon', color: '#39FF6A' },
  { id: 'fire', name: 'Feu', color: '#FF6A3D', premium: true },
  { id: 'electric', name: 'Électrique', color: '#3FE0FF', premium: true },
  { id: 'gold', name: 'Or', color: '#FFD23F', premium: true },
]

export const CATALOG = { theme: THEMES, avatar: AVATARS, frame: FRAMES, title: TITLES, dart: DARTS, effect: EFFECTS }

const DEFAULTS = { theme: 'neon', avatar: 'neon', frame: 'none', title: 'tireur', dart: 'neon', effect: 'neon' }

export function getEquipped(profile) {
  const c = profile?.cosmetics || {}
  return { ...DEFAULTS, ...c }
}
export function getItem(kind, id) { return (CATALOG[kind] || []).find((x) => x.id === id) || CATALOG[kind][0] }

export function avatarStyle(profile) { return getItem('avatar', getEquipped(profile).avatar).grad }
export function frameOf(profile) { return getItem('frame', getEquipped(profile).frame) }
export function titleOf(profile) { return getItem('title', getEquipped(profile).title).name }
export function effectColor(profile) { return getItem('effect', getEquipped(profile).effect).color }

// Applique le thème (couleur d'accent) à toute l'app via variables CSS.
export function applyTheme(profile) {
  if (typeof document === 'undefined') return
  const t = getItem('theme', getEquipped(profile).theme)
  const r = document.documentElement.style
  r.setProperty('--neon', t.neon)
  r.setProperty('--neon-dim', t.dim)
  r.setProperty('--glow', `0 0 14px rgba(${t.rgb},.5)`)
  r.setProperty('--glow-soft', `0 0 8px rgba(${t.rgb},.28)`)
  r.setProperty('--line', `rgba(${t.rgb},.14)`)
  r.setProperty('--line-strong', `rgba(${t.rgb},.32)`)
}
