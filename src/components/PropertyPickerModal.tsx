import type { PlayerState } from '../game/types'
import { PROPERTY_COLORS } from '../game/types'
import { isSetComplete } from '../game/sets'
import { Card } from './Card'

interface PropertyPickerModalProps {
  targetPlayer: PlayerState
  purpose: string
  onSelect: (cardId: string) => void
  title?: string
}

export function PropertyPickerModal({ targetPlayer, purpose, onSelect, title }: PropertyPickerModalProps) {
  const displayTitle = title || (purpose === 'slyDeal'
    ? 'Choisissez une propriété à voler'
    : 'Choisissez une propriété adverse')

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal__title">{displayTitle}</h3>
        {PROPERTY_COLORS.filter(c => targetPlayer.properties[c].length > 0).map(color => {
          const complete = isSetComplete(color, targetPlayer.properties[color])
          const canSteal = purpose === 'forcedDeal-give' || !complete
          return (
            <div key={color} style={{ marginBottom: '12px', opacity: canSteal ? 1 : 0.4 }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '4px' }}>{color} {complete && '(complet)'}</h4>
              <div className="selectable-cards">
                {targetPlayer.properties[color].map(card => (
                  <Card
                    key={card.id}
                    card={card}
                    small
                    disabled={!canSteal}
                    displayColor={color}
                    onClick={() => canSteal && onSelect(card.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
