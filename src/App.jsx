import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth.jsx'
import { GameProvider } from './game/GameContext.jsx'
import Presence from './lib/presence.jsx'
import BottomNav from './components/BottomNav.jsx'
import GameFX from './components/game/GameFX.jsx'
import WinModal from './components/game/WinModal.jsx'
import Friends from './screens/Friends.jsx'
import Splash from './screens/Splash.jsx'
import Login from './screens/Login.jsx'
import Signup from './screens/Signup.jsx'
import Home from './screens/Home.jsx'
import Profile from './screens/Profile.jsx'
import Play from './screens/Play.jsx'
import Game from './screens/Game.jsx'
import Stats from './screens/Stats.jsx'
import History from './screens/History.jsx'

function Loading() {
  return (
    <div className="center-screen">
      <div><div className="spinner" />Chargement…</div>
    </div>
  )
}

function Protected({ children }) {
  const { isAuthed, loading } = useAuth()
  if (loading) return <Loading />
  if (!isAuthed) return <Navigate to="/welcome" replace />
  return children
}

const NAV_ROUTES = ['/', '/play', '/friends', '/stats', '/history', '/profile']

function AuthedApp() {
  const location = useLocation()
  const showNav = NAV_ROUTES.includes(location.pathname)
  return (
    <GameProvider>
      <Presence />
      <div id="app-root">
        <Routes>
          <Route path="/" element={<Protected><Home /></Protected>} />
          <Route path="/play" element={<Protected><Play /></Protected>} />
          <Route path="/game" element={<Protected><Game /></Protected>} />
          <Route path="/friends" element={<Protected><Friends /></Protected>} />
          <Route path="/stats" element={<Protected><Stats /></Protected>} />
          <Route path="/history" element={<Protected><History /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {showNav && <BottomNav />}
        <GameFX />
        <WinModal />
      </div>
    </GameProvider>
  )
}

export default function App() {
  const { loading, isAuthed, isDemo } = useAuth()
  if (loading) return <><div className="vignette" /><Loading /></>

  return (
    <>
      <div className="vignette" />
      {isDemo && <div className="demo-banner">⚠ Mode démo local — connecte Supabase pour activer les comptes & le multijoueur</div>}
      {isAuthed ? (
        <AuthedApp />
      ) : (
        <div id="app-root">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Splash />} />
          </Routes>
        </div>
      )}
    </>
  )
}
