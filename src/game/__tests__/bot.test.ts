import { describe, it, expect } from 'vitest'
import { computeBotTurn, evaluateState, shouldBotPlayJustSayNo, botSelectSetToSteal } from '../bot'
import { createInitialState, drawCards, cloneState } from '../engine'
import type { Card, GameState } from '../types'

function makeBotTurnState(): GameState {
  const state = createInitialState()
  state.isFirstTurn = { human: false, bot: false }
  state.currentPlayer = 'bot'
  return drawCards(state)
}

function prop(id: string, color: string): Card {
  return { id, type: 'property', name: id, bankValue: 1, color: color as any }
}

describe('computeBotTurn', () => {
  it('returns valid actions', () => {
    const state = makeBotTurnState()
    const actions = computeBotTurn(state)
    expect(actions.length).toBeGreaterThanOrEqual(0)
    expect(actions.length).toBeLessThanOrEqual(3)
  })

  it('plays property cards when available', () => {
    const state = makeBotTurnState()
    // Give bot a property card
    state.players.bot.hand = [
      prop('bot-prop-0', 'brown'),
      prop('bot-prop-1', 'lightBlue'),
    ]
    const actions = computeBotTurn(state)
    expect(actions.length).toBeGreaterThan(0)
    // Should play at least one property
    const propAction = actions.find(a => a.type === 'PLAY_PROPERTY')
    expect(propAction).toBeDefined()
  })

  it('plays Deal Breaker when opponent has a complete set', () => {
    const state = makeBotTurnState()
    // Give human a complete set
    state.players.human.properties.brown = [
      prop('h-b0', 'brown'),
      prop('h-b1', 'brown'),
    ]
    // Give bot a Deal Breaker
    state.players.bot.hand = [{
      id: 'bot-db', type: 'action', name: 'Deal Breaker',
      bankValue: 5, actionType: 'dealBreaker',
    }]
    const actions = computeBotTurn(state)
    expect(actions.some(a => a.type === 'PLAY_ACTION')).toBe(true)
  })

  it('never exceeds 3 card plays', () => {
    const state = makeBotTurnState()
    // Give bot lots of cards
    for (let i = 0; i < 10; i++) {
      state.players.bot.hand.push(prop(`bot-extra-${i}`, 'red'))
    }
    const actions = computeBotTurn(state)
    expect(actions.length).toBeLessThanOrEqual(3)
  })
})

describe('evaluateState', () => {
  it('scores complete sets highly', () => {
    const state = makeBotTurnState()
    const s1 = cloneState(state)
    const s2 = cloneState(state)

    s2.players.bot.properties.brown = [prop('a', 'brown'), prop('b', 'brown')]

    expect(evaluateState(s2, 'bot')).toBeGreaterThan(evaluateState(s1, 'bot'))
  })

  it('penalizes opponent complete sets', () => {
    const state = makeBotTurnState()
    const s1 = cloneState(state)
    const s2 = cloneState(state)

    s2.players.human.properties.brown = [prop('a', 'brown'), prop('b', 'brown')]

    expect(evaluateState(s2, 'bot')).toBeLessThan(evaluateState(s1, 'bot'))
  })
})

describe('shouldBotPlayJustSayNo', () => {
  it('blocks Deal Breaker', () => {
    const state = makeBotTurnState()
    state.players.bot.hand.push({
      id: 'bot-jsn', type: 'action', name: 'Just Say No',
      bankValue: 4, actionType: 'justSayNo',
    })
    state.pendingAction = {
      type: 'justSayNo',
      challenger: 'human',
      target: 'bot',
      depth: 0,
      originalAction: {
        type: 'selectSet',
        player: 'human',
        targetPlayer: 'bot',
        purpose: 'dealBreaker',
      },
    }
    expect(shouldBotPlayJustSayNo(state)).toBe(true)
  })

  it('accepts small debts', () => {
    const state = makeBotTurnState()
    state.players.bot.hand.push({
      id: 'bot-jsn', type: 'action', name: 'Just Say No',
      bankValue: 4, actionType: 'justSayNo',
    })
    state.pendingAction = {
      type: 'justSayNo',
      challenger: 'human',
      target: 'bot',
      depth: 0,
      originalAction: {
        type: 'payDebt',
        debtor: 'bot',
        creditor: 'human',
        amount: 2,
        reason: 'Birthday',
      },
    }
    expect(shouldBotPlayJustSayNo(state)).toBe(false)
  })
})

describe('botSelectSetToSteal', () => {
  it('selects the highest-rent complete set', () => {
    const state = makeBotTurnState()
    state.players.human.properties.brown = [prop('a', 'brown'), prop('b', 'brown')]
    state.players.human.properties.darkBlue = [
      { id: 'db0', type: 'property', name: 'Avenue des Champs-Élysées', bankValue: 4, color: 'darkBlue' },
      { id: 'db1', type: 'property', name: 'Rue de la Paix', bankValue: 4, color: 'darkBlue' },
    ]
    const result = botSelectSetToSteal(state)
    expect(result).toBe('darkBlue') // darkBlue rent (8) > brown rent (2)
  })
})
