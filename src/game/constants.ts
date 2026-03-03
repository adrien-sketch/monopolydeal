import type { PropertyColor, ActionType } from './types'

// Number of property cards needed to complete each set
export const SET_SIZES: Record<PropertyColor, number> = {
  brown: 2,
  lightBlue: 3,
  pink: 3,
  orange: 3,
  red: 3,
  yellow: 3,
  green: 3,
  darkBlue: 2,
  railroad: 4,
  utility: 2,
}

// Rent values indexed by number of properties in the set [1, 2, 3, 4]
export const RENT_TABLE: Record<PropertyColor, number[]> = {
  brown:     [1, 2],
  lightBlue: [1, 2, 3],
  pink:      [1, 2, 4],
  orange:    [1, 3, 5],
  red:       [2, 3, 6],
  yellow:    [2, 4, 6],
  green:     [2, 4, 7],
  darkBlue:  [3, 8],
  railroad:  [1, 2, 3, 4],
  utility:   [1, 2],
}

// House adds 3M rent, Hotel adds 4M rent (on top of house)
export const HOUSE_RENT_BONUS = 3
export const HOTEL_RENT_BONUS = 4

// Bank values for action cards when played as money
export const ACTION_BANK_VALUES: Record<ActionType, number> = {
  passGo: 1,
  dealBreaker: 5,
  slyDeal: 3,
  forcedDeal: 3,
  debtCollector: 3,
  birthday: 2,
  justSayNo: 4,
  doubleTheRent: 1,
  house: 3,
  hotel: 4,
}

// Property display names
export const COLOR_NAMES: Record<PropertyColor, string> = {
  brown: 'Marron',
  lightBlue: 'Bleu clair',
  pink: 'Rose',
  orange: 'Orange',
  red: 'Rouge',
  yellow: 'Jaune',
  green: 'Vert',
  darkBlue: 'Bleu foncé',
  railroad: 'Gare',
  utility: 'Service',
}
