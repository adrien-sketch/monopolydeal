import type { GameState, PlayerId, PropertyColor, GameAction } from './types'
import { PROPERTY_COLORS } from './types'
import { SET_SIZES } from './constants'
import { isSetComplete, countCompleteSets, getRentAmount, getTotalBankValue, hasJustSayNo } from './sets'
import {
  cloneState, getOpponent, playCardAsBank, playProperty,
  playPassGo, playDebtCollector, playBirthday, playRent,
  playSlyDeal, playForcedDeal, playDealBreaker, playHouse, playHotel,
  getStealableProperties, getPlayerCompleteSets, getHouseableColors, getHotelableColors,
} from './engine'

// ===== State Evaluation =====
export function evaluateState(state: GameState, player: PlayerId): number {
  const me = state.players[player]
  const opp = state.players[getOpponent(player)]
  let score = 0

  // Complete sets (most important)
  const mySets = countCompleteSets(me)
  score += mySets * 1000
  if (mySets >= 3) score += 100000

  // Progress toward sets
  for (const color of PROPERTY_COLORS) {
    const count = me.properties[color].length
    const needed = SET_SIZES[color]
    if (count > 0 && count < needed) {
      if (count === needed - 1) score += 200 // One away
      else score += count * 50
    }
    // House/hotel bonus
    if (me.houses[color]) score += 80
    if (me.hotels[color]) score += 100
  }

  // Bank value (minor)
  score += getTotalBankValue(me)

  // Defensive cards
  const jsnCount = me.hand.filter(c => c.type === 'action' && c.actionType === 'justSayNo').length
  score += jsnCount * 80

  // Opponent threats
  const oppSets = countCompleteSets(opp)
  score -= oppSets * 300
  if (oppSets >= 3) score -= 100000

  for (const color of PROPERTY_COLORS) {
    const count = opp.properties[color].length
    const needed = SET_SIZES[color]
    if (count === needed - 1 && count > 0) score -= 150
  }

  return score
}

// ===== Bot Move Types =====
interface BotMove {
  action: GameAction
  score: number
  apply: (state: GameState) => GameState
}

// ===== Enumerate possible moves =====
function enumerateMoves(state: GameState): BotMove[] {
  const moves: BotMove[] = []
  const player = state.players.bot
  const opponent = state.players[getOpponent('bot')]

  for (const card of player.hand) {
    // Play as money (any card)
    moves.push({
      action: { type: 'PLAY_CARD_AS_MONEY', cardId: card.id },
      score: 0,
      apply: (s) => playCardAsBank(s, 'bot', card.id),
    })

    if (card.type === 'property') {
      moves.push({
        action: { type: 'PLAY_PROPERTY', cardId: card.id, color: card.color! },
        score: 0,
        apply: (s) => playProperty(s, 'bot', card.id, card.color!),
      })
    }

    if (card.type === 'wildcard' && card.colors) {
      for (const color of card.colors) {
        moves.push({
          action: { type: 'PLAY_PROPERTY', cardId: card.id, color },
          score: 0,
          apply: (s) => playProperty(s, 'bot', card.id, color),
        })
      }
    }

    if (card.type === 'action') {
      switch (card.actionType) {
        case 'passGo':
          moves.push({
            action: { type: 'PLAY_ACTION', cardId: card.id },
            score: 0,
            apply: (s) => playPassGo(s, 'bot', card.id),
          })
          break
        case 'debtCollector':
          moves.push({
            action: { type: 'PLAY_ACTION', cardId: card.id },
            score: 0,
            apply: (s) => playDebtCollector(s, 'bot', card.id),
          })
          break
        case 'birthday':
          moves.push({
            action: { type: 'PLAY_ACTION', cardId: card.id },
            score: 0,
            apply: (s) => playBirthday(s, 'bot', card.id),
          })
          break
        case 'slyDeal': {
          const stealable = getStealableProperties(opponent)
          if (stealable.length > 0) {
            moves.push({
              action: { type: 'PLAY_ACTION', cardId: card.id },
              score: 0,
              apply: (s) => playSlyDeal(s, 'bot', card.id),
            })
          }
          break
        }
        case 'forcedDeal': {
          const stealable = getStealableProperties(opponent)
          const hasOwn = PROPERTY_COLORS.some(c => player.properties[c].length > 0)
          if (stealable.length > 0 && hasOwn) {
            moves.push({
              action: { type: 'PLAY_ACTION', cardId: card.id },
              score: 0,
              apply: (s) => playForcedDeal(s, 'bot', card.id),
            })
          }
          break
        }
        case 'dealBreaker': {
          const completeSets = getPlayerCompleteSets(opponent)
          if (completeSets.length > 0) {
            moves.push({
              action: { type: 'PLAY_ACTION', cardId: card.id },
              score: 0,
              apply: (s) => playDealBreaker(s, 'bot', card.id),
            })
          }
          break
        }
        case 'house': {
          const houseColors = getHouseableColors(player)
          for (const color of houseColors) {
            moves.push({
              action: { type: 'PLAY_HOUSE', cardId: card.id, color },
              score: 0,
              apply: (s) => playHouse(s, 'bot', card.id, color),
            })
          }
          break
        }
        case 'hotel': {
          const hotelColors = getHotelableColors(player)
          for (const color of hotelColors) {
            moves.push({
              action: { type: 'PLAY_HOTEL', cardId: card.id, color },
              score: 0,
              apply: (s) => playHotel(s, 'bot', card.id, color),
            })
          }
          break
        }
        // justSayNo and doubleTheRent are reactive cards, not proactively played
      }
    }

    if (card.type === 'rent' && card.colors) {
      for (const color of card.colors) {
        if (player.properties[color].length > 0) {
          moves.push({
            action: { type: 'PLAY_RENT', cardId: card.id, color, doubled: false },
            score: 0,
            apply: (s) => playRent(s, 'bot', card.id, color, false),
          })
        }
      }
    }
  }

  return moves
}

// ===== Compute best bot turn =====
export function computeBotTurn(state: GameState): GameAction[] {
  const actions: GameAction[] = []
  let simState = cloneState(state)

  for (let play = 0; play < 3; play++) {
    if (simState.cardsPlayedThisTurn >= 3) break
    if (simState.players.bot.hand.length === 0) break

    const moves = enumerateMoves(simState)
    if (moves.length === 0) break

    const baseLine = evaluateState(simState, 'bot')

    // Score each move
    let bestMove: BotMove | null = null
    let bestScore = -Infinity

    for (const move of moves) {
      const resultState = move.apply(cloneState(simState))
      let delta = evaluateState(resultState, 'bot') - baseLine

      // Bonuses for action cards (pending actions don't show in state evaluation)
      if (move.action.type === 'PLAY_ACTION') {
        const card = simState.players.bot.hand.find(c => c.id === (move.action as { cardId: string }).cardId)
        if (card?.actionType === 'passGo' && play === 0) delta += 50
        if (card?.actionType === 'dealBreaker') delta += 500 // Stealing a complete set is huge
        if (card?.actionType === 'slyDeal') delta += 100
        if (card?.actionType === 'debtCollector') delta += 80
        if (card?.actionType === 'birthday') delta += 40
        if (card?.actionType === 'forcedDeal') delta += 60

        // Penalty if opponent likely has JSN
        if (card?.actionType && ['dealBreaker', 'slyDeal', 'forcedDeal', 'debtCollector', 'birthday'].includes(card.actionType)) {
          if (hasJustSayNo(simState.players.human)) {
            delta -= 30
          }
        }
      }
      if (move.action.type === 'PLAY_RENT') delta += 60

      if (delta > bestScore) {
        bestScore = delta
        bestMove = move
      }
    }

    // Only play if move has positive value (or it's the first play and we have no better option)
    if (bestMove && bestScore > -10) {
      actions.push(bestMove.action)
      simState = bestMove.apply(cloneState(simState))

      // If the action creates a pending action (rent, steal, etc.), stop here
      if (simState.pendingAction) break
    } else {
      break
    }
  }

  return actions
}

// ===== Bot decisions for reactive situations =====
export function shouldBotPlayJustSayNo(state: GameState): boolean {
  const pending = state.pendingAction
  if (!pending) return false

  const bot = state.players.bot
  if (!hasJustSayNo(bot)) return false

  if (pending.type === 'justSayNo') {
    const original = pending.originalAction

    // Always protect against Deal Breaker
    if (original.type === 'selectSet') return true

    // Protect near-complete or complete sets from Sly Deal
    if (original.type === 'selectProperty') return true

    // Pay debt > 5M — worth blocking
    if (original.type === 'payDebt' && original.amount >= 5) return true

    // Otherwise, accept smaller charges
    return false
  }

  return false
}

// ===== Bot selects which property to steal (Sly Deal) =====
export function botSelectPropertyToSteal(state: GameState): { cardId: string; color: PropertyColor } | null {
  const opponent = state.players.human
  const bot = state.players.bot
  const stealable = getStealableProperties(opponent)
  if (stealable.length === 0) return null

  // Score each stealable property
  let best: { cardId: string; color: PropertyColor; score: number } | null = null
  for (const { card, color } of stealable) {
    let score = 0
    // Prefer properties that advance our own sets
    const botCount = bot.properties[color].length
    const needed = SET_SIZES[color]
    if (botCount === needed - 1) score += 100 // Completes our set!
    else if (botCount > 0) score += 50
    else score += 10
    // Prefer properties from opponent's near-complete sets
    const oppCount = opponent.properties[color].length
    if (oppCount === SET_SIZES[color] - 1) score += 30 // Disrupts their set
    // Prefer higher value cards
    score += card.bankValue * 2
    if (!best || score > best.score) {
      best = { cardId: card.id, color, score }
    }
  }
  return best ? { cardId: best.cardId, color: best.color } : null
}

// ===== Bot selects which set to steal (Deal Breaker) =====
export function botSelectSetToSteal(state: GameState): PropertyColor | null {
  const opponent = state.players.human
  const completeSets = getPlayerCompleteSets(opponent)
  if (completeSets.length === 0) return null

  // Prefer highest rent value set
  let best: { color: PropertyColor; rent: number } | null = null
  for (const color of completeSets) {
    const propCount = opponent.properties[color].length
    const rent = getRentAmount(color, propCount, opponent.houses[color] > 0, opponent.hotels[color] > 0)
    if (!best || rent > best.rent) {
      best = { color, rent }
    }
  }
  return best ? best.color : null
}

// ===== Bot selects which own property to give (Forced Deal) =====
export function botSelectPropertyToGive(state: GameState): { cardId: string; color: PropertyColor } | null {
  const bot = state.players.bot

  // Give the least valuable property (not from near-complete sets)
  let best: { cardId: string; color: PropertyColor; score: number } | null = null
  for (const color of PROPERTY_COLORS) {
    const cards = bot.properties[color]
    if (cards.length === 0) continue
    const needed = SET_SIZES[color]
    const isComplete = isSetComplete(color, cards)

    for (const card of cards) {
      // Skip the card we just took in forced deal
      if (state.pendingAction?.type === 'selectOwnProperty' &&
          card.id === state.pendingAction.takenCard.id) continue

      let score = 100 // Higher score = less willing to give
      if (isComplete) score = 200 // Never give from complete sets
      else if (cards.length === needed - 1) score = 150
      else score = cards.length * 10 + card.bankValue

      if (!best || score < best.score) {
        best = { cardId: card.id, color, score }
      }
    }
  }
  return best ? { cardId: best.cardId, color: best.color } : null
}

// ===== Bot selects color for wildcard =====
export function botSelectWildcardColor(state: GameState, cardId: string): PropertyColor {
  const bot = state.players.bot
  const card = bot.hand.find(c => c.id === cardId) ||
    PROPERTY_COLORS.map(c => bot.properties[c]).flat().find(c => c.id === cardId)

  const availableColors = card?.colors || PROPERTY_COLORS as unknown as PropertyColor[]

  // Pick color that gets us closest to completing a set
  let bestColor = availableColors[0]
  let bestScore = -1

  for (const color of availableColors) {
    const count = bot.properties[color].length
    const needed = SET_SIZES[color]
    let score = 0
    if (count === needed - 1) score = 100 // Would complete the set
    else if (count > 0) score = count * 20
    if (score > bestScore) {
      bestScore = score
      bestColor = color
    }
  }

  return bestColor
}

// ===== Bot selects color for rent =====
export function botSelectRentColor(state: GameState, colors: PropertyColor[]): PropertyColor {
  const bot = state.players.bot
  let bestColor = colors[0]
  let bestRent = 0

  for (const color of colors) {
    const count = bot.properties[color].length
    if (count === 0) continue
    const rent = getRentAmount(color, count, bot.houses[color] > 0, bot.hotels[color] > 0)
    if (rent > bestRent) {
      bestRent = rent
      bestColor = color
    }
  }

  return bestColor
}
