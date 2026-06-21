// Jeu d'icônes ligne modernes (stroke = currentColor) — cohérent avec le thème néon.
const PATHS = {
  home: (
    <>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3" x2="12" y2="7.5" /><line x1="12" y1="16.5" x2="12" y2="21" />
      <line x1="3" y1="12" x2="7.5" y2="12" /><line x1="16.5" y1="12" x2="21" y2="12" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
    </>
  ),
  stats: (
    <>
      <rect x="4" y="12" width="3.4" height="8" rx="1" fill="currentColor" stroke="none" />
      <rect x="10.3" y="7" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" />
      <rect x="16.6" y="3.5" width="3.4" height="16.5" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7 V12 L15.5 14" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.2" r="3.8" />
      <path d="M5 20 C5 16.2 8.4 14.2 12 14.2 C15.6 14.2 19 16.2 19 20" />
    </>
  ),
  bell: (
    <>
      <path d="M18 16 H6 C6.8 15 8 13.4 8 10 C8 6.7 9.8 5 12 5 C14.2 5 16 6.7 16 10 C16 13.4 17.2 15 18 16 Z" />
      <path d="M10.4 19 a1.6 1.6 0 0 0 3.2 0" />
    </>
  ),
  friends: (
    <>
      <circle cx="9" cy="8.4" r="3.3" />
      <path d="M3 19 C3 15.6 5.8 14 9 14 C12.2 14 15 15.6 15 19" />
      <circle cx="17.2" cy="9.2" r="2.5" opacity="0.65" />
      <path d="M15.6 14.2 C18.4 14.4 21 15.9 21 19" opacity="0.65" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5 L12 5 M12 19 L12 21.5 M21.5 12 L19 12 M5 12 L2.5 12 M18.7 5.3 L17 7 M7 17 L5.3 18.7 M18.7 18.7 L17 17 M7 7 L5.3 5.3" />
    </>
  ),
}

export default function Icon({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name] || null}
    </svg>
  )
}
