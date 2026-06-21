// Gestion de l'installation PWA (Add to Home Screen) — portée du legacy.
const BASE = import.meta.env.BASE_URL || '/'
const HIDE_KEY = 'dart180_install_hidden'

let deferredPrompt = null
const listeners = new Set()
const notify = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; notify() })
  window.addEventListener('appinstalled', () => { deferredPrompt = null; hideInstall(); notify() })
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}
export function isIOS() {
  const ua = navigator.userAgent || ''
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
export const canPrompt = () => Boolean(deferredPrompt)
export function installHidden() { try { return localStorage.getItem(HIDE_KEY) === '1' } catch { return false } }
export function hideInstall() { try { localStorage.setItem(HIDE_KEY, '1') } catch { /* ignore */ } notify() }

export async function promptInstall() {
  if (!deferredPrompt) return false
  deferredPrompt.prompt()
  try { await deferredPrompt.userChoice } catch (e) { /* ignore */ }
  deferredPrompt = null
  notify()
  return true
}

export function onPwaChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }

export function registerSW() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE }).catch(() => {})
  })
}
