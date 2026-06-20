// Badges calculés à partir des stats du profil (aucun stockage dédié).
// metric = colonne de profiles ; earned quand la valeur atteint goal.
export const BADGES = [
  { id: 'first-game', name: 'Premier pas', emoji: '🎯', tier: 'common', metric: 'games_played', goal: 1, desc: 'Jouer ta première partie en ligne' },
  { id: 'regular', name: 'Habitué', emoji: '🗓️', tier: 'common', metric: 'games_played', goal: 25, desc: '25 parties jouées' },
  { id: 'first-win', name: 'Première victoire', emoji: '🏆', tier: 'common', metric: 'wins', goal: 1, desc: 'Gagner une partie' },
  { id: 'competitor', name: 'Compétiteur', emoji: '⚔️', tier: 'rare', metric: 'wins', goal: 10, desc: '10 victoires' },
  { id: 'veteran', name: 'Vétéran', emoji: '🎖️', tier: 'elite', metric: 'wins', goal: 50, desc: '50 victoires' },
  { id: '180-club', name: '180 Club', emoji: '💯', tier: 'common', metric: 'total_180', goal: 1, desc: 'Réaliser ton premier 180' },
  { id: '180-rain', name: 'Pluie de 180', emoji: '🌧️', tier: 'rare', metric: 'total_180', goal: 10, desc: '10 fois 180' },
  { id: '180-legend', name: 'Légende du 180', emoji: '👑', tier: 'elite', metric: 'total_180', goal: 50, desc: '50 fois 180' },
  { id: 'streak-3', name: 'Sur une lancée', emoji: '🔥', tier: 'rare', metric: 'best_streak', goal: 3, desc: '3 victoires d’affilée' },
  { id: 'invincible', name: 'Invincible', emoji: '⚡', tier: 'elite', metric: 'best_streak', goal: 5, desc: '5 victoires consécutives' },
  { id: 'finisher', name: 'Finisher', emoji: '🎯', tier: 'rare', metric: 'best_checkout', goal: 100, desc: 'Un finish à 100+' },
  { id: 'sniper', name: 'Sniper', emoji: '🦅', tier: 'elite', metric: 'best_checkout', goal: 120, desc: 'Un finish à 120+' },
  { id: 'rising', name: 'Montée en puissance', emoji: '📈', tier: 'rare', metric: 'level', goal: 5, desc: 'Atteindre le niveau 5' },
  { id: 'elite', name: 'Elite Player', emoji: '💎', tier: 'elite', metric: 'level', goal: 10, desc: 'Atteindre le niveau 10' },
]

export function badgeState(b, profile) {
  const value = profile?.[b.metric] || 0
  return { value, earned: value >= b.goal, pct: Math.min(100, Math.round((value / b.goal) * 100)) }
}

export function earnedBadges(profile) {
  return BADGES.filter((b) => badgeState(b, profile).earned)
}
