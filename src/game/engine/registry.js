// Registre des modes : pour ajouter un mode, crée un module dans ./modes,
// importe-le ici, ajoute-le à MODULES, et déclare son chrome (ico/tag/desc)
// dans ../modes.js. Le reste de l'app le découvre automatiquement.
import x01 from './modes/x01.js'
import cricket from './modes/cricket.js'
import atw from './modes/atw.js'
import killer from './modes/killer.js'
import countup from './modes/countup.js'
import bar from './modes/bar.js'
import { MODES as CHROME } from '../modes.js'

const MODULES = { x01, cricket, atw, killer, countup, bar }

// Fusionne logique (module) + présentation (catalogue) en un seul objet par mode.
const REGISTRY = {}
for (const key of Object.keys(MODULES)) {
  REGISTRY[key] = { ...CHROME[key], ...MODULES[key] }
}

export function getMode(key) { return REGISTRY[key] }
export function listModes() { return Object.values(REGISTRY) }
