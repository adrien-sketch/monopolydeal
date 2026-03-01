import { useState, useCallback } from 'react'
import { GameProvider } from './state/context'
import { GameBoard } from './components/GameBoard'
import './styles/layout.css'
import './App.css'

type Screen = 'start' | 'game' | 'gameOver'

function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [playerWon, setPlayerWon] = useState(false)
  const [gameKey, setGameKey] = useState(0)

  const handleStartGame = () => {
    setGameKey(k => k + 1)
    setScreen('game')
  }

  const handleGameOver = useCallback((won: boolean) => {
    setPlayerWon(won)
    setScreen('gameOver')
  }, [])

  const handlePlayAgain = () => {
    setGameKey(k => k + 1)
    setScreen('start')
  }

  if (screen === 'start') {
    return (
      <div className="screen-center">
        <h1 className="screen-center__title">Monopoly Deal</h1>
        <p className="screen-center__subtitle">Version FR - Refonte visuelle</p>
        <button className="screen-center__btn" onClick={handleStartGame}>
          Jouer
        </button>
      </div>
    )
  }

  if (screen === 'gameOver') {
    return (
      <div className="screen-center">
        <h1 className={`screen-center__title ${!playerWon ? 'screen-center__title--lose' : ''}`}>
          {playerWon ? 'Victoire !' : 'Défaite...'}
        </h1>
        <p className="screen-center__subtitle">
          {playerWon ? 'Vous avez complété 3 sets !' : 'Le bot a complété 3 sets avant vous.'}
        </p>
        <button className="screen-center__btn" onClick={handlePlayAgain}>
          Rejouer
        </button>
      </div>
    )
  }

  return (
    <GameProvider key={gameKey}>
      <GameBoard onGameOver={handleGameOver} />
    </GameProvider>
  )
}

export default App
