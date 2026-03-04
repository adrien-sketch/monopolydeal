import { useState } from 'react'
import type { PlayerState, PropertyColor, Difficulty } from '../game/types'
import { PROPERTY_COLORS } from '../game/types'
import { COLOR_NAMES, SET_SIZES } from '../game/constants'
import { isSetComplete, countCompleteSets, getTotalBankValue } from '../game/sets'
import { Card } from './Card'

function cssColorVar(color: PropertyColor): string {
  const map: Record<string, string> = {
    lightBlue: 'light-blue',
    darkBlue: 'dark-blue',
  }
  return map[color] || color
}

function getBankDenominations(bank: import('../game/types').Card[]) {
  const counts = new Map<number, number>()
  for (const card of bank) {
    counts.set(card.bankValue, (counts.get(card.bankValue) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([value, count]) => ({ value, count }))
}

interface BotSetsPanelProps {
  player: PlayerState
  difficulty: Difficulty
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Expert',
}

export function BotSetsPanel({ player, difficulty }: BotSetsPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const activeColors = PROPERTY_COLORS.filter(c => player.properties[c].length > 0)
  const completeSets = countCompleteSets(player)
  const totalProperties = activeColors.reduce((sum, c) => sum + player.properties[c].length, 0)

  return (
    <div className={`bot-panel ${expanded ? 'bot-panel--expanded' : ''}`}>
      {/* Header bar — always visible */}
      <button
        className="bot-panel__header"
        onClick={() => setExpanded(e => !e)}
        type="button"
      >
        <div className="bot-panel__header-left">
          <strong className="bot-panel__name">
            Monobot
            <span className="bot-panel__difficulty">({DIFFICULTY_LABELS[difficulty]})</span>
          </strong>
          <div className="bot-panel__stats">
            <span className="bot-panel__stat">
              <span className="bot-panel__stat-icon">🃏</span>
              {player.hand.length}
            </span>
            <span className="bot-panel__stat">
              <span className="bot-panel__stat-icon">🏘️</span>
              {totalProperties}
            </span>
            {completeSets > 0 && (
              <span className="bot-panel__stat bot-panel__stat--danger">
                <span className="bot-panel__stat-icon">⭐</span>
                {completeSets}/3
              </span>
            )}
            <span className="bot-panel__stat">
              <span className="bot-panel__stat-icon">💰</span>
              {getTotalBankValue(player)}M
            </span>
          </div>
        </div>
        <span className={`bot-panel__toggle ${expanded ? 'bot-panel__toggle--open' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="bot-panel__body">
          {/* Property sets — the key strategic info */}
          <div className="bot-panel__sets">
            {activeColors.length === 0 ? (
              <span className="bot-panel__empty">Aucune propriété</span>
            ) : (
              activeColors.map(color => {
                const cards = player.properties[color]
                const complete = isSetComplete(color, cards)
                return (
                  <div
                    key={color}
                    className={`bot-set ${complete ? 'bot-set--complete' : ''}`}
                  >
                    <div
                      className="bot-set__label"
                      style={{ background: `var(--color-${cssColorVar(color)})` }}
                    >
                      {COLOR_NAMES[color]}
                      <span className="bot-set__count">{cards.length}/{SET_SIZES[color]}</span>
                    </div>
                    <div className="bot-set__progress">
                      <div
                        className="bot-set__progress-fill"
                        style={{
                          width: `${(cards.length / SET_SIZES[color]) * 100}%`,
                          background: `var(--color-${cssColorVar(color)})`,
                        }}
                      />
                    </div>
                    <div className="bot-set__cards">
                      {cards.map(card => (
                        <div key={card.id} className="bot-set__card-wrapper">
                          <Card card={card} small displayColor={color} />
                        </div>
                      ))}
                    </div>
                    {player.houses[color] > 0 && <span className="bot-set__badge">🏠</span>}
                    {player.hotels[color] > 0 && <span className="bot-set__badge">🏨</span>}
                  </div>
                )
              })
            )}
          </div>

          {/* Bank */}
          <div className="bot-panel__bank">
            <span className="bank__label">Banque</span>
            <span className="bank__total">{getTotalBankValue(player)}M</span>
            {player.bank.length > 0 && (
              <div className="bank__denominations">
                {getBankDenominations(player.bank).map(({ value, count }) => (
                  <div key={value} className={`bank__denom bank__denom--${value}`}>
                    <span className="bank__denom-value">{value}M</span>
                    <span className="bank__denom-count">×{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
