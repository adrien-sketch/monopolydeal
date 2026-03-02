// ===== Property Colors =====
export const PROPERTY_COLORS = [
  'brown', 'lightBlue', 'pink', 'orange', 'red',
  'yellow', 'green', 'darkBlue', 'railroad', 'utility',
] as const

export type PropertyColor = (typeof PROPERTY_COLORS)[number]

// ===== Card Types =====
export type CardType = 'property' | 'money' | 'action' | 'rent' | 'wildcard'

export type ActionType =
  | 'passGo'
  | 'dealBreaker'
  | 'slyDeal'
  | 'forcedDeal'
  | 'debtCollector'
  | 'birthday'
  | 'justSayNo'
  | 'doubleTheRent'
  | 'house'
  | 'hotel'

// ===== Card =====
export interface Card {
  id: string
  type: CardType
  name: string
  bankValue: number
  color?: PropertyColor
  colors?: PropertyColor[]
  actionType?: ActionType
  currentColor?: PropertyColor
}

// ===== Player =====
export type PlayerId = 'human' | 'bot'

export interface PlayerState {
  id: PlayerId
  hand: Card[]
  bank: Card[]
  properties: Record<PropertyColor, Card[]>
  houses: Record<PropertyColor, number>
  hotels: Record<PropertyColor, number>
}

// ===== Pending Actions =====
export type PendingAction =
  | PayDebtAction
  | SelectPropertyAction
  | SelectSetAction
  | SelectColorAction
  | JustSayNoAction
  | DiscardAction
  | SelectRentColorAction
  | SelectOwnPropertyAction

export interface PayDebtAction {
  type: 'payDebt'
  debtor: PlayerId
  creditor: PlayerId
  amount: number
  reason: string
}

export interface SelectPropertyAction {
  type: 'selectProperty'
  player: PlayerId
  targetPlayer: PlayerId
  purpose: 'slyDeal' | 'forcedDeal-take'
}

export interface SelectOwnPropertyAction {
  type: 'selectOwnProperty'
  player: PlayerId
  purpose: 'forcedDeal-give'
  takenCard: Card
}

export interface SelectSetAction {
  type: 'selectSet'
  player: PlayerId
  targetPlayer: PlayerId
  purpose: 'dealBreaker'
}

export interface SelectColorAction {
  type: 'selectColor'
  player: PlayerId
  cardId: string
  purpose: 'wildcard'
}

export interface SelectRentColorAction {
  type: 'selectRentColor'
  player: PlayerId
  cardId: string
  colors: PropertyColor[]
  doubled: boolean
}

export interface JustSayNoAction {
  type: 'justSayNo'
  challenger: PlayerId
  target: PlayerId
  originalAction: PendingAction
  depth: number
}

export interface DiscardAction {
  type: 'discard'
  player: PlayerId
  mustDiscardCount: number
}

// ===== Turn =====
export type TurnPhase = 'draw' | 'play' | 'discard' | 'actionResponse' | 'payment' | 'gameOver'

// ===== Log =====
export interface LogEntry {
  player: PlayerId
  message: string
}

// ===== Game State =====
export interface GameState {
  players: Record<PlayerId, PlayerState>
  drawPile: Card[]
  discardPile: Card[]
  currentPlayer: PlayerId
  turnPhase: TurnPhase
  cardsPlayedThisTurn: number
  pendingAction: PendingAction | null
  winner: PlayerId | null
  actionLog: LogEntry[]
  turnNumber: number
}

// ===== Game Actions (for reducer) =====
export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'DRAW_CARDS' }
  | { type: 'PLAY_CARD_AS_MONEY'; cardId: string }
  | { type: 'PLAY_PROPERTY'; cardId: string; color: PropertyColor }
  | { type: 'PLAY_ACTION'; cardId: string }
  | { type: 'PLAY_RENT'; cardId: string; color: PropertyColor; doubled: boolean; doubleCardId?: string }
  | { type: 'PLAY_HOUSE'; cardId: string; color: PropertyColor }
  | { type: 'PLAY_HOTEL'; cardId: string; color: PropertyColor }
  | { type: 'PAY_DEBT'; payments: { cardId: string; source: 'bank' | PropertyColor }[] }
  | { type: 'SELECT_PROPERTY'; cardId: string }
  | { type: 'SELECT_OWN_PROPERTY'; cardId: string }
  | { type: 'SELECT_SET'; color: PropertyColor }
  | { type: 'SELECT_RENT_COLOR'; color: PropertyColor }
  | { type: 'SELECT_WILDCARD_COLOR'; color: PropertyColor }
  | { type: 'PLAY_JUST_SAY_NO' }
  | { type: 'ACCEPT_ACTION' }
  | { type: 'DISCARD_CARDS'; cardIds: string[] }
  | { type: 'END_TURN' }
  | { type: 'BOT_MOVE' }
