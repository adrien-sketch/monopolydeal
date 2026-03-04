import type { PlayerState, Difficulty, PlayerId } from '../game/types'
import { PROPERTY_COLORS } from '../game/types'
import { COLOR_NAMES, SET_SIZES } from '../game/constants'
import { isSetComplete, countCompleteSets, getTotalBankValue } from '../game/sets'
import { cssColorVar, getBankDenominations } from '../game/utils'
import { Card } from './Card'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Expert',
}

interface PlayerPanelProps {
  player: PlayerState
  playerId: PlayerId
  playerName: string
  difficulty?: Difficulty
  accentColor: 'green' | 'red'
  transferredCardIds?: Set<string>
}

export function PlayerPanel({
  player,
  playerId,
  playerName,
  difficulty,
  accentColor,
  transferredCardIds,
}: PlayerPanelProps) {
  const activeColors = PROPERTY_COLORS.filter(c => player.properties[c].length > 0)
  const completeSets = countCompleteSets(player)
  const totalProperties = activeColors.reduce((sum, c) => sum + player.properties[c].length, 0)
  const bankTotal = getTotalBankValue(player)

  return (
    <div
      className={`player-panel player-panel--${accentColor}`}
      data-player={playerId}
    >
      {/* Header — always visible */}
      <div className="player-panel__header">
        <div className="player-panel__identity">
          <span className="player-panel__name">{playerName}</span>
          {difficulty && (
            <span className="player-panel__subtitle">({DIFFICULTY_LABELS[difficulty]})</span>
          )}
        </div>
        <div className="player-panel__stats">
          <span className="player-panel__stat">
            <span className="player-panel__stat-icon">🃏</span>
            {player.hand.length}
          </span>
          <span className="player-panel__stat">
            <span className="player-panel__stat-icon">🏘️</span>
            {totalProperties}
          </span>
          {completeSets > 0 && (
            <span className="player-panel__stat player-panel__stat--danger">
              <span className="player-panel__stat-icon">⭐</span>
              {completeSets}/3
            </span>
          )}
          <span className="player-panel__stat">
            <span className="player-panel__stat-icon">💰</span>
            {bankTotal}M
          </span>
        </div>
      </div>

      {/* Body — properties + bank, always visible */}
      <div className="player-panel__body">
        {/* Property sets */}
        <div className="player-panel__sets">
          {activeColors.length === 0 ? (
            <span className="player-panel__empty">Aucune propriété</span>
          ) : (
            activeColors.map(color => {
              const cards = player.properties[color]
              const complete = isSetComplete(color, cards)
              return (
                <div
                  key={color}
                  className={`player-panel__set ${complete ? 'player-panel__set--complete' : ''}`}
                >
                  <div
                    className="player-panel__set-label"
                    style={{ background: `var(--color-${cssColorVar(color)})` }}
                  >
                    {COLOR_NAMES[color]}
                    <span className="player-panel__set-count">
                      {cards.length}/{SET_SIZES[color]}
                    </span>
                  </div>
                  <div className="player-panel__set-progress">
                    <div
                      className="player-panel__set-progress-fill"
                      style={{
                        width: `${(cards.length / SET_SIZES[color]) * 100}%`,
                        background: `var(--color-${cssColorVar(color)})`,
                      }}
                    />
                  </div>
                  <div className="player-panel__set-cards">
                    {cards.map(card => (
                      <div
                        key={card.id}
                        className={`player-panel__card-wrapper ${
                          transferredCardIds?.has(card.id) ? 'player-panel__card--transferred' : ''
                        }`}
                      >
                        <Card card={card} small displayColor={color} />
                      </div>
                    ))}
                  </div>
                  {player.houses[color] > 0 && <span className="player-panel__badge">🏠</span>}
                  {player.hotels[color] > 0 && <span className="player-panel__badge">🏨</span>}
                </div>
              )
            })
          )}
        </div>

        {/* Bank */}
        <div className="player-panel__bank">
          <span className="player-panel__bank-label">Banque</span>
          <span className="player-panel__bank-total">{bankTotal}M</span>
          {player.bank.length > 0 && (
            <div className="player-panel__bank-denoms">
              {getBankDenominations(player.bank).map(({ value, count }) => (
                <div key={value} className={`player-panel__denom player-panel__denom--${value}`}>
                  <span className="player-panel__denom-value">{value}M</span>
                  <span className="player-panel__denom-count">×{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
