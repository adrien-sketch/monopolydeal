import type { Card, PlayerState, PropertyColor } from './types'
import { PROPERTY_COLORS } from './types'
import { SET_SIZES, RENT_TABLE, HOUSE_RENT_BONUS, HOTEL_RENT_BONUS } from './constants'

export function isSetComplete(color: PropertyColor, cards: Card[]): boolean {
  return cards.length >= SET_SIZES[color]
}

export function getCompleteSets(player: PlayerState): PropertyColor[] {
  return PROPERTY_COLORS.filter(color =>
    isSetComplete(color, player.properties[color])
  )
}

export function countCompleteSets(player: PlayerState): number {
  return getCompleteSets(player).length
}

export function getRentAmount(
  color: PropertyColor,
  propertyCount: number,
  hasHouse: boolean,
  hasHotel: boolean,
): number {
  if (propertyCount === 0) return 0
  const table = RENT_TABLE[color]
  const baseRent = table[Math.min(propertyCount, table.length) - 1]
  let rent = baseRent
  if (hasHouse) rent += HOUSE_RENT_BONUS
  if (hasHotel) rent += HOTEL_RENT_BONUS
  return rent
}

export function getTotalBankValue(player: PlayerState): number {
  return player.bank.reduce((sum, card) => sum + card.bankValue, 0)
}

export function getTotalPropertyValue(player: PlayerState): number {
  let total = 0
  for (const color of PROPERTY_COLORS) {
    for (const card of player.properties[color]) {
      total += card.bankValue
    }
  }
  return total
}

export function getTotalAssets(player: PlayerState): number {
  return getTotalBankValue(player) + getTotalPropertyValue(player)
}

export function hasJustSayNo(player: PlayerState): boolean {
  return player.hand.some(c => c.type === 'action' && c.actionType === 'justSayNo')
}

export function createEmptyProperties(): Record<PropertyColor, Card[]> {
  const props = {} as Record<PropertyColor, Card[]>
  for (const color of PROPERTY_COLORS) {
    props[color] = []
  }
  return props
}

export function createEmptyCounters(): Record<PropertyColor, number> {
  const counters = {} as Record<PropertyColor, number>
  for (const color of PROPERTY_COLORS) {
    counters[color] = 0
  }
  return counters
}
