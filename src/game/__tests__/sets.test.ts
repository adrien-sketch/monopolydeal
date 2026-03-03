import { describe, it, expect } from 'vitest'
import { isSetComplete, getRentAmount, countCompleteSets, getTotalBankValue } from '../sets'
import { createEmptyProperties, createEmptyCounters } from '../sets'
import type { Card, PlayerState } from '../types'

function makePlayer(): PlayerState {
  return {
    id: 'human',
    hand: [],
    bank: [],
    properties: createEmptyProperties(),
    houses: createEmptyCounters(),
    hotels: createEmptyCounters(),
  }
}

function prop(id: string, color: string): Card {
  return { id, type: 'property', name: id, bankValue: 1, color: color as any }
}

describe('isSetComplete', () => {
  it('brown needs 2', () => {
    expect(isSetComplete('brown', [prop('a', 'brown')])).toBe(false)
    expect(isSetComplete('brown', [prop('a', 'brown'), prop('b', 'brown')])).toBe(true)
  })

  it('lightBlue needs 3', () => {
    expect(isSetComplete('lightBlue', [prop('a', 'lightBlue'), prop('b', 'lightBlue')])).toBe(false)
    expect(isSetComplete('lightBlue', [prop('a', 'lightBlue'), prop('b', 'lightBlue'), prop('c', 'lightBlue')])).toBe(true)
  })

  it('railroad needs 4', () => {
    const cards = [prop('a', 'railroad'), prop('b', 'railroad'), prop('c', 'railroad')]
    expect(isSetComplete('railroad', cards)).toBe(false)
    cards.push(prop('d', 'railroad'))
    expect(isSetComplete('railroad', cards)).toBe(true)
  })
})

describe('getRentAmount', () => {
  it('returns 0 for 0 properties', () => {
    expect(getRentAmount('brown', 0, false, false)).toBe(0)
  })

  it('returns correct base rent', () => {
    expect(getRentAmount('brown', 1, false, false)).toBe(1)
    expect(getRentAmount('brown', 2, false, false)).toBe(2)
    expect(getRentAmount('darkBlue', 1, false, false)).toBe(3)
    expect(getRentAmount('darkBlue', 2, false, false)).toBe(8)
  })

  it('adds house bonus', () => {
    expect(getRentAmount('brown', 2, true, false)).toBe(5) // 2 + 3
  })

  it('adds hotel bonus', () => {
    expect(getRentAmount('brown', 2, true, true)).toBe(9) // 2 + 3 + 4
  })
})

describe('countCompleteSets', () => {
  it('returns 0 for empty player', () => {
    expect(countCompleteSets(makePlayer())).toBe(0)
  })

  it('counts complete sets correctly', () => {
    const player = makePlayer()
    player.properties.brown = [prop('a', 'brown'), prop('b', 'brown')]
    player.properties.darkBlue = [prop('c', 'darkBlue'), prop('d', 'darkBlue')]
    expect(countCompleteSets(player)).toBe(2)
  })
})

describe('getTotalBankValue', () => {
  it('sums bank card values', () => {
    const player = makePlayer()
    player.bank = [
      { id: 'a', type: 'money', name: '5M', bankValue: 5 },
      { id: 'b', type: 'money', name: '3M', bankValue: 3 },
    ]
    expect(getTotalBankValue(player)).toBe(8)
  })
})
