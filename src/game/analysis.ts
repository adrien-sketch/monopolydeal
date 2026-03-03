import type { GameState } from './types'
import { PROPERTY_COLORS } from './types'
import { countCompleteSets, getTotalBankValue, isSetComplete } from './sets'
import { COLOR_NAMES } from './constants'

export interface Tip {
  type: 'positive' | 'improvement'
  icon: string
  text: string
}

export interface GameAnalysis {
  score: number
  tips: Tip[]
}

export function analyzeGame(state: GameState): GameAnalysis {
  const tips: Tip[] = []
  let score = 50

  const human = state.players.human
  const bot = state.players.bot
  const won = state.winner === 'human'
  const humanLogs = state.actionLog.filter(l => l.player === 'human')
  const botLogs = state.actionLog.filter(l => l.player === 'bot')

  // --- Win/Loss ---
  if (won) {
    score += 25
    tips.push({ type: 'positive', icon: '🏆', text: 'Bravo, tu as gagné la partie !' })
  } else {
    score -= 10
    tips.push({ type: 'improvement', icon: '💀', text: 'Tu as perdu cette partie. Analyse tes erreurs pour progresser !' })
  }

  // --- Complete sets ---
  const humanSets = countCompleteSets(human)
  const botSets = countCompleteSets(bot)

  if (humanSets > 0) {
    score += humanSets * 8
    const completedColors = PROPERTY_COLORS.filter(c =>
      isSetComplete(c, human.properties[c])
    )
    for (const color of completedColors) {
      tips.push({ type: 'positive', icon: '💥', text: `Tu as complété le set ${COLOR_NAMES[color]}.` })
    }
  }

  if (!won && humanSets === 0) {
    score -= 10
    tips.push({ type: 'improvement', icon: '📉', text: "Tu n'avais aucun set complet à la fin. Concentre-toi sur compléter des sets petits (Marron, Bleu foncé, Service)." })
  }

  if (botSets > humanSets) {
    score -= (botSets - humanSets) * 5
  }

  // --- Action cards usage ---
  const humanPlayedRent = humanLogs.some(l => l.message.includes('loyer'))
  const humanPlayedDebt = humanLogs.some(l => l.message.includes('Agent de Recouvrement'))
  const humanPlayedSlyDeal = humanLogs.some(l => l.message.includes('Deal Duel') && !l.message.includes('rien à voler'))
  const humanPlayedDealBreaker = humanLogs.some(l => l.message.includes('Deal Jackpot') && !l.message.includes('pas de set'))
  const humanPlayedPassGo = humanLogs.some(l => l.message.includes('Départ'))
  const humanPlayedJSN = humanLogs.some(l => l.message.includes('Juste dire non'))
  const humanBlockedAction = humanLogs.some(l => l.message.includes('bloque'))

  if (humanPlayedRent) {
    score += 5
    tips.push({ type: 'positive', icon: '💰', text: 'Tu as bien utilisé tes cartes loyer pour collecter de l\'argent.' })
  }
  if (humanPlayedDebt) {
    score += 5
    tips.push({ type: 'positive', icon: '💸', text: 'Bon usage de l\'Agent de Recouvrement.' })
  }
  if (humanPlayedSlyDeal) {
    score += 5
    tips.push({ type: 'positive', icon: '🕵️', text: 'Tu as volé une propriété avec Deal Duel, bien joué !' })
  }
  if (humanPlayedDealBreaker) {
    score += 8
    tips.push({ type: 'positive', icon: '⚔️', text: 'Tu as utilisé Deal Jackpot pour voler un set complet !' })
  }
  if (humanPlayedJSN || humanBlockedAction) {
    score += 8
    tips.push({ type: 'positive', icon: '🛡️', text: 'Tu as bien bloqué une attaque avec Juste dire non !' })
  }

  // --- Houses/Hotels ---
  let housesPlayed = 0
  let hotelsPlayed = 0
  for (const color of PROPERTY_COLORS) {
    housesPlayed += human.houses[color]
    hotelsPlayed += human.hotels[color]
  }
  if (housesPlayed > 0 || hotelsPlayed > 0) {
    score += (housesPlayed + hotelsPlayed) * 5
    tips.push({ type: 'positive', icon: '🏠', text: 'Tu as placé des maisons/hôtels pour augmenter tes loyers.' })
  }

  // --- Bank management ---
  const bankValue = getTotalBankValue(human)
  if (bankValue >= 5) {
    score += 5
    tips.push({ type: 'positive', icon: '🏦', text: `Bonne gestion de banque (${bankValue}M).` })
  }

  // --- IMPROVEMENT TIPS ---

  // Unused action cards in hand
  const unusedActions = human.hand.filter(c => c.type === 'action' || c.type === 'rent')
  for (const card of unusedActions) {
    if (card.actionType === 'debtCollector') {
      score -= 5
      tips.push({ type: 'improvement', icon: '💸', text: `Tu avais un Agent de Recouvrement en main que tu aurais pu jouer pour forcer le bot à payer 5M.` })
    } else if (card.actionType === 'slyDeal') {
      score -= 5
      tips.push({ type: 'improvement', icon: '🕵️', text: `Tu avais un Deal Duel en main — tu aurais pu voler une propriété au bot.` })
    } else if (card.actionType === 'dealBreaker') {
      score -= 5
      tips.push({ type: 'improvement', icon: '⚔️', text: `Tu avais un Deal Jackpot en main ! C'est la carte la plus puissante du jeu.` })
    } else if (card.actionType === 'forcedDeal') {
      score -= 5
      tips.push({ type: 'improvement', icon: '🔄', text: `Tu avais un Deal Troc en main — un échange de propriété aurait pu t'aider.` })
    } else if (card.actionType === 'passGo') {
      score -= 5
      tips.push({ type: 'improvement', icon: '🃏', text: `Tu avais un Départ en main — le jouer t'aurait permis de piocher 2 cartes.` })
    } else if (card.type === 'rent') {
      score -= 5
      tips.push({ type: 'improvement', icon: '💰', text: `Tu avais une carte Loyer en main que tu aurais pu jouer.` })
    }
  }

  // Never played rent
  if (!humanPlayedRent && state.turnNumber > 4) {
    score -= 8
    tips.push({ type: 'improvement', icon: '💰', text: "Tu n'as jamais joué de carte loyer. Le loyer est un moyen important de collecter de l'argent !" })
  }

  // Set stolen via Deal Breaker (check if bot stole a complete set from human)
  const botStoleSet = botLogs.some(l => l.message.includes('vole le set complet'))
  if (botStoleSet) {
    score -= 8
    tips.push({ type: 'improvement', icon: '⚠️', text: "Un de tes sets complets a été volé par Deal Jackpot. Essaie de garder tes sets à N-1 cartes tant que tu n'as pas 3 sets d'un coup, sauf si tu as un Juste dire non pour te protéger." })
  }

  // Bot stole property from human
  const botStoleProperty = botLogs.some(l => l.message.includes('vole') && l.message.includes('à human'))
  if (botStoleProperty && !botStoleSet) {
    score -= 3
    tips.push({ type: 'improvement', icon: '🕵️', text: "Le bot t'a volé une propriété. Garde un Juste dire non en main pour te protéger !" })
  }

  // Pass Go not used early
  if (!humanPlayedPassGo && state.turnNumber > 6) {
    score -= 3
    tips.push({ type: 'improvement', icon: '🃏', text: "Tu n'as pas utilisé de Départ. Piocher des cartes en début de partie donne un avantage !" })
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score))

  return { score, tips }
}
