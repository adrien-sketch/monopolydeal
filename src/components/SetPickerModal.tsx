import type { PlayerState, PropertyColor } from '../game/types'
import { PROPERTY_COLORS } from '../game/types'
import { isSetComplete } from '../game/sets'
import { COLOR_NAMES } from '../game/constants'

interface SetPickerModalProps {
  targetPlayer: PlayerState
  onSelect: (color: PropertyColor) => void
}

export function SetPickerModal({ targetPlayer, onSelect }: SetPickerModalProps) {
  const completeSets = PROPERTY_COLORS.filter(c =>
    isSetComplete(c, targetPlayer.properties[c])
  )

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal__title">Deal Breaker — Choisissez un set complet</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {completeSets.map(color => (
            <button
              key={color}
              className="modal__btn modal__btn--primary"
              style={{ textAlign: 'left' }}
              onClick={() => onSelect(color)}
            >
              {COLOR_NAMES[color]} ({targetPlayer.properties[color].length} cartes)
              {targetPlayer.houses[color] > 0 && ' 🏠'}
              {targetPlayer.hotels[color] > 0 && ' 🏨'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
