import { Navigate } from 'react-router-dom'
import { useGame } from '../game/GameContext.jsx'
import { getMode } from '../game/engine/registry.js'
import DartGame from '../components/game/DartGame.jsx'
import BarGame from '../components/game/BarGame.jsx'

export default function Game() {
  const { game } = useGame()
  if (!game) return <Navigate to="/play" replace />
  const mode = getMode(game.mode)
  return mode.custom ? <BarGame /> : <DartGame />
}
