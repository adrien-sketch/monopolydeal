import type { GameAnalysis } from '../game/analysis'

interface GameTipsProps {
  analysis: GameAnalysis
  playerWon: boolean
  onPlayAgain: () => void
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Exceptionnel !'
  if (score >= 70) return 'Bien joué !'
  if (score >= 50) return 'Pas mal'
  if (score >= 30) return 'Peut mieux faire'
  return 'À travailler'
}

export function GameTips({ analysis, playerWon, onPlayAgain }: GameTipsProps) {
  const positiveTips = analysis.tips.filter(t => t.type === 'positive')
  const improvementTips = analysis.tips.filter(t => t.type === 'improvement')
  const scoreColor = getScoreColor(analysis.score)

  return (
    <div className={`tips-screen ${playerWon ? 'end-screen--victory' : 'end-screen--defeat'}`}>
      <div className="tips-content">
        <h1 className="tips-title">Analyse de ta partie</h1>

        <div className="tips-score" style={{ borderColor: scoreColor }}>
          <span className="tips-score__value" style={{ color: scoreColor }}>{analysis.score}</span>
          <span className="tips-score__label">/100</span>
        </div>
        <p className="tips-score__text" style={{ color: scoreColor }}>{getScoreLabel(analysis.score)}</p>

        {positiveTips.length > 0 && (
          <div className="tips-section">
            <h2 className="tips-section__title tips-section__title--positive">Bien joué</h2>
            <div className="tips-list">
              {positiveTips.map((tip, i) => (
                <div key={i} className="tip-card tip-card--positive">
                  <span className="tip-card__icon">{tip.icon}</span>
                  <span className="tip-card__text">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {improvementTips.length > 0 && (
          <div className="tips-section">
            <h2 className="tips-section__title tips-section__title--improvement">À améliorer</h2>
            <div className="tips-list">
              {improvementTips.map((tip, i) => (
                <div key={i} className="tip-card tip-card--improvement">
                  <span className="tip-card__icon">{tip.icon}</span>
                  <span className="tip-card__text">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="start-screen__btn" onClick={onPlayAgain}>
          <span>Rejouer</span>
          <span className="start-screen__btn-glow" />
        </button>
      </div>
    </div>
  )
}
