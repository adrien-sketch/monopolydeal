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
      <div className="start-screen">
        <div className="start-screen__particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="start-screen__particle"
              style={{
                left: `${5 + (i * 4.7) % 90}%`,
                top: `${10 + (i * 7.3) % 80}%`,
                animationDelay: `${(i * 0.7) % 5}s`,
                animationDuration: `${4 + (i % 4)}s`,
                width: `${2 + (i % 3) * 2}px`,
                height: `${2 + (i % 3) * 2}px`,
              }}
            />
          ))}
        </div>

        <div className="start-screen__frame">
          <svg className="start-screen__corner start-screen__corner--tl" width="40" height="40" viewBox="0 0 40 40">
            <path d="M2 38 L2 2 L38 2" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <svg className="start-screen__corner start-screen__corner--tr" width="40" height="40" viewBox="0 0 40 40">
            <path d="M38 38 L38 2 L2 2" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <svg className="start-screen__corner start-screen__corner--bl" width="40" height="40" viewBox="0 0 40 40">
            <path d="M2 2 L2 38 L38 38" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <svg className="start-screen__corner start-screen__corner--br" width="40" height="40" viewBox="0 0 40 40">
            <path d="M38 2 L38 38 L2 38" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>

          <div className="start-screen__content">
            <div className="decorative-divider">
              <span className="decorative-divider__line" />
              <span className="decorative-divider__icon">&#9830;</span>
              <span className="decorative-divider__line" />
            </div>

            <h1 className="start-screen__title">
              <span className="start-screen__title-main">MONOPOLY</span>
              <span className="start-screen__title-sub">DEAL</span>
            </h1>

            <p className="start-screen__subtitle">1v1 contre un bot stratégique</p>

            <div className="decorative-divider">
              <span className="decorative-divider__line" />
              <span className="decorative-divider__icon">&#9830;</span>
              <span className="decorative-divider__line" />
            </div>

            <button className="start-screen__btn" onClick={handleStartGame}>
              <span>Jouer</span>
              <span className="start-screen__btn-glow" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'gameOver') {
    return (
      <div className={`end-screen ${playerWon ? 'end-screen--victory' : 'end-screen--defeat'}`}>
        {playerWon && (
          <div className="end-screen__confetti">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="end-screen__confetti-piece"
                style={{
                  left: `${(i * 3.3) % 100}%`,
                  animationDelay: `${(i * 0.2) % 3}s`,
                  animationDuration: `${2 + (i % 3)}s`,
                  backgroundColor: ['#00d4ff', '#a855f7', '#ec4899', '#84cc16', '#f97316', '#fbbf24'][i % 6],
                  width: `${4 + (i % 3) * 3}px`,
                  height: `${4 + (i % 3) * 3}px`,
                }}
              />
            ))}
          </div>
        )}

        <div className="end-screen__content">
          <div className="end-screen__icon">{playerWon ? '🏆' : '💀'}</div>
          <h1 className="end-screen__title">
            {playerWon ? 'Victoire !' : 'Défaite...'}
          </h1>
          <p className="end-screen__subtitle">
            {playerWon ? 'Vous avez complété 3 sets !' : 'Le bot a complété 3 sets avant vous.'}
          </p>
          <div className="decorative-divider">
            <span className="decorative-divider__line" />
            <span className="decorative-divider__icon">&#9830;</span>
            <span className="decorative-divider__line" />
          </div>
          <button className="start-screen__btn" onClick={handlePlayAgain}>
            <span>Rejouer</span>
            <span className="start-screen__btn-glow" />
          </button>
        </div>
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
