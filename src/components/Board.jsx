// Cible néon réutilisable (accueil, splash, profil)
export default function Board({ className, size = 100 }) {
  const spokes = Array.from({ length: 20 }).map((_, i) => {
    const a = (i * 18 * Math.PI) / 180
    return (
      <line key={i}
        x1={50 + 12 * Math.cos(a)} y1={50 + 12 * Math.sin(a)}
        x2={50 + 48 * Math.cos(a)} y2={50 + 48 * Math.sin(a)}
        stroke="#39FF6A" strokeOpacity=".15" />
    )
  })
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" stroke="#39FF6A" strokeOpacity=".25" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="40" stroke="#39FF6A" strokeOpacity=".4" strokeWidth="2" />
      <circle cx="50" cy="50" r="26" stroke="#39FF6A" strokeOpacity=".55" strokeWidth="2" />
      <circle cx="50" cy="50" r="12" stroke="#FF4D4D" strokeOpacity=".6" strokeWidth="2" />
      <circle cx="50" cy="50" r="4" fill="#39FF6A" />
      {spokes}
    </svg>
  )
}
