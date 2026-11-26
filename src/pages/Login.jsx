import { useEffect, useState } from 'react'
import { Film, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMovies } from '../context/MovieContext'

export default function Login() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { authenticate, authError, clearAuthError, user } = useMovies()
  const navigate = useNavigate()
  const next = params.get('next')
  const destination = next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : '/profile'

  useEffect(() => {
    if (user) navigate(destination, { replace: true })
  }, [user, navigate, destination])
  if (user) return null

  const selectMode = value => {
    setMode(value)
    clearAuthError()
  }

  const submit = async event => {
    event.preventDefault()
    setSubmitting(true)
    const success = await authenticate(mode === 'register' ? 'register' : 'login', {
      email,
      password,
      ...(mode === 'register' ? { displayName } : {}),
    })
    setSubmitting(false)
    if (success) navigate(destination, { replace: true })
  }

  return <main className="auth-page">
    <div className="auth-ambient"/>
    <section className="auth-card">
      <Link to="/" className="brand auth-brand"><span className="brand-mark"><Film size={19}/></span><span>MOVIE<span>EXPLORER</span></span></Link>
      <span className="auth-eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THE COMMUNITY'}</span>
      <h1>{mode === 'login' ? 'Your next favorite awaits.' : 'Make it your movie night.'}</h1>
      <p className="auth-intro">{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Create an account to keep your favorites and watchlist in sync.'}</p>
      <div className="auth-tabs">
        <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => selectMode('login')}>Sign in</button>
        <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => selectMode('register')}>Create account</button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <label>Your name<div className="auth-input"><UserRound size={17}/><input autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="How should we call you?" required maxLength={60}/></div></label>}
        <label>Email address<div className="auth-input"><Mail size={17}/><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required maxLength={254}/></div></label>
        <label>Password<div className="auth-input"><LockKeyhole size={17}/><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" required minLength={8} maxLength={128}/></div></label>
        {authError && <p className="auth-error" role="alert">{authError}</p>}
        <button className="primary-button auth-submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="auth-privacy">Your saved movies are private to your account.</p>
      <Link className="auth-back" to="/">← Back to discovering</Link>
    </section>
  </main>
}
