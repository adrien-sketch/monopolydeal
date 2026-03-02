import type { PlayerState, PropertyColor } from '../game/types'
import { PROPERTY_COLORS } from '../game/types'
import { COLOR_NAMES, SET_SIZES } from '../game/constants'
import { isSetComplete, getTotalBankValue } from '../game/sets'
import { Card } from './Card'

interface PlayerAreaProps {
  player: PlayerState
  isOpponent?: boolean
}

export function PlayerArea({ player, isOpponent }: PlayerAreaProps) {
  const activeColors = PROPERTY_COLORS.filter(c => player.properties[c].length > 0)

  return (
    <div className="player-area__layout">
      {/* Property sets */}
      <div className="property-area">
        {activeColors.map(color => {
          const cards = player.properties[color]
          const complete = isSetComplete(color, cards)
          return (
            <div key={color} className={`property-set ${complete ? 'property-set__complete' : ''}`}>
              <div className="property-set__label" style={{ background: `var(--color-${cssColorVar(color)})` }}>
                {COLOR_NAMES[color]} {cards.length}/{SET_SIZES[color]}
              </div>
              <div className="property-set__cards">
                {cards.map(card => (
                  <Card key={card.id} card={card} small displayColor={color} />
                ))}
              </div>
              {player.houses[color] > 0 && <span className="property-set__badge">🏠</span>}
              {player.hotels[color] > 0 && <span className="property-set__badge">🏨</span>}
            </div>
          )
        })}
        {activeColors.length === 0 && (
          <span className="property-area__empty">Pas de propriétés</span>
        )}
      </div>

      {/* Bank */}
      <div className="bank">
        <span className="bank__label">Banque</span>
        <span className="bank__total">{getTotalBankValue(player)}M</span>
        {!isOpponent && player.bank.length > 0 && (
          <div className="bank__cards">
            {player.bank.slice(-5).map(card => (
              <Card key={card.id} card={card} small />
            ))}
            {player.bank.length > 5 && (
              <span className="bank__overflow">+{player.bank.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function cssColorVar(color: PropertyColor): string {
  const map: Record<string, string> = {
    lightBlue: 'light-blue',
    darkBlue: 'dark-blue',
  }
  return map[color] || color
}
