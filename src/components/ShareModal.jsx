import { useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'

const APP_URL = (typeof window !== 'undefined' ? window.location.origin : 'https://savoyea.github.io') +
  (import.meta.env.BASE_URL || '/')

export default function ShareModal({ onClose }) {
  const [copied, setCopied] = useState(false)

  const svg = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(APP_URL)
    qr.make()
    return qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true })
  }, [])

  async function copy() {
    try { await navigator.clipboard.writeText(APP_URL); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch (e) { /* ignore */ }
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: 'Dart-180', text: 'Rejoins-moi sur Dart-180 🎯', url: APP_URL }) } catch (e) { /* annulé */ } }
    else copy()
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: '#fff', fontSize: 18 }}>Partager Dart-180</h2>
        <p className="muted" style={{ fontSize: 13, margin: '6px 0 14px' }}>Scanne le QR code pour ouvrir l’app.</p>
        <div className="qr-box" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="qr-url">{APP_URL}</div>
        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={copy}>{copied ? '✓ Copié' : 'Copier le lien'}</button>
          <button className="btn primary" onClick={share}>Partager</button>
        </div>
      </div>
    </div>
  )
}
