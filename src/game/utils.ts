import type { Card, PropertyColor } from './types'

export function cssColorVar(color: PropertyColor): string {
  const map: Record<string, string> = {
    lightBlue: 'light-blue',
    darkBlue: 'dark-blue',
  }
  return map[color] || color
}

export function getBankDenominations(bank: Card[]) {
  const counts = new Map<number, number>()
  for (const card of bank) {
    counts.set(card.bankValue, (counts.get(card.bankValue) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([value, count]) => ({ value, count }))
}
