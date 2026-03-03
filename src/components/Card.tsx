import type { Card as CardType, PropertyColor } from '../game/types'
import { COLOR_NAMES, RENT_TABLE, SET_SIZES } from '../game/constants'
import '../styles/cards.css'

interface CardProps {
  card: CardType
  faceDown?: boolean
  small?: boolean
  selected?: boolean
  disabled?: boolean
  playable?: boolean
  disabledReason?: string
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

function getActionColor(actionType: string): string {
  const colors: Record<string, string> = {
    passGo: '#2E7D32',
    dealBreaker: '#1565C0',
    slyDeal: '#1565C0',
    forcedDeal: '#1565C0',
    debtCollector: '#2E7D32',
    birthday: '#C62828',
    justSayNo: '#C62828',
    doubleTheRent: '#E65100',
    house: '#2E7D32',
    hotel: '#C62828',
  }
  return colors[actionType] || '#1565C0'
}

function getRentBorderColor(card: CardType): string {
  if (card.colors?.length === 10) return '#E65100'
  if (card.colors && card.colors.length >= 1) {
    return `var(--color-${cssColorVar(card.colors[0])})`
  }
  return '#888'
}

export function Card({ card, faceDown, small, selected, disabled, playable, disabledReason, onClick, displayColor }: CardProps) {
  const isActionBorder = !faceDown && (card.type === 'action' || card.type === 'rent')
  const classes = [
    'card',
    faceDown && 'card--face-down',
    small && 'card--small',
    selected && 'card--selected',
    disabled && 'card--disabled',
    playable && 'card--playable',
    isActionBorder && 'card--action-border',
  ].filter(Boolean).join(' ')

  const cardStyle: React.CSSProperties = {}
  if (isActionBorder) {
    if (card.type === 'action') {
      cardStyle.borderColor = getActionColor(card.actionType!)
    } else if (card.type === 'rent') {
      cardStyle.borderColor = getRentBorderColor(card)
    }
  }

  if (faceDown) {
    return (
      <div className={classes} title="" style={cardStyle}>
        <div className="card__back">
          <div className="card__back-stripe">
            <span className="card__back-title">MONOPOLY</span>
            <span className="card__back-subtitle">DEAL</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={classes} onClick={disabled ? undefined : onClick} title={disabled && disabledReason ? disabledReason : card.name} style={cardStyle}>
      {card.type === 'property' && <PropertyCard card={card} displayColor={displayColor} small={small} />}
      {card.type === 'wildcard' && <WildcardCard card={card} displayColor={displayColor} small={small} />}
      {card.type === 'action' && <ActionCard card={card} small={small} />}
      {card.type === 'rent' && <RentCard card={card} small={small} />}
      {card.type === 'money' && <MoneyCard card={card} />}
    </div>
  )
}

function ValueBadge({ value }: { value: number }) {
  return <span className="card__badge">{value}M</span>
}

function SetIndicator({ color, setSize }: { color: PropertyColor; setSize: number }) {
  return (
    <div className="card__set-indicator">
      {Array.from({ length: setSize }, (_, i) => (
        <div
          key={i}
          className="card__set-dot"
          style={{ background: `var(--color-${cssColorVar(color)})` }}
        />
      ))}
    </div>
  )
}

function PropertyCard({ card, displayColor, small }: { card: CardType; displayColor?: PropertyColor; small?: boolean }) {
  const color = displayColor || card.color!
  const rentValues = RENT_TABLE[color]
  const setSize = SET_SIZES[color]
  return (
    <div className="card__inner card__inner--property">
      <div className="card__prop-header" style={{ background: `var(--color-${cssColorVar(color)})` }}>
        <span className="card__prop-name">{card.name.toUpperCase()}</span>
        <ValueBadge value={card.bankValue} />
      </div>
      {!small && (
        <div className="card__prop-body">
          <SetIndicator color={color} setSize={setSize} />
          <div className="card__rent-table">
            <div className="card__rent-header-row">
              <span>PROPRIÉTÉS</span>
              <span>LOYER</span>
            </div>
            {rentValues.map((rent, i) => (
              <div key={i} className={`card__rent-row ${i === rentValues.length - 1 ? 'card__rent-row--complete' : ''}`}>
                <span className="card__rent-count">{i + 1}</span>
                <span className="card__rent-amount">{rent}M</span>
              </div>
            ))}
          </div>
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
    return <PropertyCard card={{ ...card, name: 'Joker' }} displayColor={displayColor} small={small} />
  }
  if (isRainbow) {
    return (
      <div className="card__inner card__inner--wildcard-rainbow">
        <div className="card__wild-rainbow-header">PROPRIÉTÉ JOKER</div>
        <div className="card__body">
          <div className="card__rainbow-circle" />
          <span className="card__action-name">JOKER</span>
          <span className="card__action-desc">Peut être utilisé comme n'importe quelle propriété.</span>
        </div>
      </div>
    )
  }
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
  const actionColor = getActionColor(card.actionType!)
  return (
    <div className="card__inner card__inner--action">
      <div className="card__action-header" style={{ color: actionColor }}>CARTE ACTION</div>
      <ValueBadge value={card.bankValue} />
      <div className="card__body">
        <div className="card__action-circle" style={{ borderColor: actionColor, color: actionColor }}>
          <span className="card__action-icon">{getActionIcon(card.actionType!)}</span>
        </div>
        <span className="card__action-name" style={{ color: actionColor }}>{card.name.toUpperCase()}</span>
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
        <span className="card__money-amount">{card.bankValue}</span>
        <span className="card__money-m">MILLIONS</span>
      </div>
      <div className="card__money-corner-tl">{card.bankValue}M</div>
      <div className="card__money-corner-br">{card.bankValue}M</div>
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
