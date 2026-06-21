import { useState, useEffect, useReducer } from 'react'
import { isStandalone, isIOS, canPrompt, installHidden, hideInstall, promptInstall, onPwaChange } from '../lib/pwa.js'

export function IosInstructions({ onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 32, textAlign: 'center' }}>📲</div>
        <h2 style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 4 }}>Installer l’appli</h2>
        <p className="muted" style={{ fontSize: 13.5, textAlign: 'center', margin: '8px 0 14px' }}>Accès en un tap, plein écran.</p>
        <ol className="a2hs-steps">
          <li>Appuie sur <b>Partager</b> <span className="ic">⎙</span> dans Safari</li>
          <li>Choisis <b>« Sur l’écran d’accueil »</b></li>
          <li>Valide avec <b>Ajouter</b></li>
        </ol>
        <button className="btn ghost" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}

export default function InstallBanner() {
  const [, force] = useReducer((x) => x + 1, 0)
  const [iosOpen, setIosOpen] = useState(false)
  useEffect(() => onPwaChange(force), [])

  if (isStandalone() || installHidden()) return null
  if (!canPrompt() && !isIOS()) return null // rien à proposer sur ce navigateur

  async function install() {
    if (canPrompt()) await promptInstall()
    else setIosOpen(true)
  }

  return (
    <>
      <div className="install-banner">
        <div className="ib-text">📲 <b>Installe Dart-180</b><br /><small>Sur ton écran d’accueil, comme une vraie app.</small></div>
        <div className="ib-actions">
          <button className="btn sm primary" onClick={install}>Installer</button>
          <button className="ib-dismiss" onClick={hideInstall}>Ne plus afficher</button>
        </div>
      </div>
      {iosOpen && <IosInstructions onClose={() => setIosOpen(false)} />}
    </>
  )
}
