import type { Card, PropertyColor, ActionType } from './types'
import { ACTION_BANK_VALUES } from './constants'

// ===== Card Factories =====

function property(id: string, name: string, color: PropertyColor, bankValue: number): Card {
  return { id, type: 'property', name, bankValue, color }
}

function money(id: string, value: number): Card {
  return { id, type: 'money', name: `${value}M`, bankValue: value }
}

function action(id: string, name: string, actionType: ActionType): Card {
  return { id, type: 'action', name, bankValue: ACTION_BANK_VALUES[actionType], actionType }
}

function rent(id: string, colors: PropertyColor[], bankValue: number): Card {
  const name = colors.length === 10 ? 'Loyer Multicolore' : 'Loyer'
  return { id, type: 'rent', name, bankValue, colors }
}

function wildcard(id: string, colors: PropertyColor[], bankValue: number): Card {
  return { id, type: 'wildcard', name: 'Joker', bankValue, colors }
}

// ===== All 106 Cards =====

function createAllCards(): Card[] {
  const cards: Card[] = []

  // === PROPERTY CARDS (28) ===
  // Brown (2) — Marron
  cards.push(property('prop-brown-0', 'Boulevard de Belleville', 'brown', 1))
  cards.push(property('prop-brown-1', 'Rue Lecourbe', 'brown', 1))
  // Light Blue (3) — Bleu clair
  cards.push(property('prop-lightBlue-0', 'Rue de Vaugirard', 'lightBlue', 1))
  cards.push(property('prop-lightBlue-1', 'Rue de Courcelles', 'lightBlue', 1))
  cards.push(property('prop-lightBlue-2', 'Avenue de la République', 'lightBlue', 1))
  // Pink (3) — Rose / Violet
  cards.push(property('prop-pink-0', 'Boulevard de la Villette', 'pink', 2))
  cards.push(property('prop-pink-1', 'Avenue de Neuilly', 'pink', 2))
  cards.push(property('prop-pink-2', 'Rue de Paradis', 'pink', 2))
  // Orange (3)
  cards.push(property('prop-orange-0', 'Avenue Mozart', 'orange', 2))
  cards.push(property('prop-orange-1', 'Boulevard Saint-Michel', 'orange', 2))
  cards.push(property('prop-orange-2', 'Place Pigalle', 'orange', 2))
  // Red (3) — Rouge
  cards.push(property('prop-red-0', 'Avenue Matignon', 'red', 3))
  cards.push(property('prop-red-1', 'Boulevard Malesherbes', 'red', 3))
  cards.push(property('prop-red-2', 'Avenue Henri-Martin', 'red', 3))
  // Yellow (3) — Jaune
  cards.push(property('prop-yellow-0', 'Faubourg Saint-Honoré', 'yellow', 3))
  cards.push(property('prop-yellow-1', 'Place de la Bourse', 'yellow', 3))
  cards.push(property('prop-yellow-2', 'Rue La Fayette', 'yellow', 3))
  // Green (3) — Vert
  cards.push(property('prop-green-0', 'Avenue de Breteuil', 'green', 4))
  cards.push(property('prop-green-1', 'Avenue Foch', 'green', 4))
  cards.push(property('prop-green-2', 'Boulevard des Capucines', 'green', 4))
  // Dark Blue (2) — Bleu foncé
  cards.push(property('prop-darkBlue-0', 'Avenue des Champs-Élysées', 'darkBlue', 4))
  cards.push(property('prop-darkBlue-1', 'Rue de la Paix', 'darkBlue', 4))
  // Railroad (4) — Gares
  cards.push(property('prop-railroad-0', 'Gare Montparnasse', 'railroad', 2))
  cards.push(property('prop-railroad-1', 'Gare de Lyon', 'railroad', 2))
  cards.push(property('prop-railroad-2', 'Gare du Nord', 'railroad', 2))
  cards.push(property('prop-railroad-3', 'Gare Saint-Lazare', 'railroad', 2))
  // Utility (2) — Services
  cards.push(property('prop-utility-0', 'Compagnie de distribution d\'électricité', 'utility', 2))
  cards.push(property('prop-utility-1', 'Compagnie des eaux', 'utility', 2))

  // === MONEY CARDS (20) ===
  // 6x 1M, 5x 2M, 3x 3M, 3x 4M, 2x 5M, 1x 10M
  for (let i = 0; i < 6; i++) cards.push(money(`money-1-${i}`, 1))
  for (let i = 0; i < 5; i++) cards.push(money(`money-2-${i}`, 2))
  for (let i = 0; i < 3; i++) cards.push(money(`money-3-${i}`, 3))
  for (let i = 0; i < 3; i++) cards.push(money(`money-4-${i}`, 4))
  for (let i = 0; i < 2; i++) cards.push(money(`money-5-${i}`, 5))
  cards.push(money('money-10-0', 10))

  // === ACTION CARDS (34) ===
  // 10x Départ
  for (let i = 0; i < 10; i++) cards.push(action(`action-passGo-${i}`, 'Départ', 'passGo'))
  // 2x Deal Jackpot
  for (let i = 0; i < 2; i++) cards.push(action(`action-dealBreaker-${i}`, 'Deal Jackpot', 'dealBreaker'))
  // 3x Deal Duel
  for (let i = 0; i < 3; i++) cards.push(action(`action-slyDeal-${i}`, 'Deal Duel', 'slyDeal'))
  // 3x Deal Troc
  for (let i = 0; i < 3; i++) cards.push(action(`action-forcedDeal-${i}`, 'Deal Troc', 'forcedDeal'))
  // 3x Agent de Recouvrement
  for (let i = 0; i < 3; i++) cards.push(action(`action-debtCollector-${i}`, 'Agent de Recouvrement', 'debtCollector'))
  // 2x C'est mon Anniversaire !
  for (let i = 0; i < 2; i++) cards.push(action(`action-birthday-${i}`, 'C\'est mon Anniversaire !', 'birthday'))
  // 3x Juste dire non
  for (let i = 0; i < 3; i++) cards.push(action(`action-justSayNo-${i}`, 'Juste dire non', 'justSayNo'))
  // 2x Double Loyer
  for (let i = 0; i < 2; i++) cards.push(action(`action-doubleTheRent-${i}`, 'Double Loyer', 'doubleTheRent'))
  // 3x Maison
  for (let i = 0; i < 3; i++) cards.push(action(`action-house-${i}`, 'Maison', 'house'))
  // 3x Hôtel
  for (let i = 0; i < 3; i++) cards.push(action(`action-hotel-${i}`, 'Hôtel', 'hotel'))

  // === RENT CARDS (13) ===
  // 2x Brown/Light Blue
  const allColors: PropertyColor[] = ['brown', 'lightBlue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkBlue', 'railroad', 'utility']
  for (let i = 0; i < 2; i++) cards.push(rent(`rent-brown-lightBlue-${i}`, ['brown', 'lightBlue'], 1))
  // 2x Pink/Orange
  for (let i = 0; i < 2; i++) cards.push(rent(`rent-pink-orange-${i}`, ['pink', 'orange'], 1))
  // 2x Red/Yellow
  for (let i = 0; i < 2; i++) cards.push(rent(`rent-red-yellow-${i}`, ['red', 'yellow'], 1))
  // 2x Green/Dark Blue
  for (let i = 0; i < 2; i++) cards.push(rent(`rent-green-darkBlue-${i}`, ['green', 'darkBlue'], 1))
  // 2x Railroad/Utility
  for (let i = 0; i < 2; i++) cards.push(rent(`rent-railroad-utility-${i}`, ['railroad', 'utility'], 1))
  // 3x Any Color (Multicolor rent)
  for (let i = 0; i < 3; i++) cards.push(rent(`rent-any-${i}`, allColors, 3))

  // === WILDCARD PROPERTY CARDS (11) ===
  // Dual-color wildcards
  cards.push(wildcard('wild-green-darkBlue-0', ['green', 'darkBlue'], 4))
  cards.push(wildcard('wild-lightBlue-brown-0', ['lightBlue', 'brown'], 1))
  cards.push(wildcard('wild-lightBlue-railroad-0', ['lightBlue', 'railroad'], 4))
  cards.push(wildcard('wild-pink-orange-0', ['pink', 'orange'], 2))
  cards.push(wildcard('wild-railroad-green-0', ['railroad', 'green'], 4))
  cards.push(wildcard('wild-railroad-lightBlue-0', ['railroad', 'lightBlue'], 4))
  cards.push(wildcard('wild-railroad-utility-0', ['railroad', 'utility'], 2))
  cards.push(wildcard('wild-red-yellow-0', ['red', 'yellow'], 3))
  cards.push(wildcard('wild-red-yellow-1', ['red', 'yellow'], 3))
  // Rainbow wildcards (any color, 0 bank value)
  cards.push(wildcard('wild-any-0', allColors, 0))
  cards.push(wildcard('wild-any-1', allColors, 0))

  return cards
}

// ===== Shuffle (Fisher-Yates) =====
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ===== Create a fresh shuffled deck =====
export function createDeck(): Card[] {
  return shuffleDeck(createAllCards())
}

// ===== Get unshuffled deck (for testing) =====
export function createUnshuffledDeck(): Card[] {
  return createAllCards()
}
