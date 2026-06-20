import { useNavigate } from 'react-router-dom'
import Board from '../components/Board.jsx'

export default function Splash() {
  const nav = useNavigate()
  return (
    <div className="screen no-nav">
      <div className="auth-wrap">
        <Board className="radar" size={200} />
        <div className="auth-brand"><b>DART<span>180</span></b></div>
        <div className="auth-sub">Compteur de fléchettes · scoring, stats &amp; compétition</div>

        <button className="btn primary" onClick={() => nav('/signup')}>Commencer</button>
        <p className="form-note">
          Déjà un compte ? <a onClick={() => nav('/login')} style={{ cursor: 'pointer' }}>Se connecter</a>
        </p>
      </div>
    </div>
  )
}
