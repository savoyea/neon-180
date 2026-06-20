import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const nav = useNavigate()
  const { signIn, isDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (!email || (!isDemo && !password)) { setErr('Renseigne tes identifiants.'); return }
    setBusy(true)
    const { error } = await signIn({ email, password })
    setBusy(false)
    if (error) { setErr(error.message || 'Connexion impossible.'); return }
    nav('/')
  }

  return (
    <div className="screen no-nav">
      <form className="auth-wrap" onSubmit={submit}>
        <div className="auth-brand"><b>DART<span>180</span></b></div>
        <div className="auth-sub">Connexion à ton compte</div>

        <div className="field">
          <label>Email</label>
          <input className="input" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input className="input" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="form-error">{err}</div>

        <button className="btn primary" type="submit" disabled={busy}>{busy ? '…' : 'Se connecter'}</button>
        <p className="form-note">
          Pas encore de compte ? <a onClick={() => nav('/signup')} style={{ cursor: 'pointer' }}>S’inscrire</a>
        </p>
      </form>
    </div>
  )
}
