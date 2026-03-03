import type {
  Card, GameState, PlayerState, PlayerId, PropertyColor,
  PendingAction, TurnPhase, Difficulty,
} from './types'
import { PROPERTY_COLORS } from './types'
import { createDeck, shuffleDeck } from './cards'
import { createEmptyProperties, createEmptyCounters, isSetComplete, countCompleteSets, getRentAmount } from './sets'
// SET_SIZES accessed via sets module

// ===== Helper: deep clone state =====
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state))
}

// ===== Helper: get opponent =====
export function getOpponent(player: PlayerId): PlayerId {
  return player === 'human' ? 'bot' : 'human'
}

// ===== Create initial game state =====
function createPlayer(id: PlayerId): PlayerState {
  return {
    id,
    hand: [],
    bank: [],
    properties: createEmptyProperties(),
    houses: createEmptyCounters(),
    hotels: createEmptyCounters(),
  }
}

export function createInitialState(difficulty: Difficulty = 'intermediate'): GameState {
  const deck = createDeck()

  const human = createPlayer('human')
  const bot = createPlayer('bot')

  // Deal 5 cards each
  human.hand = deck.splice(0, 5)
  bot.hand = deck.splice(0, 5)

  return {
    difficulty,
    players: { human, bot },
    drawPile: deck,
    discardPile: [],
    currentPlayer: 'human',
    turnPhase: 'draw',
    cardsPlayedThisTurn: 0,
    pendingAction: null,
    winner: null,
    actionLog: [],
    turnNumber: 1,
    playedActionCards: [],
  }
}

// ===== Draw cards =====
function recycleDiscardPile(state: GameState): GameState {
  if (state.drawPile.length > 0) return state
  if (state.discardPile.length === 0) return state
  const s = cloneState(state)
  s.drawPile = shuffleDeck(s.discardPile)
  s.discardPile = []
  s.actionLog.push({ player: s.currentPlayer, message: 'La défausse est mélangée dans la pioche.' })
  return s
}

export function drawCards(state: GameState): GameState {
  let s = cloneState(state)
  const player = s.players[s.currentPlayer]
  // Official rules: draw 2 cards, or 5 if hand is empty at start of turn
  const count = player.hand.length === 0 ? 5 : 2

  s = recycleDiscardPile(s)

  const drawn = Math.min(count, s.drawPile.length)
  const cards = s.drawPile.splice(0, drawn)
  s.players[s.currentPlayer].hand.push(...cards)

  s.turnPhase = 'play'
  s.actionLog.push({
    player: s.currentPlayer,
    message: `pioche ${drawn} carte${drawn > 1 ? 's' : ''}.`,
  })
  return s
}

// ===== Play card as money =====
export function playCardAsBank(state: GameState, playerId: PlayerId, cardId: string): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  player.bank.push(card)
  s.cardsPlayedThisTurn++
  s.actionLog.push({ player: playerId, message: `place ${card.name} (${card.bankValue}M) en banque.` })
  return s
}

// ===== Play property card =====
export function playProperty(state: GameState, playerId: PlayerId, cardId: string, color: PropertyColor): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)

  if (card.type === 'wildcard') {
    card.currentColor = color
  }
  player.properties[color].push(card)
  s.cardsPlayedThisTurn++
  s.actionLog.push({ player: playerId, message: `place ${card.name} sur ${color}.` })
  return checkWinCondition(s)
}

// ===== Play action cards =====
export function playPassGo(state: GameState, playerId: PlayerId, cardId: string): GameState {
  let s = cloneState(state)
  const player = s.players[playerId]
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.cardsPlayedThisTurn++

  // Draw 2 cards
  s = recycleDiscardPile(s)
  const drawn = Math.min(2, s.drawPile.length)
  const drawnCards = s.drawPile.splice(0, drawn)
  s.players[playerId].hand.push(...drawnCards)

  s.actionLog.push({ player: playerId, message: `joue Départ et pioche ${drawn} carte${drawn > 1 ? 's' : ''}.` })
  return s
}

export function playDebtCollector(state: GameState, playerId: PlayerId, cardId: string): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.cardsPlayedThisTurn++

  const opponent = getOpponent(playerId)
  s.pendingAction = {
    type: 'justSayNo',
    challenger: playerId,
    target: opponent,
    depth: 0,
    originalAction: {
      type: 'payDebt',
      debtor: opponent,
      creditor: playerId,
      amount: 5,
      reason: 'Agent de Recouvrement',
    },
  }
  s.turnPhase = 'actionResponse'
  if (card.actionType) s.playedActionCards.push(card.actionType)
  s.actionLog.push({ player: playerId, message: `joue Agent de Recouvrement ! ${opponent} doit payer 5M.` })
  return s
}

export function playBirthday(state: GameState, playerId: PlayerId, cardId: string): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.cardsPlayedThisTurn++

  const opponent = getOpponent(playerId)
  s.pendingAction = {
    type: 'justSayNo',
    challenger: playerId,
    target: opponent,
    depth: 0,
    originalAction: {
      type: 'payDebt',
      debtor: opponent,
      creditor: playerId,
      amount: 2,
      reason: 'C\'est mon Anniversaire',
    },
  }
  s.turnPhase = 'actionResponse'
  if (card.actionType) s.playedActionCards.push(card.actionType)
  s.actionLog.push({ player: playerId, message: `joue C'est mon Anniversaire ! ${opponent} doit payer 2M.` })
  return s
}

export function playRent(
  state: GameState, playerId: PlayerId, cardId: string,
  color: PropertyColor, doubled: boolean, doubleCardId?: string,
): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]

  // Remove rent card
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.cardsPlayedThisTurn++

  // Remove double rent card if applicable
  if (doubled && doubleCardId) {
    const dIdx = player.hand.findIndex(c => c.id === doubleCardId)
    if (dIdx !== -1) {
      const [dCard] = player.hand.splice(dIdx, 1)
      s.discardPile.push(dCard)
      s.cardsPlayedThisTurn++
    }
  }

  const propCount = player.properties[color].length
  const hasHouse = player.houses[color] > 0
  const hasHotel = player.hotels[color] > 0
  let amount = getRentAmount(color, propCount, hasHouse, hasHotel)
  if (doubled) amount *= 2

  const opponent = getOpponent(playerId)
  s.pendingAction = {
    type: 'justSayNo',
    challenger: playerId,
    target: opponent,
    depth: 0,
    originalAction: {
      type: 'payDebt',
      debtor: opponent,
      creditor: playerId,
      amount,
      reason: `Loyer ${color}${doubled ? ' (x2)' : ''}`,
    },
  }
  s.turnPhase = 'actionResponse'
  s.actionLog.push({ player: playerId, message: `demande ${amount}M de loyer (${color})${doubled ? ' doublé !' : ''}.` })
  return s
}

export function playSlyDeal(state: GameState, playerId: PlayerId, cardId: string): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.cardsPlayedThisTurn++

  const opponent = getOpponent(playerId)

  // Check if opponent has stealable properties (not from complete sets)
  const hasStealable = PROPERTY_COLORS.some(color => {
    if (isSetComplete(color, s.players[opponent].properties[color])) return false
    return s.players[opponent].properties[color].length > 0
  })

  if (!hasStealable) {
    s.actionLog.push({ player: playerId, message: `joue Deal Duel mais l'adversaire n'a rien à voler.` })
    return s
  }

  s.pendingAction = {
    type: 'justSayNo',
    challenger: playerId,
    target: opponent,
    depth: 0,
    originalAction: {
      type: 'selectProperty',
      player: playerId,
      targetPlayer: opponent,
      purpose: 'slyDeal',
    },
  }
  s.turnPhase = 'actionResponse'
  if (card.actionType) s.playedActionCards.push(card.actionType)
  s.actionLog.push({ player: playerId, message: `joue Deal Duel !` })
  return s
}

export function playForcedDeal(state: GameState, playerId: PlayerId, cardId: string): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.cardsPlayedThisTurn++

  const opponent = getOpponent(playerId)

  const hasStealable = PROPERTY_COLORS.some(color => {
    if (isSetComplete(color, s.players[opponent].properties[color])) return false
    return s.players[opponent].properties[color].length > 0
  })

  if (!hasStealable) {
    s.actionLog.push({ player: playerId, message: `joue Deal Troc mais l'adversaire n'a rien à échanger.` })
    return s
  }

  s.pendingAction = {
    type: 'justSayNo',
    challenger: playerId,
    target: opponent,
    depth: 0,
    originalAction: {
      type: 'selectProperty',
      player: playerId,
      targetPlayer: opponent,
      purpose: 'forcedDeal-take',
    },
  }
  s.turnPhase = 'actionResponse'
  if (card.actionType) s.playedActionCards.push(card.actionType)
  s.actionLog.push({ player: playerId, message: `joue Deal Troc !` })
  return s
}

export function playDealBreaker(state: GameState, playerId: PlayerId, cardId: string): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]
  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  s.cardsPlayedThisTurn++

  const opponent = getOpponent(playerId)

  const hasCompleteSet = PROPERTY_COLORS.some(color =>
    isSetComplete(color, s.players[opponent].properties[color])
  )

  if (!hasCompleteSet) {
    s.actionLog.push({ player: playerId, message: `joue Deal Jackpot mais l'adversaire n'a pas de set complet.` })
    return s
  }

  s.pendingAction = {
    type: 'justSayNo',
    challenger: playerId,
    target: opponent,
    depth: 0,
    originalAction: {
      type: 'selectSet',
      player: playerId,
      targetPlayer: opponent,
      purpose: 'dealBreaker',
    },
  }
  s.turnPhase = 'actionResponse'
  if (card.actionType) s.playedActionCards.push(card.actionType)
  s.actionLog.push({ player: playerId, message: `joue Deal Jackpot !` })
  return s
}

export function playHouse(state: GameState, playerId: PlayerId, cardId: string, color: PropertyColor): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]

  if (!isSetComplete(color, player.properties[color])) return state
  if (player.houses[color] > 0) return state
  if (color === 'railroad' || color === 'utility') return state

  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  player.houses[color] = 1
  s.cardsPlayedThisTurn++
  s.actionLog.push({ player: playerId, message: `place une maison sur ${color}.` })
  return s
}

export function playHotel(state: GameState, playerId: PlayerId, cardId: string, color: PropertyColor): GameState {
  const s = cloneState(state)
  const player = s.players[playerId]

  if (!isSetComplete(color, player.properties[color])) return state
  if (player.houses[color] === 0) return state
  if (player.hotels[color] > 0) return state
  if (color === 'railroad' || color === 'utility') return state

  const idx = player.hand.findIndex(c => c.id === cardId)
  if (idx === -1) return state
  const [card] = player.hand.splice(idx, 1)
  s.discardPile.push(card)
  player.hotels[color] = 1
  s.cardsPlayedThisTurn++
  s.actionLog.push({ player: playerId, message: `place un hôtel sur ${color}.` })
  return s
}

// ===== Resolve Just Say No =====
export function resolveJustSayNo(state: GameState, playsJSN: boolean): GameState {
  const s = cloneState(state)
  const pending = s.pendingAction
  if (!pending || pending.type !== 'justSayNo') return state

  if (!playsJSN) {
    // Accept the action — resolve the original action
    if (pending.depth % 2 === 0) {
      // Target accepted (didn't play JSN), action proceeds
      s.pendingAction = pending.originalAction
      s.turnPhase = resolvePhaseForAction(pending.originalAction)
    } else {
      // Challenger accepted (didn't counter), action is blocked
      s.pendingAction = null
      s.turnPhase = 'play'
      s.actionLog.push({ player: pending.challenger, message: `n'a pas contré le Juste dire non.` })
    }
    return s
  }

  // Player plays Just Say No
  const jsnPlayer = pending.depth % 2 === 0 ? pending.target : pending.challenger
  const player = s.players[jsnPlayer]
  const jsnIdx = player.hand.findIndex(c => c.type === 'action' && c.actionType === 'justSayNo')
  if (jsnIdx === -1) return state

  const [jsnCard] = player.hand.splice(jsnIdx, 1)
  s.discardPile.push(jsnCard)
  s.playedActionCards.push('justSayNo')
  s.actionLog.push({ player: jsnPlayer, message: `joue Juste dire non !` })

  // Check if other side can counter
  const otherPlayer = jsnPlayer === pending.target ? pending.challenger : pending.target
  const otherHasJSN = s.players[otherPlayer].hand.some(
    c => c.type === 'action' && c.actionType === 'justSayNo'
  )

  if (otherHasJSN) {
    // Offer counter
    s.pendingAction = {
      type: 'justSayNo',
      challenger: pending.challenger,
      target: pending.target,
      originalAction: pending.originalAction,
      depth: pending.depth + 1,
    }
  } else {
    // No counter possible — the player who just played JSN wins
    // Even depth: target played JSN → action blocked
    // Odd depth: challenger played JSN → action proceeds
    if (pending.depth % 2 === 0) {
      // Target played JSN, action blocked
      s.pendingAction = null
      s.turnPhase = 'play'
      s.actionLog.push({ player: pending.target, message: `bloque l'action !` })
    } else {
      // Challenger countered, action proceeds
      s.pendingAction = pending.originalAction
      s.turnPhase = resolvePhaseForAction(pending.originalAction)
    }
  }

  return s
}

function resolvePhaseForAction(action: PendingAction): TurnPhase {
  switch (action.type) {
    case 'payDebt': return 'payment'
    case 'selectProperty':
    case 'selectSet':
    case 'selectOwnProperty':
      return 'actionResponse'
    default: return 'play'
  }
}

// ===== Resolve Payment =====
export function resolvePayment(
  state: GameState,
  payments: { cardId: string; source: 'bank' | PropertyColor }[],
): GameState {
  const s = cloneState(state)
  const pending = s.pendingAction
  if (!pending || pending.type !== 'payDebt') return state

  const debtor = s.players[pending.debtor]
  const creditor = s.players[pending.creditor]

  for (const payment of payments) {
    if (payment.source === 'bank') {
      const idx = debtor.bank.findIndex(c => c.id === payment.cardId)
      if (idx !== -1) {
        const [card] = debtor.bank.splice(idx, 1)
        creditor.bank.push(card)
      }
    } else {
      const color = payment.source
      const idx = debtor.properties[color].findIndex(c => c.id === payment.cardId)
      if (idx !== -1) {
        const [card] = debtor.properties[color].splice(idx, 1)
        // Transfer property to creditor — place in appropriate color
        const targetColor = card.currentColor || card.color || color
        creditor.properties[targetColor].push(card)

        // If set was complete and now isn't, remove house/hotel
        if (!isSetComplete(color, debtor.properties[color])) {
          if (debtor.hotels[color] > 0) {
            debtor.hotels[color] = 0
            s.actionLog.push({ player: pending.debtor, message: `perd l'Hôtel sur ${color}.` })
          }
          if (debtor.houses[color] > 0) {
            debtor.houses[color] = 0
            s.actionLog.push({ player: pending.debtor, message: `perd la Maison sur ${color}.` })
          }
        }
      }
    }
  }

  s.actionLog.push({ player: pending.debtor, message: `paie ${pending.reason}.` })
  s.pendingAction = null
  s.turnPhase = 'play'
  return checkWinCondition(s)
}

// ===== Select property (Sly Deal / Forced Deal) =====
export function resolveSelectProperty(state: GameState, cardId: string): GameState {
  const s = cloneState(state)
  const pending = s.pendingAction
  if (!pending || pending.type !== 'selectProperty') return state

  const targetPlayer = s.players[pending.targetPlayer]
  const actingPlayer = s.players[pending.player]

  // Find the card in target's properties
  let foundColor: PropertyColor | null = null
  let foundIdx = -1
  for (const color of PROPERTY_COLORS) {
    const idx = targetPlayer.properties[color].findIndex(c => c.id === cardId)
    if (idx !== -1) {
      // Can't steal from complete sets
      if (isSetComplete(color, targetPlayer.properties[color])) continue
      foundColor = color
      foundIdx = idx
      break
    }
  }
  if (foundColor === null || foundIdx === -1) return state

  const [card] = targetPlayer.properties[foundColor].splice(foundIdx, 1)

  // Remove house/hotel if set is now incomplete
  if (!isSetComplete(foundColor, targetPlayer.properties[foundColor])) {
    targetPlayer.houses[foundColor] = 0
    targetPlayer.hotels[foundColor] = 0
  }

  if (pending.purpose === 'slyDeal') {
    const targetColor = card.currentColor || card.color || foundColor
    actingPlayer.properties[targetColor].push(card)
    s.pendingAction = null
    s.turnPhase = 'play'
    s.actionLog.push({ player: pending.player, message: `vole ${card.name} à ${pending.targetPlayer}.` })
  } else {
    // forcedDeal-take: now need to select own property to give
    s.pendingAction = {
      type: 'selectOwnProperty',
      player: pending.player,
      purpose: 'forcedDeal-give',
      takenCard: card,
    }
    // Temporarily hold the taken card — add to acting player
    const targetColor = card.currentColor || card.color || foundColor
    actingPlayer.properties[targetColor].push(card)
    s.actionLog.push({ player: pending.player, message: `prend ${card.name} de ${pending.targetPlayer}.` })
  }

  return checkWinCondition(s)
}

export function resolveSelectOwnProperty(state: GameState, cardId: string): GameState {
  const s = cloneState(state)
  const pending = s.pendingAction
  if (!pending || pending.type !== 'selectOwnProperty') return state

  const actingPlayer = s.players[pending.player]
  const opponent = getOpponent(pending.player)
  const opponentPlayer = s.players[opponent]

  // Find card in acting player's properties
  let foundColor: PropertyColor | null = null
  let foundIdx = -1
  for (const color of PROPERTY_COLORS) {
    const idx = actingPlayer.properties[color].findIndex(c => c.id === cardId)
    if (idx !== -1 && cardId !== pending.takenCard.id) {
      foundColor = color
      foundIdx = idx
      break
    }
  }
  if (foundColor === null || foundIdx === -1) return state

  const [card] = actingPlayer.properties[foundColor].splice(foundIdx, 1)

  // Remove house/hotel if set is now incomplete
  if (!isSetComplete(foundColor, actingPlayer.properties[foundColor])) {
    actingPlayer.houses[foundColor] = 0
    actingPlayer.hotels[foundColor] = 0
  }

  const targetColor = card.currentColor || card.color || foundColor
  opponentPlayer.properties[targetColor].push(card)

  s.pendingAction = null
  s.turnPhase = 'play'
  s.actionLog.push({ player: pending.player, message: `donne ${card.name} à ${opponent} en échange.` })
  return checkWinCondition(s)
}

// ===== Select set (Deal Breaker) =====
export function resolveSelectSet(state: GameState, color: PropertyColor): GameState {
  const s = cloneState(state)
  const pending = s.pendingAction
  if (!pending || pending.type !== 'selectSet') return state

  const targetPlayer = s.players[pending.targetPlayer]
  const actingPlayer = s.players[pending.player]

  if (!isSetComplete(color, targetPlayer.properties[color])) return state

  // Transfer all cards
  const cards = targetPlayer.properties[color].splice(0)
  actingPlayer.properties[color].push(...cards)

  // Transfer house and hotel
  if (targetPlayer.houses[color] > 0) {
    actingPlayer.houses[color] = targetPlayer.houses[color]
    targetPlayer.houses[color] = 0
  }
  if (targetPlayer.hotels[color] > 0) {
    actingPlayer.hotels[color] = targetPlayer.hotels[color]
    targetPlayer.hotels[color] = 0
  }

  s.pendingAction = null
  s.turnPhase = 'play'
  s.actionLog.push({ player: pending.player, message: `vole le set complet ${color} !` })
  return checkWinCondition(s)
}

// ===== End Turn =====
export function endTurn(state: GameState): GameState {
  const s = cloneState(state)
  const player = s.players[s.currentPlayer]

  // Check if player needs to discard
  if (player.hand.length > 7) {
    s.pendingAction = {
      type: 'discard',
      player: s.currentPlayer,
      mustDiscardCount: player.hand.length - 7,
    }
    s.turnPhase = 'discard'
    return s
  }

  return switchTurn(s)
}

export function resolveDiscard(state: GameState, cardIds: string[]): GameState {
  const s = cloneState(state)
  const pending = s.pendingAction
  if (!pending || pending.type !== 'discard') return state

  const player = s.players[pending.player]
  for (const cardId of cardIds) {
    const idx = player.hand.findIndex(c => c.id === cardId)
    if (idx !== -1) {
      const [card] = player.hand.splice(idx, 1)
      // Official rules: excess cards go to the BOTTOM of the draw pile
      s.drawPile.push(card)
    }
  }

  s.pendingAction = null
  s.actionLog.push({ player: pending.player, message: `défausse ${cardIds.length} carte${cardIds.length > 1 ? 's' : ''}.` })
  return switchTurn(s)
}

function switchTurn(state: GameState): GameState {
  const s = cloneState(state)
  s.currentPlayer = getOpponent(s.currentPlayer)
  s.cardsPlayedThisTurn = 0
  s.turnPhase = 'draw'
  s.turnNumber++
  // Check if the new current player already has 3 sets (e.g. from receiving
  // a property as payment during the previous turn). Per official rules,
  // you can only win on your own turn.
  return checkWinCondition(s)
}

// ===== Check Win Condition =====
// Official rules: you can only win on YOUR turn.
export function checkWinCondition(state: GameState): GameState {
  const s = cloneState(state)
  const pid = s.currentPlayer
  if (countCompleteSets(s.players[pid]) >= 3) {
    s.winner = pid
    s.turnPhase = 'gameOver'
    s.actionLog.push({ player: pid, message: `a 3 sets complets et gagne !` })
  }
  return s
}

// ===== Get all stealable properties (not from complete sets) =====
export function getStealableProperties(player: PlayerState): { card: Card; color: PropertyColor }[] {
  const result: { card: Card; color: PropertyColor }[] = []
  for (const color of PROPERTY_COLORS) {
    if (isSetComplete(color, player.properties[color])) continue
    for (const card of player.properties[color]) {
      result.push({ card, color })
    }
  }
  return result
}

// ===== Get complete sets of a player =====
export function getPlayerCompleteSets(player: PlayerState): PropertyColor[] {
  return PROPERTY_COLORS.filter(color =>
    isSetComplete(color, player.properties[color])
  )
}

// ===== Count player total properties =====
export function hasAnyProperty(player: PlayerState): boolean {
  return PROPERTY_COLORS.some(color => player.properties[color].length > 0)
}

// ===== Get colors where player can add house =====
export function getHouseableColors(player: PlayerState): PropertyColor[] {
  return PROPERTY_COLORS.filter(color =>
    color !== 'railroad' && color !== 'utility' &&
    isSetComplete(color, player.properties[color]) &&
    player.houses[color] === 0
  )
}

export function getHotelableColors(player: PlayerState): PropertyColor[] {
  return PROPERTY_COLORS.filter(color =>
    color !== 'railroad' && color !== 'utility' &&
    isSetComplete(color, player.properties[color]) &&
    player.houses[color] > 0 &&
    player.hotels[color] === 0
  )
}
