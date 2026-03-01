import { describe, it, expect } from 'vitest'
import { createUnshuffledDeck, createDeck } from '../cards'

describe('cards', () => {
  const deck = createUnshuffledDeck()

  it('deck contains exactly 106 cards', () => {
    expect(deck).toHaveLength(106)
  })

  it('all card IDs are unique', () => {
    const ids = deck.map(c => c.id)
    expect(new Set(ids).size).toBe(106)
  })

  it('has 28 property cards', () => {
    expect(deck.filter(c => c.type === 'property')).toHaveLength(28)
  })

  it('has 20 money cards', () => {
    expect(deck.filter(c => c.type === 'money')).toHaveLength(20)
  })

  it('has correct money distribution', () => {
    const moneyCards = deck.filter(c => c.type === 'money')
    expect(moneyCards.filter(c => c.bankValue === 1)).toHaveLength(6)
    expect(moneyCards.filter(c => c.bankValue === 2)).toHaveLength(5)
    expect(moneyCards.filter(c => c.bankValue === 3)).toHaveLength(3)
    expect(moneyCards.filter(c => c.bankValue === 4)).toHaveLength(3)
    expect(moneyCards.filter(c => c.bankValue === 5)).toHaveLength(2)
    expect(moneyCards.filter(c => c.bankValue === 10)).toHaveLength(1)
  })

  it('has 34 action cards', () => {
    expect(deck.filter(c => c.type === 'action')).toHaveLength(34)
  })

  it('has correct action card distribution', () => {
    const actions = deck.filter(c => c.type === 'action')
    expect(actions.filter(c => c.actionType === 'passGo')).toHaveLength(10)
    expect(actions.filter(c => c.actionType === 'dealBreaker')).toHaveLength(2)
    expect(actions.filter(c => c.actionType === 'slyDeal')).toHaveLength(3)
    expect(actions.filter(c => c.actionType === 'forcedDeal')).toHaveLength(3)
    expect(actions.filter(c => c.actionType === 'debtCollector')).toHaveLength(3)
    expect(actions.filter(c => c.actionType === 'birthday')).toHaveLength(2)
    expect(actions.filter(c => c.actionType === 'justSayNo')).toHaveLength(3)
    expect(actions.filter(c => c.actionType === 'doubleTheRent')).toHaveLength(2)
    expect(actions.filter(c => c.actionType === 'house')).toHaveLength(3)
    expect(actions.filter(c => c.actionType === 'hotel')).toHaveLength(3)
  })

  it('has 13 rent cards', () => {
    expect(deck.filter(c => c.type === 'rent')).toHaveLength(13)
  })

  it('has 3 multicolor rent cards', () => {
    const rents = deck.filter(c => c.type === 'rent')
    expect(rents.filter(c => c.colors!.length === 10)).toHaveLength(3)
  })

  it('has 11 wildcard cards', () => {
    expect(deck.filter(c => c.type === 'wildcard')).toHaveLength(11)
  })

  it('has 2 rainbow wildcards', () => {
    const wilds = deck.filter(c => c.type === 'wildcard')
    expect(wilds.filter(c => c.colors!.length === 10)).toHaveLength(2)
  })

  it('has correct property counts per color', () => {
    const props = deck.filter(c => c.type === 'property')
    expect(props.filter(c => c.color === 'brown')).toHaveLength(2)
    expect(props.filter(c => c.color === 'lightBlue')).toHaveLength(3)
    expect(props.filter(c => c.color === 'pink')).toHaveLength(3)
    expect(props.filter(c => c.color === 'orange')).toHaveLength(3)
    expect(props.filter(c => c.color === 'red')).toHaveLength(3)
    expect(props.filter(c => c.color === 'yellow')).toHaveLength(3)
    expect(props.filter(c => c.color === 'green')).toHaveLength(3)
    expect(props.filter(c => c.color === 'darkBlue')).toHaveLength(2)
    expect(props.filter(c => c.color === 'railroad')).toHaveLength(4)
    expect(props.filter(c => c.color === 'utility')).toHaveLength(2)
  })

  it('shuffleDeck produces a different order', () => {
    const d1 = createDeck()
    const d2 = createDeck()
    // With 106 cards, the probability of same order is negligible
    const sameOrder = d1.every((c, i) => c.id === d2[i].id)
    expect(sameOrder).toBe(false)
  })

  it('shuffled deck has same cards as unshuffled', () => {
    const shuffled = createDeck()
    const sortById = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)
    expect(shuffled.sort(sortById).map(c => c.id)).toEqual(deck.sort(sortById).map(c => c.id))
  })
})
