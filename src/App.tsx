import { useState, useCallback } from 'react'
import { GameProvider } from './state/context'
import { GameBoard } from './components/GameBoard'
import type { Difficulty } from './game/types'
import './styles/layout.css'
import './App.css'

type Screen = 'start' | 'game' | 'gameOver'

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; stars: string; description: string }[] = [
  { value: 'beginner', label: 'Débutant', stars: '\u2605', description: 'Monobot prudent, coups simples' },
  { value: 'intermediate', label: 'Intermédiaire', stars: '\u2605\u2605', description: 'Monobot stratégique, bons réflexes' },
  { value: 'advanced', label: 'Expert', stars: '\u2605\u2605\u2605', description: 'Monobot expert, combos et anticipation' },
]

function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [playerWon, setPlayerWon] = useState(false)
  const [gameKey, setGameKey] = useState(0)
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')

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
        <div className="start-screen__bills">
          {Array.from({ length: 15 }).map((_, i) => {
            const denoms = ['1', '2', '3', '4', '5', '10']
            const d = denoms[i % denoms.length]
            return (
              <div
                key={i}
                className={`floating-bill floating-bill--${d}`}
                style={{
                  left: `${(i * 6.8 + 2) % 94}%`,
                  animationDelay: `${(i * 1.8) % 14}s`,
                  animationDuration: `${16 + (i * 1.5) % 12}s`,
                  '--bill-rotation': `${-25 + (i * 19) % 50}deg`,
                  '--bill-scale': `${0.7 + (i * 0.07) % 0.5}`,
                } as React.CSSProperties}
              >
                <span className="floating-bill__symbol">$</span>
                <span className="floating-bill__value">{d}M</span>
              </div>
            )
          })}
        </div>

        <div className="start-screen__content">
          <div className="start-screen__icon">
            <svg viewBox="0 0 100 80" className="start-screen__hat" aria-hidden="true">
              <ellipse cx="50" cy="72" rx="48" ry="8" fill="#1a1a1a" />
              <rect x="25" y="12" width="50" height="60" rx="3" fill="#1a1a1a" />
              <ellipse cx="50" cy="12" rx="25" ry="5" fill="#2a2a2a" />
              <rect x="25" y="52" width="50" height="9" fill="#E31837" />
              <text x="50" y="60" textAnchor="middle" fill="#FFC107" fontSize="8" fontWeight="bold" fontFamily="serif">$</text>
            </svg>
          </div>

          <h1 className="start-screen__title">
            <span className="start-screen__title-main">MONOPOLY</span>
            <span className="start-screen__title-sub">DEAL</span>
          </h1>

          <p className="start-screen__subtitle">Défie Monobot en 1v1 !</p>

          <div className="decorative-divider">
            <span className="decorative-divider__line" />
            <span className="decorative-divider__icon">&#9830;</span>
            <span className="decorative-divider__line" />
          </div>

          <div className="difficulty-selector">
            <p className="difficulty-selector__label">Difficulté de Monobot</p>
            <div className="difficulty-selector__options">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`difficulty-selector__btn difficulty-selector__btn--${opt.value}${difficulty === opt.value ? ' difficulty-selector__btn--active' : ''}`}
                  onClick={() => setDifficulty(opt.value)}
                >
                  <span className="difficulty-selector__btn-icon">{opt.stars}</span>
                  <span className="difficulty-selector__btn-label">{opt.label}</span>
                  <span className="difficulty-selector__btn-desc">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="start-screen__btn" onClick={handleStartGame}>
            <span>Jouer</span>
            <span className="start-screen__btn-glow" />
          </button>
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
            {playerWon ? 'Vous avez complété 3 sets !' : 'Monobot a complété 3 sets avant vous.'}
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
    <GameProvider key={gameKey} difficulty={difficulty}>
      <GameBoard onGameOver={handleGameOver} />
    </GameProvider>
  )
}

export default App
