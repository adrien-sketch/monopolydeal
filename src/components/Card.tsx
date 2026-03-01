import type { Card as CardType, PropertyColor } from '../game/types'
import { COLOR_NAMES, RENT_TABLE, SET_SIZES } from '../game/constants'
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

function cssColorVar(color: PropertyColor): string {
  const map: Record<string, string> = { lightBlue: 'light-blue', darkBlue: 'dark-blue' }
  return map[color] || color
}

const ACTION_DESCRIPTIONS: Record<string, string> = {
  passGo: 'Piochez 2 cartes.',
  dealBreaker: 'Réclamez un set complet !',
  slyDeal: 'Prenez une propriété du joueur de votre choix.',
  forcedDeal: 'Échangez une de vos propriétés avec celle d\'un autre joueur.',
  debtCollector: 'Un joueur doit vous payer 5M.',
  birthday: 'Chaque joueur doit vous payer 2M.',
  justSayNo: 'Annulez une action lancée contre vous.',
  doubleTheRent: 'Doublez le loyer demandé.',
  house: 'Ajoutez sur un set complet. +3M de loyer.',
  hotel: 'Ajoutez sur une maison. +4M de loyer.',
}

export function Card({ card, faceDown, small, selected, disabled, onClick, displayColor }: CardProps) {
  const classes = [
    'card',
    faceDown && 'card--face-down',
    small && 'card--small',
    selected && 'card--selected',
    disabled && 'card--disabled',
  ].filter(Boolean).join(' ')

  if (faceDown) {
    return (
      <div className={classes} title="">
        <div className="card__back">
          <span className="card__back-logo">M</span>
        </div>
      </div>
    )
  }

  return (
    <div className={classes} onClick={disabled ? undefined : onClick} title={card.name}>
      {card.type === 'property' && <PropertyCard card={card} displayColor={displayColor} small={small} />}
      {card.type === 'wildcard' && <WildcardCard card={card} displayColor={displayColor} small={small} />}
      {card.type === 'action' && <ActionCard card={card} small={small} />}
      {card.type === 'rent' && <RentCard card={card} small={small} />}
      {card.type === 'money' && <MoneyCard card={card} />}
    </div>
  )
}

function ValueBadge({ value }: { value: number }) {
  return <span className="card__badge">M{value}M</span>
}

function PropertyCard({ card, displayColor, small }: { card: CardType; displayColor?: PropertyColor; small?: boolean }) {
  const color = displayColor || card.color!
  const rentValues = RENT_TABLE[color]
  const setSize = SET_SIZES[color]
  return (
    <div className="card__inner card__inner--property">
      <div className="card__prop-header" style={{ background: `var(--color-${cssColorVar(color)})` }}>
        <ValueBadge value={card.bankValue} />
        <span className="card__prop-name">{card.name.toUpperCase()}</span>
      </div>
      {!small && (
        <div className="card__rent-table">
          <span className="card__rent-label">LOYER</span>
          {rentValues.map((rent, i) => (
            <div key={i} className={`card__rent-row ${i === rentValues.length - 1 ? 'card__rent-row--complete' : ''}`}>
              <span className="card__rent-count">{i + 1}</span>
              <span className="card__rent-amount">M{rent}M</span>
            </div>
          ))}
          {setSize === rentValues.length && (
            <span className="card__rent-complete">GROUPE COMPLET</span>
          )}
        </div>
      )}
      {small && (
        <div className="card__body-compact">
          <span className="card__mini-name">{card.name}</span>
        </div>
      )}
    </div>
  )
}

function WildcardCard({ card, displayColor, small }: { card: CardType; displayColor?: PropertyColor; small?: boolean }) {
  const isRainbow = card.colors?.length === 10
  if (displayColor) {
    // Displayed in a property set — look like a property card of that color
    return <PropertyCard card={{ ...card, name: 'Joker' }} displayColor={displayColor} small={small} />
  }
  if (isRainbow) {
    return (
      <div className="card__inner card__inner--wildcard-rainbow">
        <div className="card__action-header">PROPRIÉTÉ JOKER</div>
        <div className="card__body">
          <div className="card__rainbow-circle" />
          <span className="card__action-name">JOKER</span>
          <span className="card__action-desc">Peut être utilisé comme n'importe quelle propriété.</span>
        </div>
      </div>
    )
  }
  // Dual-color wildcard
  const [color1, color2] = card.colors || []
  return (
    <div className="card__inner card__inner--wildcard-dual">
      {card.bankValue > 0 && <ValueBadge value={card.bankValue} />}
      <div className="card__wild-split">
        <div className="card__wild-half" style={{ background: `var(--color-${cssColorVar(color1)})` }}>
          <span>{COLOR_NAMES[color1]}</span>
        </div>
        <div className="card__wild-half" style={{ background: `var(--color-${cssColorVar(color2)})` }}>
          <span>{COLOR_NAMES[color2]}</span>
        </div>
      </div>
      <div className="card__wild-label">PROPRIÉTÉ JOKER</div>
    </div>
  )
}

function ActionCard({ card, small }: { card: CardType; small?: boolean }) {
  return (
    <div className="card__inner card__inner--action">
      <div className="card__action-header">CARTE ACTION</div>
      <ValueBadge value={card.bankValue} />
      <div className="card__body">
        <div className="card__action-circle">
          <span className="card__action-icon">{getActionIcon(card.actionType!)}</span>
        </div>
        <span className="card__action-name">{card.name.toUpperCase()}</span>
        {!small && card.actionType && (
          <span className="card__action-desc">{ACTION_DESCRIPTIONS[card.actionType]}</span>
        )}
      </div>
    </div>
  )
}

function RentCard({ card, small }: { card: CardType; small?: boolean }) {
  const isMulticolor = card.colors?.length === 10
  return (
    <div className="card__inner card__inner--action">
      <div className="card__action-header">CARTE ACTION</div>
      <ValueBadge value={card.bankValue} />
      <div className="card__body">
        {isMulticolor ? (
          <div className="card__rainbow-circle" />
        ) : (
          <div className="card__rent-circle">
            <div className="card__rent-half" style={{ background: `var(--color-${cssColorVar(card.colors![0])})` }} />
            <div className="card__rent-half" style={{ background: `var(--color-${cssColorVar(card.colors![1])})` }} />
          </div>
        )}
        <span className="card__action-name">{isMulticolor ? 'LOYER MULTICOLORE' : 'LOYER'}</span>
        {!small && (
          <span className="card__action-desc">
            {isMulticolor ? 'Demandez le loyer pour n\'importe quelle couleur.' : `Demandez le loyer ${COLOR_NAMES[card.colors![0]]} ou ${COLOR_NAMES[card.colors![1]]}.`}
          </span>
        )}
      </div>
    </div>
  )
}

function MoneyCard({ card }: { card: CardType }) {
  const moneyClass = `card__inner--money-${Math.min(card.bankValue, 10)}`
  return (
    <div className={`card__inner card__inner--money ${moneyClass}`}>
      <div className="card__money-value">
        <span className="card__money-m">M</span>
        <span className="card__money-amount">{card.bankValue}M</span>
      </div>
      <div className="card__money-corner-tl">M{card.bankValue}M</div>
      <div className="card__money-corner-br">M{card.bankValue}M</div>
    </div>
  )
}

function getActionIcon(actionType: string): string {
  const icons: Record<string, string> = {
    passGo: '→',
    dealBreaker: '!',
    slyDeal: '★',
    forcedDeal: '⇄',
    debtCollector: '$',
    birthday: '♥',
    justSayNo: '✋',
    doubleTheRent: '×2',
    house: '⌂',
    hotel: 'H',
  }
  return icons[actionType] || '?'
}
