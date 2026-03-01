import type { Card as CardType, PropertyColor } from '../game/types'
import { COLOR_NAMES } from '../game/constants'
import '../styles/cards.css'

interface CardProps {
  card: CardType
  faceDown?: boolean
  small?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  displayColor?: PropertyColor
}

const ACTION_ICONS: Record<string, string> = {
  passGo: '🎯',
  dealBreaker: '💥',
  slyDeal: '🦊',
  forcedDeal: '🔄',
  debtCollector: '💰',
  birthday: '🎂',
  justSayNo: '🚫',
  doubleTheRent: '⬆️',
  house: '🏠',
  hotel: '🏨',
}

export function Card({ card, faceDown, small, selected, disabled, onClick, displayColor }: CardProps) {
  const classes = [
    'card',
    faceDown && 'card--face-down',
    small && 'card--small',
    selected && 'card--selected',
    disabled && 'card--disabled',
    card.type === 'money' && 'card--money',
    card.type === 'action' && 'card--action',
    card.type === 'rent' && 'card--rent',
    card.type === 'wildcard' && 'card--wildcard',
    (card.type === 'property' || displayColor) && `card--color-${displayColor || card.color}`,
  ].filter(Boolean).join(' ')

  const headerText = getHeaderText(card)

  return (
    <div className={classes} onClick={disabled ? undefined : onClick} title={card.name}>
      <div className="card__inner">
        <div className="card__header">{headerText}</div>
        <div className="card__body">
          {card.type === 'action' && card.actionType && (
            <span className="card__icon">{ACTION_ICONS[card.actionType] || '⚡'}</span>
          )}
          {card.type === 'money' && (
            <span className="card__icon">💵</span>
          )}
          {card.type === 'rent' && (
            <span className="card__icon">🏷️</span>
          )}
          <span className="card__name">{card.name}</span>
        </div>
        {card.bankValue > 0 && (
          <span className="card__value">{card.bankValue}M</span>
        )}
      </div>
    </div>
  )
}

function getHeaderText(card: CardType): string {
  switch (card.type) {
    case 'property': return COLOR_NAMES[card.color!] || card.color || ''
    case 'money': return 'Argent'
    case 'action': return card.actionType === 'justSayNo' ? 'Défense' : 'Action'
    case 'rent': return card.colors?.length === 10 ? 'Loyer ★' : 'Loyer'
    case 'wildcard': return card.colors?.length === 10 ? 'Joker ★' : 'Joker'
    default: return ''
  }
}
