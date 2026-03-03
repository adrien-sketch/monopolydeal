import type { GameState, GameAction } from '../game/types'
import {
  createInitialState, drawCards, playCardAsBank, playProperty,
  playPassGo, playDebtCollector, playBirthday, playRent,
  playSlyDeal, playForcedDeal, playDealBreaker, playHouse, playHotel,
  resolveJustSayNo, resolvePayment, resolveSelectProperty,
  resolveSelectOwnProperty, resolveSelectSet, endTurn, resolveDiscard,
} from '../game/engine'

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return createInitialState(state.difficulty)

    case 'DRAW_CARDS':
      if (state.turnPhase !== 'draw') return state
      return drawCards(state)

    case 'PLAY_CARD_AS_MONEY': {
      if (state.turnPhase !== 'play') return state
      if (state.cardsPlayedThisTurn >= 3) return state
      return playCardAsBank(state, state.currentPlayer, action.cardId)
    }

    case 'PLAY_PROPERTY': {
      if (state.turnPhase !== 'play') return state
      if (state.cardsPlayedThisTurn >= 3) return state
      return playProperty(state, state.currentPlayer, action.cardId, action.color)
    }

    case 'PLAY_ACTION': {
      if (state.turnPhase !== 'play') return state
      if (state.cardsPlayedThisTurn >= 3) return state
      const card = state.players[state.currentPlayer].hand.find(c => c.id === action.cardId)
      if (!card || card.type !== 'action') return state

      switch (card.actionType) {
        case 'passGo': return playPassGo(state, state.currentPlayer, action.cardId)
        case 'debtCollector': return playDebtCollector(state, state.currentPlayer, action.cardId)
        case 'birthday': return playBirthday(state, state.currentPlayer, action.cardId)
        case 'slyDeal': return playSlyDeal(state, state.currentPlayer, action.cardId)
        case 'forcedDeal': return playForcedDeal(state, state.currentPlayer, action.cardId)
        case 'dealBreaker': return playDealBreaker(state, state.currentPlayer, action.cardId)
        default: return state
      }
    }

    case 'PLAY_RENT': {
      if (state.turnPhase !== 'play') return state
      if (state.cardsPlayedThisTurn >= 3) return state
      return playRent(state, state.currentPlayer, action.cardId, action.color, action.doubled, action.doubleCardId)
    }

    case 'PLAY_HOUSE': {
      if (state.turnPhase !== 'play') return state
      if (state.cardsPlayedThisTurn >= 3) return state
      return playHouse(state, state.currentPlayer, action.cardId, action.color)
    }

    case 'PLAY_HOTEL': {
      if (state.turnPhase !== 'play') return state
      if (state.cardsPlayedThisTurn >= 3) return state
      return playHotel(state, state.currentPlayer, action.cardId, action.color)
    }

    case 'PAY_DEBT':
      if (state.turnPhase !== 'payment') return state
      return resolvePayment(state, action.payments)

    case 'SELECT_PROPERTY':
      if (!state.pendingAction || state.pendingAction.type !== 'selectProperty') return state
      return resolveSelectProperty(state, action.cardId)

    case 'SELECT_OWN_PROPERTY':
      if (!state.pendingAction || state.pendingAction.type !== 'selectOwnProperty') return state
      return resolveSelectOwnProperty(state, action.cardId)

    case 'SELECT_SET':
      if (!state.pendingAction || state.pendingAction.type !== 'selectSet') return state
      return resolveSelectSet(state, action.color)

    case 'PLAY_JUST_SAY_NO':
      if (!state.pendingAction || state.pendingAction.type !== 'justSayNo') return state
      return resolveJustSayNo(state, true)

    case 'ACCEPT_ACTION':
      if (!state.pendingAction || state.pendingAction.type !== 'justSayNo') return state
      return resolveJustSayNo(state, false)

    case 'DISCARD_CARDS':
      if (state.turnPhase !== 'discard') return state
      return resolveDiscard(state, action.cardIds)

    case 'END_TURN':
      if (state.turnPhase !== 'play') return state
      return endTurn(state)

    default:
      return state
  }
}
