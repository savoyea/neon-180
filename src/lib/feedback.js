// Retour haptique (vibration) + son synthétisé (Web Audio). Aucun fichier audio.
let ctx
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch (e) { ctx = null } }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}
function beep(freq, dur, type = 'sine', gain = 0.05, when = 0) {
  const c = ac(); if (!c) return
  const o = c.createOscillator(), g = c.createGain()
  o.type = type; o.frequency.value = freq
  o.connect(g); g.connect(c.destination)
  const t = c.currentTime + when
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.start(t); o.stop(t + dur)
}
function vib(p) { try { navigator.vibrate && navigator.vibrate(p) } catch (e) { /* ignore */ } }

// Tape sur le pavé.
export function tap() { vib(8); beep(680, 0.04, 'triangle', 0.04) }

// Son/vibration selon l'événement (flash de jeu).
export function fxSound(text) {
  if (!text) return
  if (text === '180 !') { vib([20, 40, 20, 40, 70]);[523, 659, 784, 1047].forEach((f, i) => beep(f, 0.18, 'sine', 0.06, i * 0.085)) }
  else if (text === 'BUST') { vib([70, 40, 70]); beep(170, 0.25, 'sawtooth', 0.05); beep(120, 0.3, 'sawtooth', 0.04, 0.06) }
  else if (/GAME|LEG|TUEUR|MORT/.test(text)) { vib([40, 60, 40, 60, 130]);[523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.2, 'sine', 0.06, i * 0.08)) }
  else { vib(15); beep(900, 0.08, 'sine', 0.05) } // TON xxx, etc.
}
