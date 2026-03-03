import type { PlayerState, PropertyColor, Difficulty } from './types'
import { PROPERTY_COLORS } from './types'
import { SET_SIZES } from './constants'
import { isSetComplete, getTotalAssets } from './sets'
import { getBotConfig } from './botConfig'

export interface PaymentSelection {
  cardId: string
  source: 'bank' | PropertyColor
}

// Auto-select payment for bot: minimize strategic loss
export function chooseBotPayment(player: PlayerState, amount: number, difficulty: Difficulty = 'intermediate'): PaymentSelection[] {
  const config = getBotConfig(difficulty)
  const selections: PaymentSelection[] = []
  let remaining = amount

  // If total assets < amount, give everything
  const totalAssets = getTotalAssets(player)
  if (totalAssets <= amount) {
    for (const card of player.bank) {
      selections.push({ cardId: card.id, source: 'bank' })
    }
    for (const color of PROPERTY_COLORS) {
      for (const card of player.properties[color]) {
        selections.push({ cardId: card.id, source: color })
      }
    }
    return selections
  }

  // Pay from bank — sort order depends on difficulty
  const bankCards = [...player.bank]
  if (config.paymentSortOrder === 'largest-first') {
    bankCards.sort((a, b) => b.bankValue - a.bankValue) // Beginner: overpays with big bills
  } else {
    bankCards.sort((a, b) => a.bankValue - b.bankValue) // Optimal: smallest first
  }

  for (const card of bankCards) {
    if (remaining <= 0) break
    selections.push({ cardId: card.id, source: 'bank' })
    remaining -= card.bankValue
  }
  if (remaining <= 0) return selections

  // Then pay from properties (least strategically valuable first)
  const rankedProps = rankPropertiesByExpendability(player, config.paymentProtectComplete, config.paymentProtectNearComplete)
  for (const { cardId, color } of rankedProps) {
    if (remaining <= 0) break
    if (selections.some(s => s.cardId === cardId)) continue
    const card = player.properties[color].find(c => c.id === cardId)
    if (!card) continue
    selections.push({ cardId, source: color })
    remaining -= card.bankValue
  }

  return selections
}

// Rank properties from most expendable to least
function rankPropertiesByExpendability(
  player: PlayerState,
  protectComplete: boolean,
  protectNearComplete: boolean,
): { cardId: string; color: PropertyColor; score: number }[] {
  const result: { cardId: string; color: PropertyColor; score: number }[] = []

  for (const color of PROPERTY_COLORS) {
    const cards = player.properties[color]
    const needed = SET_SIZES[color]
    const complete = isSetComplete(color, cards)

    for (const card of cards) {
      let score = 0
      if (complete && protectComplete) {
        score = 100
      } else if (cards.length === needed - 1 && protectNearComplete) {
        score = 50
      } else {
        score = cards.length * 10
      }
      if (card.type === 'wildcard') score += 5
      result.push({ cardId: card.id, color, score })
    }
  }

  result.sort((a, b) => a.score - b.score)
  return result
}

// Validate a player's payment selection
export function validatePayment(
  player: PlayerState,
  payments: PaymentSelection[],
  requiredAmount: number,
): boolean {
  let total = 0
  for (const payment of payments) {
    if (payment.source === 'bank') {
      const card = player.bank.find(c => c.id === payment.cardId)
      if (!card) return false
      total += card.bankValue
    } else {
      const card = player.properties[payment.source].find(c => c.id === payment.cardId)
      if (!card) return false
      total += card.bankValue
    }
  }
  const totalAssets = getTotalAssets(player)
  // Player must pay at least the amount, or everything they have
  return total >= requiredAmount || total >= totalAssets
}
