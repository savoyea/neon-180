// Catalogue des modes de jeu — partagé entre l'accueil et le moteur de jeu.
export const MODES = {
  x01:     { key: 'x01',     name: 'X01',          ico: '🎯', tag: 'CLASSIQUE',   desc: '501 · 401 · 301 · 201 — descente, sortie double' },
  cricket: { key: 'cricket', name: 'Cricket',      ico: '⊕',  tag: 'TACTIQUE',    desc: '15→20 + Bull · marques & points' },
  atw:     { key: 'atw',     name: 'Tour du monde', ico: '🌍', tag: 'COURSE',      desc: 'Touche 1→20 puis Bull dans l’ordre' },
  killer:  { key: 'killer',  name: 'Killer',       ico: '💀', tag: 'ÉLIMINATION', desc: 'Deviens tueur, élimine les autres' },
  countup: { key: 'countup', name: 'Score Max',    ico: '⚡', tag: 'RAPIDE',      desc: '8 volées · le plus gros total gagne' },
  bar:     { key: 'bar',     name: 'Défi de bar',  ico: '🍻', tag: 'FUN',         desc: 'Loterie · Facile ou Expert' },
}

export const MODE_LIST = Object.values(MODES)
