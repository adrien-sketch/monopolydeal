import type { Difficulty, PropertyColor } from './types'

export interface BotConfig {
  // === evaluateState weights ===
  completeSetWeight: number
  winBonusWeight: number
  nearCompleteWeight: number
  propertyProgressWeight: number
  houseWeight: number
  hotelWeight: number
  bankValueMultiplier: number
  jsnDefensiveWeight: number
  oppSetPenalty: number
  oppNearCompletePenalty: number

  // === computeBotTurn action bonuses ===
  passGoFirstPlayBonus: number
  dealBreakerBonus: number
  slyDealBonus: number
  debtCollectorBonus: number
  birthdayBonus: number
  forcedDealBonus: number
  rentBonus: number
  jsnPenaltyIfOpponentHasJSN: number
  movePlayThreshold: number

  // === Beginner blunder ===
  blunderChance: number
  bankActionCardChance: number

  // === JSN decision ===
  jsnAlwaysBlockDealBreaker: boolean
  jsnAlwaysBlockPropertySteal: boolean
  jsnDebtThreshold: number
  jsnRandomFailChance: number

  // === Payment ===
  paymentSortOrder: 'smallest-first' | 'largest-first'
  paymentProtectNearComplete: boolean
  paymentProtectComplete: boolean

  // === Selection strategy ===
  selectionStrategy: 'optimal' | 'random'

  // === Advanced features ===
  phaseAwareness: boolean
  voltronStrategy: boolean
  rentBombCombo: boolean
  cardCounting: boolean
  propertyValuation: boolean
  denialPlays: boolean
  baitJSN: boolean

  colorPriority: Record<PropertyColor, number>
}

const DEFAULT_COLOR_PRIORITY: Record<PropertyColor, number> = {
  darkBlue: 100, green: 90, orange: 85, red: 80,
  yellow: 70, pink: 60, lightBlue: 50, railroad: 40,
  brown: 30, utility: 20,
}

const FLAT_COLOR_PRIORITY: Record<PropertyColor, number> = {
  darkBlue: 10, green: 10, orange: 10, red: 10,
  yellow: 10, pink: 10, lightBlue: 10, railroad: 10,
  brown: 10, utility: 10,
}

export const BOT_CONFIGS: Record<Difficulty, BotConfig> = {
  beginner: {
    completeSetWeight: 400,
    winBonusWeight: 100000,
    nearCompleteWeight: 60,
    propertyProgressWeight: 20,
    houseWeight: 30,
    hotelWeight: 40,
    bankValueMultiplier: 3,
    jsnDefensiveWeight: 20,
    oppSetPenalty: 100,
    oppNearCompletePenalty: 40,

    passGoFirstPlayBonus: 10,
    dealBreakerBonus: 200,
    slyDealBonus: 30,
    debtCollectorBonus: 100,
    birthdayBonus: 80,
    forcedDealBonus: 20,
    rentBonus: 80,
    jsnPenaltyIfOpponentHasJSN: 5,
    movePlayThreshold: -30,

    blunderChance: 0.25,
    bankActionCardChance: 0.15,

    jsnAlwaysBlockDealBreaker: false,
    jsnAlwaysBlockPropertySteal: false,
    jsnDebtThreshold: 3,
    jsnRandomFailChance: 0.30,

    paymentSortOrder: 'largest-first',
    paymentProtectNearComplete: false,
    paymentProtectComplete: false,

    selectionStrategy: 'random',

    phaseAwareness: false,
    voltronStrategy: false,
    rentBombCombo: false,
    cardCounting: false,
    propertyValuation: false,
    denialPlays: false,
    baitJSN: false,
    colorPriority: FLAT_COLOR_PRIORITY,
  },

  intermediate: {
    completeSetWeight: 1000,
    winBonusWeight: 100000,
    nearCompleteWeight: 200,
    propertyProgressWeight: 50,
    houseWeight: 80,
    hotelWeight: 100,
    bankValueMultiplier: 1,
    jsnDefensiveWeight: 80,
    oppSetPenalty: 300,
    oppNearCompletePenalty: 150,

    passGoFirstPlayBonus: 50,
    dealBreakerBonus: 500,
    slyDealBonus: 100,
    debtCollectorBonus: 80,
    birthdayBonus: 40,
    forcedDealBonus: 60,
    rentBonus: 60,
    jsnPenaltyIfOpponentHasJSN: 30,
    movePlayThreshold: -10,

    blunderChance: 0,
    bankActionCardChance: 0,

    jsnAlwaysBlockDealBreaker: true,
    jsnAlwaysBlockPropertySteal: true,
    jsnDebtThreshold: 5,
    jsnRandomFailChance: 0,

    paymentSortOrder: 'smallest-first',
    paymentProtectNearComplete: true,
    paymentProtectComplete: true,

    selectionStrategy: 'optimal',

    phaseAwareness: false,
    voltronStrategy: false,
    rentBombCombo: false,
    cardCounting: false,
    propertyValuation: false,
    denialPlays: false,
    baitJSN: false,
    colorPriority: FLAT_COLOR_PRIORITY,
  },

  advanced: {
    completeSetWeight: 1200,
    winBonusWeight: 100000,
    nearCompleteWeight: 300,
    propertyProgressWeight: 60,
    houseWeight: 120,
    hotelWeight: 150,
    bankValueMultiplier: 0.8,
    jsnDefensiveWeight: 150,
    oppSetPenalty: 500,
    oppNearCompletePenalty: 250,

    passGoFirstPlayBonus: 80,
    dealBreakerBonus: 600,
    slyDealBonus: 150,
    debtCollectorBonus: 100,
    birthdayBonus: 50,
    forcedDealBonus: 120,
    rentBonus: 80,
    jsnPenaltyIfOpponentHasJSN: 80,
    movePlayThreshold: 5,

    blunderChance: 0,
    bankActionCardChance: 0,

    jsnAlwaysBlockDealBreaker: true,
    jsnAlwaysBlockPropertySteal: true,
    jsnDebtThreshold: 5,
    jsnRandomFailChance: 0,

    paymentSortOrder: 'smallest-first',
    paymentProtectNearComplete: true,
    paymentProtectComplete: true,

    selectionStrategy: 'optimal',

    phaseAwareness: true,
    voltronStrategy: true,
    rentBombCombo: true,
    cardCounting: true,
    propertyValuation: true,
    denialPlays: true,
    baitJSN: true,
    colorPriority: DEFAULT_COLOR_PRIORITY,
  },
}

export function getBotConfig(difficulty: Difficulty): BotConfig {
  return BOT_CONFIGS[difficulty]
}

export function getGamePhase(turnNumber: number): 'opening' | 'midgame' | 'endgame' {
  if (turnNumber <= 6) return 'opening'
  if (turnNumber <= 14) return 'midgame'
  return 'endgame'
}
