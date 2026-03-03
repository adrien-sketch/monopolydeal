import { describe, it, expect } from 'vitest'
import {
  createInitialState, drawCards, playCardAsBank, playProperty,
  playPassGo, playDebtCollector,
  resolveJustSayNo, resolvePayment,
  endTurn, resolveDiscard,
} from '../engine'
import type { GameState, Card } from '../types'

function makeTestState(): GameState {
  return createInitialState()
}

describe('createInitialState', () => {
  it('creates a valid initial state', () => {
    const state = createInitialState()
    expect(state.players.human.hand).toHaveLength(5)
    expect(state.players.bot.hand).toHaveLength(5)
    expect(state.drawPile.length).toBe(106 - 10)
    expect(state.discardPile).toHaveLength(0)
    expect(state.currentPlayer).toBe('human')
    expect(state.turnPhase).toBe('draw')
    expect(state.winner).toBeNull()
  })
})

describe('drawCards', () => {
  it('draws 2 cards per turn (official rules)', () => {
    const state = createInitialState()
    const s = drawCards(state)
    // Players start with 5 dealt cards, then draw 2 = 7
    expect(s.players.human.hand).toHaveLength(7)
    expect(s.turnPhase).toBe('play')
  })

  it('draws 2 cards on subsequent turns', () => {
    const state = makeTestState()
    const s = drawCards(state)
    expect(s.players.human.hand).toHaveLength(7) // 5 initial + 2 drawn
    expect(s.turnPhase).toBe('play')
  })

  it('draws 5 cards when hand is empty', () => {
    const state = makeTestState()
    state.players.human.hand = []
    const s = drawCards(state)
    expect(s.players.human.hand).toHaveLength(5)
  })
})

describe('playCardAsBank', () => {
  it('moves card from hand to bank', () => {
    const state = makeTestState()
    const s = drawCards(state)
    const card = s.players.human.hand[0]
    const s2 = playCardAsBank(s, 'human', card.id)
    expect(s2.players.human.hand.find(c => c.id === card.id)).toBeUndefined()
    expect(s2.players.human.bank.find(c => c.id === card.id)).toBeDefined()
    expect(s2.cardsPlayedThisTurn).toBe(1)
  })
})

describe('playProperty', () => {
  it('places property card in correct color set', () => {
    const state = makeTestState()
    const s = drawCards(state)
    // Add a property card to hand for testing
    const propCard: Card = { id: 'test-prop', type: 'property', name: 'Test', bankValue: 1, color: 'brown' }
    s.players.human.hand.push(propCard)
    const s2 = playProperty(s, 'human', 'test-prop', 'brown')
    expect(s2.players.human.properties.brown).toHaveLength(1)
    expect(s2.players.human.properties.brown[0].id).toBe('test-prop')
    expect(s2.cardsPlayedThisTurn).toBe(1)
  })

  it('places wildcard with currentColor set', () => {
    const state = makeTestState()
    const s = drawCards(state)
    const wildCard: Card = { id: 'test-wild', type: 'wildcard', name: 'Joker', bankValue: 0, colors: ['brown', 'lightBlue'] }
    s.players.human.hand.push(wildCard)
    const s2 = playProperty(s, 'human', 'test-wild', 'brown')
    expect(s2.players.human.properties.brown[0].currentColor).toBe('brown')
  })
})

describe('playPassGo', () => {
  it('draws 2 extra cards', () => {
    const state = makeTestState()
    const s = drawCards(state)
    const handSize = s.players.human.hand.length
    const passGoCard: Card = { id: 'test-passgo', type: 'action', name: 'Départ', bankValue: 1, actionType: 'passGo' }
    s.players.human.hand.push(passGoCard)
    const s2 = playPassGo(s, 'human', 'test-passgo')
    expect(s2.players.human.hand).toHaveLength(handSize + 2) // -1 played + 2 drawn = net +2 (card was added)
    expect(s2.cardsPlayedThisTurn).toBe(1)
    expect(s2.discardPile.find(c => c.id === 'test-passgo')).toBeDefined()
  })
})

describe('playDebtCollector', () => {
  it('creates pending payment action with JSN wrapper', () => {
    const state = makeTestState()
    const s = drawCards(state)
    const dcCard: Card = { id: 'test-dc', type: 'action', name: 'Agent de Recouvrement', bankValue: 3, actionType: 'debtCollector' }
    s.players.human.hand.push(dcCard)
    const s2 = playDebtCollector(s, 'human', 'test-dc')
    expect(s2.pendingAction).not.toBeNull()
    expect(s2.pendingAction!.type).toBe('justSayNo')
    if (s2.pendingAction!.type === 'justSayNo') {
      expect(s2.pendingAction!.originalAction.type).toBe('payDebt')
      if (s2.pendingAction!.originalAction.type === 'payDebt') {
        expect(s2.pendingAction!.originalAction.amount).toBe(5)
      }
    }
    expect(s2.turnPhase).toBe('actionResponse')
  })
})

describe('resolveJustSayNo', () => {
  it('proceeds with action when target accepts', () => {
    const state = makeTestState()
    const s = drawCards(state)
    s.pendingAction = {
      type: 'justSayNo',
      challenger: 'human',
      target: 'bot',
      depth: 0,
      originalAction: {
        type: 'payDebt',
        debtor: 'bot',
        creditor: 'human',
        amount: 5,
        reason: 'Agent de Recouvrement',
      },
    }
    const s2 = resolveJustSayNo(s, false)
    expect(s2.pendingAction!.type).toBe('payDebt')
    expect(s2.turnPhase).toBe('payment')
  })

  it('blocks action when target plays JSN and challenger has no counter', () => {
    const state = makeTestState()
    const s = drawCards(state)
    // Give bot a JSN card
    const jsnCard: Card = { id: 'bot-jsn', type: 'action', name: 'Juste dire non', bankValue: 4, actionType: 'justSayNo' }
    s.players.bot.hand.push(jsnCard)
    // No JSN for human
    s.players.human.hand = s.players.human.hand.filter(c => c.actionType !== 'justSayNo')

    s.pendingAction = {
      type: 'justSayNo',
      challenger: 'human',
      target: 'bot',
      depth: 0,
      originalAction: {
        type: 'payDebt',
        debtor: 'bot',
        creditor: 'human',
        amount: 5,
        reason: 'Agent de Recouvrement',
      },
    }
    const s2 = resolveJustSayNo(s, true)
    // Action blocked
    expect(s2.pendingAction).toBeNull()
    expect(s2.turnPhase).toBe('play')
  })
})

describe('resolvePayment', () => {
  it('transfers bank cards from debtor to creditor', () => {
    const state = makeTestState()
    const s = drawCards(state)
    // Give bot some money
    const moneyCard: Card = { id: 'bot-money', type: 'money', name: '5M', bankValue: 5 }
    s.players.bot.bank.push(moneyCard)
    s.pendingAction = {
      type: 'payDebt',
      debtor: 'bot',
      creditor: 'human',
      amount: 5,
      reason: 'Test',
    }
    const s2 = resolvePayment(s, [{ cardId: 'bot-money', source: 'bank' }])
    expect(s2.players.bot.bank.find(c => c.id === 'bot-money')).toBeUndefined()
    expect(s2.players.human.bank.find(c => c.id === 'bot-money')).toBeDefined()
    expect(s2.pendingAction).toBeNull()
    expect(s2.turnPhase).toBe('play')
  })
})

describe('endTurn', () => {
  it('switches to next player', () => {
    const state = makeTestState()
    const s = drawCards(state)
    s.turnPhase = 'play'
    const s2 = endTurn(s)
    expect(s2.currentPlayer).toBe('bot')
    expect(s2.turnPhase).toBe('draw')
    expect(s2.cardsPlayedThisTurn).toBe(0)
  })

  it('requires discard when hand > 7', () => {
    const state = makeTestState()
    const s = drawCards(state)
    // Give human 10 cards
    while (s.players.human.hand.length < 10) {
      s.players.human.hand.push({ id: `extra-${s.players.human.hand.length}`, type: 'money', name: '1M', bankValue: 1 })
    }
    s.turnPhase = 'play'
    const s2 = endTurn(s)
    expect(s2.turnPhase).toBe('discard')
    expect(s2.pendingAction!.type).toBe('discard')
  })
})

describe('resolveDiscard', () => {
  it('removes cards from hand to bottom of draw pile and switches turn', () => {
    const state = makeTestState()
    const s = drawCards(state)
    while (s.players.human.hand.length < 10) {
      s.players.human.hand.push({ id: `extra-${s.players.human.hand.length}`, type: 'money', name: '1M', bankValue: 1 })
    }
    s.pendingAction = { type: 'discard', player: 'human', mustDiscardCount: 3 }
    s.turnPhase = 'discard'
    const ids = s.players.human.hand.slice(0, 3).map(c => c.id)
    const drawPileSize = s.drawPile.length
    const s2 = resolveDiscard(s, ids)
    expect(s2.players.human.hand).toHaveLength(7)
    // Discarded cards go to bottom of draw pile (official rules)
    expect(s2.drawPile.length).toBe(drawPileSize + 3)
    expect(s2.currentPlayer).toBe('bot')
  })
})

describe('win condition', () => {
  it('detects 3 complete sets as a win on current player turn', () => {
    const state = makeTestState()
    const s = drawCards(state)
    // Give human 3 complete sets
    s.players.human.properties.brown = [
      { id: 'w-b0', type: 'property', name: 'A', bankValue: 1, color: 'brown' },
      { id: 'w-b1', type: 'property', name: 'B', bankValue: 1, color: 'brown' },
    ]
    s.players.human.properties.darkBlue = [
      { id: 'w-db0', type: 'property', name: 'C', bankValue: 4, color: 'darkBlue' },
      { id: 'w-db1', type: 'property', name: 'D', bankValue: 4, color: 'darkBlue' },
    ]
    s.players.human.properties.utility = [
      { id: 'w-u0', type: 'property', name: 'E', bankValue: 2, color: 'utility' },
      { id: 'w-u1', type: 'property', name: 'F', bankValue: 2, color: 'utility' },
    ]
    // Add a property to trigger win check
    const propCard: Card = { id: 'win-trigger', type: 'property', name: 'Trigger', bankValue: 1, color: 'lightBlue' }
    s.players.human.hand.push(propCard)
    const s2 = playProperty(s, 'human', 'win-trigger', 'lightBlue')
    // Human has 3 complete sets: brown(2/2), darkBlue(2/2), utility(2/2)
    expect(s2.winner).toBe('human')
    expect(s2.turnPhase).toBe('gameOver')
  })

  it('does not declare win for non-current player', () => {
    const state = makeTestState()
    const s = drawCards(state)
    // Give bot 3 complete sets but it's human's turn
    s.players.bot.properties.brown = [
      { id: 'w-b0', type: 'property', name: 'A', bankValue: 1, color: 'brown' },
      { id: 'w-b1', type: 'property', name: 'B', bankValue: 1, color: 'brown' },
    ]
    s.players.bot.properties.darkBlue = [
      { id: 'w-db0', type: 'property', name: 'C', bankValue: 4, color: 'darkBlue' },
      { id: 'w-db1', type: 'property', name: 'D', bankValue: 4, color: 'darkBlue' },
    ]
    s.players.bot.properties.utility = [
      { id: 'w-u0', type: 'property', name: 'E', bankValue: 2, color: 'utility' },
      { id: 'w-u1', type: 'property', name: 'F', bankValue: 2, color: 'utility' },
    ]
    // Human plays a card (doesn't matter what)
    const propCard: Card = { id: 'some-prop', type: 'property', name: 'Test', bankValue: 1, color: 'lightBlue' }
    s.players.human.hand.push(propCard)
    const s2 = playProperty(s, 'human', 'some-prop', 'lightBlue')
    // Bot has 3 sets but it's human's turn - no win declared
    expect(s2.winner).toBeNull()
  })
})
