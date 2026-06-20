// Constantes & solveur de checkout — partagés par les modules de mode.
export const DARTBOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
export const ATW_SEQ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25]
export const PALETTE = ['#39FF6A', '#3FE0FF', '#FFD23F', '#FF4D4D', '#B388FF', '#FF8A3D', '#5CFFC8', '#FF5CE1']

export function cricketNums(start) {
  const a = []
  for (let n = 20; n >= start; n--) a.push(n)
  a.push(25)
  return a
}

// ---- Solveur de sortie (double out) ----
const _singles = []
for (let i = 1; i <= 20; i++) _singles.push({ v: i, l: String(i) })
_singles.push({ v: 25, l: '25' })
const _trebles = []
for (let i = 1; i <= 20; i++) _trebles.push({ v: i * 3, l: 'T' + i })
const _doublesFinish = []
for (let i = 1; i <= 20; i++) _doublesFinish.push({ v: i * 2, l: 'D' + i })
_doublesFinish.push({ v: 50, l: 'Bull' })
const _anyThrow = [..._trebles, ..._singles, ..._doublesFinish.filter((d) => d.l !== 'Bull'), { v: 50, l: 'Bull' }, { v: 25, l: '25' }]

export function checkoutHint(rem) {
  if (rem > 170 || rem < 2) return ''
  const one = _doublesFinish.find((d) => d.v === rem)
  if (one) return one.l
  for (const d of _doublesFinish) {
    const need = rem - d.v
    if (need <= 0) continue
    const t = _anyThrow.find((x) => x.v === need)
    if (t) return t.l + ' ' + d.l
  }
  for (const d of _doublesFinish) {
    const r2 = rem - d.v
    if (r2 <= 0) continue
    for (const a of _trebles) {
      const need = r2 - a.v
      const b = _anyThrow.find((x) => x.v === need)
      if (b && need > 0) return a.l + ' ' + b.l + ' ' + d.l
    }
  }
  return ''
}

// Construit un dard {seg,mult,val,label} à partir d'un secteur + multiplicateur courant.
export function makeDart(seg, mult) {
  if (seg === 0) return { seg: 0, mult: 0, val: 0, label: '—' }
  if (seg === 25) {
    if (mult === 3) mult = 1
    return { seg: 25, mult, val: 25 * mult, label: mult === 2 ? 'Bull' : '25' }
  }
  return { seg, mult, val: seg * mult, label: (mult === 2 ? 'D' : mult === 3 ? 'T' : '') + seg }
}

export const uid = () => Math.random().toString(36).slice(2, 10)
export const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)))
