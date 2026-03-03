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
import { getBotConfig, getGamePhase } from './botConfig'

// ===== State Evaluation =====
export function evaluateState(state: GameState, player: PlayerId): number {
  const config = getBotConfig(state.difficulty)
  const me = state.players[player]
  const opp = state.players[getOpponent(player)]
  let score = 0

  // Complete sets
  const mySets = countCompleteSets(me)
  score += mySets * config.completeSetWeight
  if (mySets >= 3) score += config.winBonusWeight

  // Progress toward sets
  for (const color of PROPERTY_COLORS) {
    const count = me.properties[color].length
    const needed = SET_SIZES[color]
    if (count > 0 && count < needed) {
      if (count === needed - 1) score += config.nearCompleteWeight
      else score += count * config.propertyProgressWeight
    }
    if (me.houses[color]) score += config.houseWeight
    if (me.hotels[color]) score += config.hotelWeight

    // Advanced: color priority valuation
    if (config.propertyValuation && count > 0) {
      score += config.colorPriority[color] * count * 0.1
    }
  }

  // Bank value
  score += getTotalBankValue(me) * config.bankValueMultiplier

  // Defensive cards
  const jsnCount = me.hand.filter(c => c.type === 'action' && c.actionType === 'justSayNo').length
  score += jsnCount * config.jsnDefensiveWeight

  // Opponent threats
  const oppSets = countCompleteSets(opp)
  score -= oppSets * config.oppSetPenalty
  if (oppSets >= 3) score -= config.winBonusWeight

  for (const color of PROPERTY_COLORS) {
    const count = opp.properties[color].length
    const needed = SET_SIZES[color]
    if (count === needed - 1 && count > 0) score -= config.oppNearCompletePenalty
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
          // Doubled rent (if has Double The Rent card and room for 2 plays)
          const doubleCard = player.hand.find(c => c.actionType === 'doubleTheRent' && c.id !== card.id)
          if (doubleCard && state.cardsPlayedThisTurn < 2) {
            moves.push({
              action: { type: 'PLAY_RENT', cardId: card.id, color, doubled: true, doubleCardId: doubleCard.id },
              score: 0,
              apply: (s) => playRent(s, 'bot', card.id, color, true, doubleCard.id),
            })
          }
        }
      }
    }
  }

  return moves
}

// ===== Compute best bot turn =====
export function computeBotTurn(state: GameState): GameAction[] {
  const config = getBotConfig(state.difficulty)
  const actions: GameAction[] = []
  let simState = cloneState(state)

  for (let play = 0; play < 3; play++) {
    if (simState.cardsPlayedThisTurn >= 3) break
    if (simState.players.bot.hand.length === 0) break

    const moves = enumerateMoves(simState)
    if (moves.length === 0) break

    // Beginner blunder: pick a random move
    if (config.blunderChance > 0 && Math.random() < config.blunderChance) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)]
      actions.push(randomMove.action)
      simState = randomMove.apply(cloneState(simState))
      if (simState.pendingAction) break
      continue
    }

    // Beginner: sometimes bank a useful action card
    if (config.bankActionCardChance > 0 && Math.random() < config.bankActionCardChance) {
      const actionCards = simState.players.bot.hand.filter(
        c => c.type === 'action' && c.actionType !== 'justSayNo' && c.bankValue >= 3
      )
      if (actionCards.length > 0) {
        const card = actionCards[0]
        const bankAction: GameAction = { type: 'PLAY_CARD_AS_MONEY', cardId: card.id }
        actions.push(bankAction)
        simState = playCardAsBank(cloneState(simState), 'bot', card.id)
        continue
      }
    }

    const baseLine = evaluateState(simState, 'bot')
    let bestMove: BotMove | null = null
    let bestScore = -Infinity

    const phase = config.phaseAwareness ? getGamePhase(simState.turnNumber) : 'midgame'

    for (const move of moves) {
      const resultState = move.apply(cloneState(simState))
      let delta = evaluateState(resultState, 'bot') - baseLine

      if (move.action.type === 'PLAY_ACTION') {
        const card = simState.players.bot.hand.find(c => c.id === (move.action as { cardId: string }).cardId)

        if (card?.actionType === 'passGo' && play === 0) {
          let bonus = config.passGoFirstPlayBonus
          if (config.phaseAwareness && phase === 'opening') bonus *= 1.5
          delta += bonus
        }
        if (card?.actionType === 'dealBreaker') {
          let bonus = config.dealBreakerBonus
          // Advanced: bait JSN — reduce DealBreaker priority on first play if opponent has JSN
          if (config.baitJSN && play === 0 && hasJustSayNo(simState.players.human)) {
            bonus *= 0.3
          }
          delta += bonus
        }
        if (card?.actionType === 'slyDeal') delta += config.slyDealBonus
        if (card?.actionType === 'debtCollector') delta += config.debtCollectorBonus
        if (card?.actionType === 'birthday') delta += config.birthdayBonus
        if (card?.actionType === 'forcedDeal') {
          let bonus = config.forcedDealBonus
          // Advanced: denial play bonus for disrupting opponent near-complete sets
          if (config.denialPlays) {
            for (const color of PROPERTY_COLORS) {
              const oppCount = simState.players.human.properties[color].length
              if (oppCount === SET_SIZES[color] - 1 && oppCount > 0) {
                bonus += 80
              }
            }
          }
          delta += bonus
        }

        // JSN penalty if opponent likely has it
        if (card?.actionType && ['dealBreaker', 'slyDeal', 'forcedDeal', 'debtCollector', 'birthday'].includes(card.actionType)) {
          if (hasJustSayNo(simState.players.human)) {
            delta -= config.jsnPenaltyIfOpponentHasJSN

            // Advanced: card counting — cancel penalty if all JSN have been played
            if (config.cardCounting) {
              const jsnPlayed = simState.playedActionCards.filter(a => a === 'justSayNo').length
              if (jsnPlayed >= 3) delta += config.jsnPenaltyIfOpponentHasJSN
            }
          }
        }
      }

      if (move.action.type === 'PLAY_RENT') {
        let bonus = config.rentBonus
        // Advanced: rent bomb combo — extra bonus for doubled rent
        if (config.rentBombCombo && 'doubled' in move.action && move.action.doubled) {
          bonus += 200
          if (phase === 'endgame') bonus += 150
        }
        delta += bonus
      }

      // Advanced: Voltron — penalize completing a set unless it wins the game
      if (config.voltronStrategy) {
        const currentSets = countCompleteSets(simState.players.bot)
        const resultSets = countCompleteSets(resultState.players.bot)
        if (resultSets > currentSets && resultSets < 3 && phase !== 'endgame') {
          delta -= 300
        }
      }

      if (delta > bestScore) {
        bestScore = delta
        bestMove = move
      }
    }

    if (bestMove && bestScore > config.movePlayThreshold) {
      actions.push(bestMove.action)
      simState = bestMove.apply(cloneState(simState))
      if (simState.pendingAction) break
    } else {
      break
    }
  }

  return actions
}

// ===== Bot decisions for reactive situations =====
export function shouldBotPlayJustSayNo(state: GameState): boolean {
  const config = getBotConfig(state.difficulty)
  const pending = state.pendingAction
  if (!pending) return false

  const bot = state.players.bot
  if (!hasJustSayNo(bot)) return false

  if (pending.type === 'justSayNo') {
    const original = pending.originalAction

    // Beginner: random failure
    if (config.jsnRandomFailChance > 0 && Math.random() < config.jsnRandomFailChance) {
      return false
    }

    // Deal Breaker
    if (original.type === 'selectSet') {
      return config.jsnAlwaysBlockDealBreaker
    }

    // Property steal
    if (original.type === 'selectProperty') {
      return config.jsnAlwaysBlockPropertySteal
    }

    // Debt threshold
    if (original.type === 'payDebt' && original.amount >= config.jsnDebtThreshold) {
      return true
    }

    // Beginner: wastes JSN on small debts
    if (config.jsnDebtThreshold <= 3 && original.type === 'payDebt' && original.amount >= 2) {
      return true
    }

    return false
  }

  return false
}

// ===== Bot selects which property to steal (Sly Deal) =====
export function botSelectPropertyToSteal(state: GameState): { cardId: string; color: PropertyColor } | null {
  const config = getBotConfig(state.difficulty)
  const opponent = state.players.human
  const bot = state.players.bot
  const stealable = getStealableProperties(opponent)
  if (stealable.length === 0) return null

  // Beginner: random selection
  if (config.selectionStrategy === 'random') {
    const pick = stealable[Math.floor(Math.random() * stealable.length)]
    return { cardId: pick.card.id, color: pick.color }
  }

  let best: { cardId: string; color: PropertyColor; score: number } | null = null
  for (const { card, color } of stealable) {
    let score = 0
    const botCount = bot.properties[color].length
    const needed = SET_SIZES[color]
    if (botCount === needed - 1) score += 100
    else if (botCount > 0) score += 50
    else score += 10

    const oppCount = opponent.properties[color].length
    if (oppCount === SET_SIZES[color] - 1) score += 30

    score += card.bankValue * 2

    // Advanced: color priority
    if (config.propertyValuation) {
      score += config.colorPriority[color] * 0.5
    }

    // Advanced: denial bonus
    if (config.denialPlays && oppCount === SET_SIZES[color] - 1) {
      score += 60
    }

    if (!best || score > best.score) {
      best = { cardId: card.id, color, score }
    }
  }
  return best ? { cardId: best.cardId, color: best.color } : null
}

// ===== Bot selects which set to steal (Deal Breaker) =====
export function botSelectSetToSteal(state: GameState): PropertyColor | null {
  const config = getBotConfig(state.difficulty)
  const opponent = state.players.human
  const completeSets = getPlayerCompleteSets(opponent)
  if (completeSets.length === 0) return null

  // Beginner: random
  if (config.selectionStrategy === 'random') {
    return completeSets[Math.floor(Math.random() * completeSets.length)]
  }

  let best: { color: PropertyColor; score: number } | null = null
  for (const color of completeSets) {
    const propCount = opponent.properties[color].length
    const rent = getRentAmount(color, propCount, opponent.houses[color] > 0, opponent.hotels[color] > 0)
    let score = rent

    // Advanced: color priority
    if (config.propertyValuation) {
      score += config.colorPriority[color] * 0.3
    }

    if (!best || score > best.score) {
      best = { color, score }
    }
  }
  return best ? best.color : null
}

// ===== Bot selects which own property to give (Forced Deal) =====
export function botSelectPropertyToGive(state: GameState): { cardId: string; color: PropertyColor } | null {
  const config = getBotConfig(state.difficulty)
  const bot = state.players.bot

  let best: { cardId: string; color: PropertyColor; score: number } | null = null
  for (const color of PROPERTY_COLORS) {
    const cards = bot.properties[color]
    if (cards.length === 0) continue
    const needed = SET_SIZES[color]
    const complete = isSetComplete(color, cards)

    for (const card of cards) {
      if (state.pendingAction?.type === 'selectOwnProperty' &&
          card.id === state.pendingAction.takenCard.id) continue

      let score = 100

      if (config.selectionStrategy === 'random') {
        // Beginner: poor protection
        score = card.bankValue + Math.random() * 20
      } else {
        if (config.paymentProtectComplete && complete) score = 200
        else if (config.paymentProtectNearComplete && cards.length === needed - 1) score = 150
        else score = cards.length * 10 + card.bankValue

        // Advanced: protect high-priority colors
        if (config.propertyValuation) {
          score += config.colorPriority[color] * 0.3
        }
      }

      if (!best || score < best.score) {
        best = { cardId: card.id, color, score }
      }
    }
  }
  return best ? { cardId: best.cardId, color: best.color } : null
}

// ===== Bot selects color for wildcard =====
export function botSelectWildcardColor(state: GameState, cardId: string): PropertyColor {
  const config = getBotConfig(state.difficulty)
  const bot = state.players.bot
  const card = bot.hand.find(c => c.id === cardId) ||
    PROPERTY_COLORS.map(c => bot.properties[c]).flat().find(c => c.id === cardId)

  const availableColors = card?.colors || PROPERTY_COLORS as unknown as PropertyColor[]

  // Beginner: random
  if (config.selectionStrategy === 'random') {
    return availableColors[Math.floor(Math.random() * availableColors.length)]
  }

  let bestColor = availableColors[0]
  let bestScore = -1

  for (const color of availableColors) {
    const count = bot.properties[color].length
    const needed = SET_SIZES[color]
    let score = 0
    if (count === needed - 1) score = 100
    else if (count > 0) score = count * 20

    if (config.propertyValuation) {
      score += config.colorPriority[color] * 0.2
    }

    if (score > bestScore) {
      bestScore = score
      bestColor = color
    }
  }

  return bestColor
}

// ===== Bot selects color for rent =====
export function botSelectRentColor(state: GameState, colors: PropertyColor[]): PropertyColor {
  const config = getBotConfig(state.difficulty)
  const bot = state.players.bot

  // Beginner: sometimes random
  if (config.blunderChance > 0 && Math.random() < 0.3) {
    const validColors = colors.filter(c => bot.properties[c].length > 0)
    if (validColors.length > 0) {
      return validColors[Math.floor(Math.random() * validColors.length)]
    }
  }

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
