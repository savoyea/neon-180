import { useNavigate } from 'react-router-dom'

export default function TopBar({ back, title, right }) {
  const nav = useNavigate()
  return (
    <div className="topbar">
      {back ? (
        <button className="back-btn" onClick={() => (typeof back === 'function' ? back() : nav(-1))}>‹ Retour</button>
      ) : (
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => nav('/')}><span className="dot" /><b>DART<span>180</span></b></div>
      )}
      {title && <h2 style={{ fontSize: 16 }}>{title}</h2>}
      {right || <span style={{ width: 36 }} />}
    </div>
  )
}
