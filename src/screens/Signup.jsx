import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Signup() {
  const nav = useNavigate()
  const { signUp, isDemo } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (username.trim().length < 3) { setErr('Le pseudo doit faire au moins 3 caractères.'); return }
    if (!isDemo) {
      if (!email) { setErr('Renseigne ton email.'); return }
      if (password.length < 6) { setErr('Mot de passe : 6 caractères minimum.'); return }
      if (password !== confirm) { setErr('Les mots de passe ne correspondent pas.'); return }
    }
    setBusy(true)
    const { error, needsConfirm } = await signUp({ username: username.trim(), email, password })
    setBusy(false)
    if (error) { setErr(error.message || 'Inscription impossible.'); return }
    if (needsConfirm) { setDone(true); return }
    nav('/')
  }

  if (done) {
    return (
      <div className="screen no-nav">
        <div className="auth-wrap">
          <div className="auth-brand"><b>DART<span>180</span></b></div>
          <div style={{ textAlign: 'center', fontSize: 44, margin: '10px 0' }}>📩</div>
          <div className="auth-sub">Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.</div>
          <button className="btn primary" onClick={() => nav('/login')}>Aller à la connexion</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen no-nav">
      <form className="auth-wrap" onSubmit={submit}>
        <div className="auth-brand"><b>DART<span>180</span></b></div>
        <div className="auth-sub">Crée ton compte joueur</div>

        <div className="field">
          <label>Pseudo</label>
          <input className="input" value={username} maxLength={18}
            onChange={(e) => setUsername(e.target.value)} placeholder="DartMaster" />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input className="input" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="field">
          <label>Confirmer le mot de passe</label>
          <input className="input" type="password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="form-error">{err}</div>

        <button className="btn primary" type="submit" disabled={busy}>{busy ? '…' : 'S’inscrire'}</button>
        <p className="form-note">
          Déjà un compte ? <a onClick={() => nav('/login')} style={{ cursor: 'pointer' }}>Se connecter</a>
        </p>
      </form>
    </div>
  )
}
