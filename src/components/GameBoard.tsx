import { useEffect, useRef, useCallback, useState } from 'react'
import { useGame } from '../state/context'
import type { Card as CardType, PropertyColor } from '../game/types'
import { Card } from './Card'
import { PlayerArea } from './PlayerArea'
import { ActionLog } from './ActionLog'
import { PaymentModal } from './PaymentModal'
import { PropertyPickerModal } from './PropertyPickerModal'
import { SetPickerModal } from './SetPickerModal'
import { JustSayNoModal } from './JustSayNoModal'
import { DiscardModal } from './DiscardModal'
import { ColorPickerModal } from './ColorPickerModal'
import { HelpButton } from './HelpModal'
import {
  computeBotTurn, shouldBotPlayJustSayNo, botSelectPropertyToSteal,
  botSelectSetToSteal, botSelectPropertyToGive,
} from '../game/bot'
import { chooseBotPayment } from '../game/payment'
import { getHouseableColors, getHotelableColors } from '../game/engine'
import '../styles/layout.css'

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= breakpoint
  )
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return mobile
}

type ColorPickerContext =
  | { purpose: 'wildcard'; cardId: string; colors: PropertyColor[] }
  | { purpose: 'rent'; cardId: string; colors: PropertyColor[] }
  | { purpose: 'house'; cardId: string; colors: PropertyColor[] }
  | { purpose: 'hotel'; cardId: string; colors: PropertyColor[] }

export function GameBoard({ onGameOver }: { onGameOver: (won: boolean) => void }) {
  const { state, dispatch } = useGame()
  const botBusy = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const [colorPicker, setColorPicker] = useState<ColorPickerContext | null>(null)
  const [pendingDoubleRent, setPendingDoubleRent] = useState<{ cardId: string; color: PropertyColor; doubleCardId: string } | null>(null)
  const [showEndTurnConfirm, setShowEndTurnConfirm] = useState(false)
  const [previewCard, setPreviewCard] = useState<CardType | null>(null)
  const isMobile = useIsMobile()

  // Check for game over
  useEffect(() => {
    if (state.winner) {
      const timer = setTimeout(() => onGameOver(state.winner === 'human'), 1500)
      return () => clearTimeout(timer)
    }
  }, [state.winner, onGameOver])

  // Single bot effect: handles all bot decisions
  useEffect(() => {
    if (state.winner) return
    if (botBusy.current) return

    // Bot draw phase
    if (state.currentPlayer === 'bot' && state.turnPhase === 'draw') {
      botBusy.current = true
      const t = setTimeout(() => {
        botBusy.current = false
        dispatch({ type: 'DRAW_CARDS' })
      }, 600)
      return () => { clearTimeout(t); botBusy.current = false }
    }

    // Bot play phase
    if (state.currentPlayer === 'bot' && state.turnPhase === 'play') {
      botBusy.current = true
      const actions = computeBotTurn(state)
      if (actions.length === 0) {
        const t = setTimeout(() => {
          botBusy.current = false
          dispatch({ type: 'END_TURN' })
        }, 600)
        return () => { clearTimeout(t); botBusy.current = false }
      }
      // Play first action only, let state update trigger next
      const t = setTimeout(() => {
        botBusy.current = false
        dispatch(actions[0])
      }, 800)
      return () => { clearTimeout(t); botBusy.current = false }
    }

    // Bot responds to Just Say No
    if (state.pendingAction?.type === 'justSayNo') {
      const jsn = state.pendingAction
      const responder = jsn.depth % 2 === 0 ? jsn.target : jsn.challenger
      if (responder === 'bot') {
        botBusy.current = true
        const t = setTimeout(() => {
          botBusy.current = false
          if (shouldBotPlayJustSayNo(stateRef.current)) {
            dispatch({ type: 'PLAY_JUST_SAY_NO' })
          } else {
            dispatch({ type: 'ACCEPT_ACTION' })
          }
        }, 1000)
        return () => { clearTimeout(t); botBusy.current = false }
      }
    }

    // Bot pays debt
    if (state.pendingAction?.type === 'payDebt' && state.pendingAction.debtor === 'bot') {
      botBusy.current = true
      const payments = chooseBotPayment(state.players.bot, state.pendingAction.amount, state.difficulty)
      const t = setTimeout(() => {
        botBusy.current = false
        dispatch({ type: 'PAY_DEBT', payments })
      }, 800)
      return () => { clearTimeout(t); botBusy.current = false }
    }

    // Bot selects property (Sly Deal / Forced Deal)
    if (state.pendingAction?.type === 'selectProperty' && state.pendingAction.player === 'bot') {
      botBusy.current = true
      const result = botSelectPropertyToSteal(state)
      if (result) {
        const t = setTimeout(() => {
          botBusy.current = false
          dispatch({ type: 'SELECT_PROPERTY', cardId: result.cardId })
        }, 800)
        return () => { clearTimeout(t); botBusy.current = false }
      }
      botBusy.current = false
    }

    // Bot gives property (Forced Deal)
    if (state.pendingAction?.type === 'selectOwnProperty' && state.pendingAction.player === 'bot') {
      botBusy.current = true
      const result = botSelectPropertyToGive(state)
      if (result) {
        const t = setTimeout(() => {
          botBusy.current = false
          dispatch({ type: 'SELECT_OWN_PROPERTY', cardId: result.cardId })
        }, 800)
        return () => { clearTimeout(t); botBusy.current = false }
      }
      botBusy.current = false
    }

    // Bot selects set (Deal Breaker)
    if (state.pendingAction?.type === 'selectSet' && state.pendingAction.player === 'bot') {
      botBusy.current = true
      const color = botSelectSetToSteal(state)
      if (color) {
        const t = setTimeout(() => {
          botBusy.current = false
          dispatch({ type: 'SELECT_SET', color })
        }, 800)
        return () => { clearTimeout(t); botBusy.current = false }
      }
      botBusy.current = false
    }

    // Bot discards
    if (state.pendingAction?.type === 'discard' && state.pendingAction.player === 'bot') {
      botBusy.current = true
      const hand = [...state.players.bot.hand].sort((a, b) => a.bankValue - b.bankValue)
      const toDiscard = hand.slice(0, state.pendingAction.mustDiscardCount).map(c => c.id)
      const t = setTimeout(() => {
        botBusy.current = false
        dispatch({ type: 'DISCARD_CARDS', cardIds: toDiscard })
      }, 800)
      return () => { clearTimeout(t); botBusy.current = false }
    }

    // Bot end turn (after 3 cards played)
    if (state.currentPlayer === 'bot' && state.turnPhase === 'play' && state.cardsPlayedThisTurn >= 3) {
      botBusy.current = true
      const t = setTimeout(() => {
        botBusy.current = false
        dispatch({ type: 'END_TURN' })
      }, 600)
      return () => { clearTimeout(t); botBusy.current = false }
    }
  }, [state, dispatch])

  const handleCardPlay = useCallback((card: CardType) => {
    const s = stateRef.current
    if (s.currentPlayer !== 'human' || s.turnPhase !== 'play' || s.cardsPlayedThisTurn >= 3) return
    if (s.pendingAction) return

    if (card.type === 'money') {
      dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
    } else if (card.type === 'property') {
      dispatch({ type: 'PLAY_PROPERTY', cardId: card.id, color: card.color! })
    } else if (card.type === 'action') {
      if (card.actionType === 'justSayNo' || card.actionType === 'doubleTheRent') {
        dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
      } else if (card.actionType === 'house') {
        const eligible = getHouseableColors(s.players.human)
        if (eligible.length === 1) {
          dispatch({ type: 'PLAY_HOUSE', cardId: card.id, color: eligible[0] })
        } else if (eligible.length > 1) {
          setColorPicker({ purpose: 'house', cardId: card.id, colors: eligible })
        } else {
          dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
        }
      } else if (card.actionType === 'hotel') {
        const eligible = getHotelableColors(s.players.human)
        if (eligible.length === 1) {
          dispatch({ type: 'PLAY_HOTEL', cardId: card.id, color: eligible[0] })
        } else if (eligible.length > 1) {
          setColorPicker({ purpose: 'hotel', cardId: card.id, colors: eligible })
        } else {
          dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
        }
      } else {
        dispatch({ type: 'PLAY_ACTION', cardId: card.id })
      }
    } else if (card.type === 'rent') {
      if (card.colors) {
        // Only show colors where the player actually has properties
        const validColors = card.colors.filter(c => s.players.human.properties[c].length > 0)
        if (validColors.length === 0) {
          dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
        } else if (validColors.length === 1) {
          maybeDoubleRent(card.id, validColors[0])
        } else {
          setColorPicker({ purpose: 'rent', cardId: card.id, colors: validColors })
        }
      }
    } else if (card.type === 'wildcard') {
      if (card.colors && card.colors.length > 0) {
        if (card.colors.length === 1) {
          dispatch({ type: 'PLAY_PROPERTY', cardId: card.id, color: card.colors[0] })
        } else {
          setColorPicker({ purpose: 'wildcard', cardId: card.id, colors: card.colors })
        }
      }
    }
  }, [dispatch])

  const maybeDoubleRent = useCallback((rentCardId: string, color: PropertyColor) => {
    const s = stateRef.current
    // Check if player has a Double The Rent card and room for 2 plays
    if (s.cardsPlayedThisTurn < 2) {
      const doubleCard = s.players.human.hand.find(
        c => c.actionType === 'doubleTheRent' && c.id !== rentCardId
      )
      if (doubleCard) {
        setPendingDoubleRent({ cardId: rentCardId, color, doubleCardId: doubleCard.id })
        return
      }
    }
    dispatch({ type: 'PLAY_RENT', cardId: rentCardId, color, doubled: false })
  }, [dispatch])

  const handleColorSelected = useCallback((color: PropertyColor) => {
    if (!colorPicker) return
    if (colorPicker.purpose === 'wildcard') {
      dispatch({ type: 'PLAY_PROPERTY', cardId: colorPicker.cardId, color })
    } else if (colorPicker.purpose === 'house') {
      dispatch({ type: 'PLAY_HOUSE', cardId: colorPicker.cardId, color })
    } else if (colorPicker.purpose === 'hotel') {
      dispatch({ type: 'PLAY_HOTEL', cardId: colorPicker.cardId, color })
    } else {
      // rent
      setColorPicker(null)
      maybeDoubleRent(colorPicker.cardId, color)
      return
    }
    setColorPicker(null)
  }, [colorPicker, dispatch, maybeDoubleRent])

  const handlePlayAsMoney = useCallback((card: CardType) => {
    const s = stateRef.current
    if (s.currentPlayer !== 'human' || s.turnPhase !== 'play' || s.cardsPlayedThisTurn >= 3) return
    dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
  }, [dispatch])

  const isHumanTurn = state.currentPlayer === 'human'
  const canPlay = isHumanTurn && state.turnPhase === 'play' && state.cardsPlayedThisTurn < 3 && !state.pendingAction

  // Modal states
  const showPayment = state.pendingAction?.type === 'payDebt' && state.pendingAction.debtor === 'human'
  const showPropertyPicker = state.pendingAction?.type === 'selectProperty' && state.pendingAction.player === 'human'
  const showOwnPropertyPicker = state.pendingAction?.type === 'selectOwnProperty' && state.pendingAction.player === 'human'
  const showSetPicker = state.pendingAction?.type === 'selectSet' && state.pendingAction.player === 'human'
  const showJustSayNo = state.pendingAction?.type === 'justSayNo' &&
    ((state.pendingAction.depth % 2 === 0 && state.pendingAction.target === 'human') ||
     (state.pendingAction.depth % 2 !== 0 && state.pendingAction.challenger === 'human'))
  const showDiscard = state.pendingAction?.type === 'discard' && state.pendingAction.player === 'human'

  const humanHasJSN = state.players.human.hand.some(c => c.actionType === 'justSayNo')

  // Auto-accept when human has no Just Say No card (skip the modal)
  useEffect(() => {
    if (showJustSayNo && !humanHasJSN) {
      const t = setTimeout(() => {
        dispatch({ type: 'ACCEPT_ACTION' })
      }, 400)
      return () => clearTimeout(t)
    }
  }, [showJustSayNo, humanHasJSN, dispatch])

  // Dismiss card preview if card is no longer in hand
  useEffect(() => {
    if (previewCard && !state.players.human.hand.find(c => c.id === previewCard.id)) {
      setPreviewCard(null)
    }
  }, [previewCard, state.players.human.hand])

  return (
    <div className="game-board">
      <HelpButton />
      {/* Opponent area */}
      <div className="opponent-area">
        <div className="opponent-area__info">
          <strong className="opponent-area__name">
            Bot ({state.difficulty === 'beginner' ? 'Débutant' : state.difficulty === 'intermediate' ? 'Intermédiaire' : 'Expert'})
          </strong>
          <div className="opponent-area__hand-summary">
            <Card
              card={{ id: 'hidden-stack', type: 'money', name: '', bankValue: 0 }}
              faceDown
              small
            />
            <span className="opponent-area__count">{state.players.bot.hand.length} cartes</span>
          </div>
        </div>
        <PlayerArea player={state.players.bot} />
      </div>

      {/* Middle area */}
      <div className="middle-area">
        <div className="middle-area__center" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="draw-pile">
              <Card
                card={{ id: 'draw', type: 'money', name: '', bankValue: 0 }}
                faceDown
                small
              />
              <span className="draw-pile__count">{state.drawPile.length}</span>
            </div>
            {state.discardPile.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Card card={state.discardPile[state.discardPile.length - 1]} small />
                <span className="discard-pile__label">Défausse</span>
              </div>
            )}
          </div>

          {/* Turn info */}
          <div className={`turn-controls ${isHumanTurn ? 'turn-controls--human' : 'turn-controls--bot'}`}>
            <span className="turn-controls__info">
              Tour {state.turnNumber} — {isHumanTurn ? 'Votre tour' : 'Tour du Bot'}
              {state.turnPhase === 'play' && ` — ${state.cardsPlayedThisTurn}/3 cartes jouées`}
            </span>
            {isHumanTurn && state.turnPhase === 'draw' && (
              <button className="turn-controls__btn" onClick={() => dispatch({ type: 'DRAW_CARDS' })}>
                Piocher
              </button>
            )}
            {isHumanTurn && state.turnPhase === 'play' && !state.pendingAction && (
              <button className="turn-controls__btn" onClick={() => {
                if (state.cardsPlayedThisTurn < 2 && state.players.human.hand.length > 0) {
                  setShowEndTurnConfirm(true)
                } else {
                  dispatch({ type: 'END_TURN' })
                }
              }}>
                Fin du tour
              </button>
            )}
          </div>
        </div>
        <ActionLog entries={state.actionLog} />
      </div>

      {/* Player area */}
      <div className="player-area">
        <PlayerArea player={state.players.human} />
        <div className="hand">
          {state.players.human.hand.map((card, i) => {
            const count = state.players.human.hand.length
            const ml = isMobile ? 4 : (count <= 5 ? 6 : count <= 8 ? -6 : -14)
            return (
              <div
                key={card.id}
                className="hand__card"
                style={{ marginLeft: i === 0 ? 0 : ml }}
                onClick={isMobile ? () => setPreviewCard(card) : undefined}
              >
                <Card
                  card={card}
                  selected={false}
                  disabled={!canPlay}
                  playable={canPlay}
                  disabledReason={
                    !isHumanTurn ? 'C\'est le tour du bot' :
                    state.turnPhase === 'draw' ? 'Vous devez d\'abord piocher' :
                    state.cardsPlayedThisTurn >= 3 ? '3 cartes déjà jouées' :
                    state.pendingAction ? 'Action en cours...' : undefined
                  }
                  onClick={!isMobile ? () => handleCardPlay(card) : undefined}
                />
                {!isMobile && canPlay && card.bankValue > 0 && card.type !== 'money' && (
                  <button
                    className="card__play-as-money"
                    onClick={(e) => { e.stopPropagation(); handlePlayAsMoney(card) }}
                  >
                    {card.bankValue}M
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      {showPayment && state.pendingAction?.type === 'payDebt' && (
        <PaymentModal
          amount={state.pendingAction.amount}
          reason={state.pendingAction.reason}
          player={state.players.human}
          onPay={(payments) => dispatch({ type: 'PAY_DEBT', payments })}
        />
      )}
      {showPropertyPicker && state.pendingAction?.type === 'selectProperty' && (
        <PropertyPickerModal
          targetPlayer={state.players[state.pendingAction.targetPlayer]}
          purpose={state.pendingAction.purpose}
          onSelect={(cardId) => dispatch({ type: 'SELECT_PROPERTY', cardId })}
        />
      )}
      {showOwnPropertyPicker && (
        <PropertyPickerModal
          targetPlayer={state.players.human}
          purpose="forcedDeal-give"
          onSelect={(cardId) => dispatch({ type: 'SELECT_OWN_PROPERTY', cardId })}
          title="Choisissez une propriété à donner"
        />
      )}
      {showSetPicker && state.pendingAction?.type === 'selectSet' && (
        <SetPickerModal
          targetPlayer={state.players[state.pendingAction.targetPlayer]}
          onSelect={(color) => dispatch({ type: 'SELECT_SET', color })}
        />
      )}
      {showJustSayNo && humanHasJSN && state.pendingAction?.type === 'justSayNo' && (
        <JustSayNoModal
          hasCard={true}
          originalAction={state.pendingAction.originalAction}
          onPlay={() => dispatch({ type: 'PLAY_JUST_SAY_NO' })}
          onAccept={() => dispatch({ type: 'ACCEPT_ACTION' })}
        />
      )}
      {showDiscard && state.pendingAction?.type === 'discard' && (
        <DiscardModal
          hand={state.players.human.hand}
          mustDiscard={state.pendingAction.mustDiscardCount}
          onDiscard={(cardIds) => dispatch({ type: 'DISCARD_CARDS', cardIds })}
        />
      )}
      {colorPicker && (
        <ColorPickerModal
          colors={colorPicker.colors}
          title={
            colorPicker.purpose === 'wildcard' ? 'Choisissez la couleur du Joker' :
            colorPicker.purpose === 'house' ? 'Placer la Maison sur quel set ?' :
            colorPicker.purpose === 'hotel' ? 'Placer l\'Hôtel sur quel set ?' :
            'Choisissez la couleur du Loyer'
          }
          onSelect={handleColorSelected}
        />
      )}
      {pendingDoubleRent && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <h3 className="modal__title">Doubler le loyer ?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Vous avez une carte Double Loyer. Voulez-vous doubler le loyer demandé ? (compte comme 2 cartes jouées)
            </p>
            <div className="modal__actions" style={{ justifyContent: 'center' }}>
              <button
                className="modal__btn modal__btn--secondary"
                onClick={() => {
                  dispatch({ type: 'PLAY_RENT', cardId: pendingDoubleRent.cardId, color: pendingDoubleRent.color, doubled: false })
                  setPendingDoubleRent(null)
                }}
              >
                Non
              </button>
              <button
                className="modal__btn modal__btn--primary"
                onClick={() => {
                  dispatch({ type: 'PLAY_RENT', cardId: pendingDoubleRent.cardId, color: pendingDoubleRent.color, doubled: true, doubleCardId: pendingDoubleRent.doubleCardId })
                  setPendingDoubleRent(null)
                }}
              >
                Oui, doubler !
              </button>
            </div>
          </div>
        </div>
      )}
      {showEndTurnConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <h3 className="modal__title">Terminer le tour ?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Vous n'avez joué que {state.cardsPlayedThisTurn}/3 carte{state.cardsPlayedThisTurn !== 1 ? 's' : ''}. Terminer quand même ?
            </p>
            <div className="modal__actions" style={{ justifyContent: 'center' }}>
              <button
                className="modal__btn modal__btn--secondary"
                onClick={() => setShowEndTurnConfirm(false)}
              >
                Continuer à jouer
              </button>
              <button
                className="modal__btn modal__btn--primary"
                onClick={() => {
                  setShowEndTurnConfirm(false)
                  dispatch({ type: 'END_TURN' })
                }}
              >
                Fin du tour
              </button>
            </div>
          </div>
        </div>
      )}
      {previewCard && (
        <div className="card-preview-overlay" onClick={() => setPreviewCard(null)}>
          <div className="card-preview" onClick={(e) => e.stopPropagation()}>
            <div className="card-preview__card-wrapper">
              <Card card={previewCard} />
            </div>
            {canPlay ? (
              <div className="card-preview__actions">
                <button
                  className="card-preview__btn card-preview__btn--play"
                  onClick={() => { const c = previewCard; setPreviewCard(null); handleCardPlay(c) }}
                >
                  Jouer
                </button>
                {previewCard.bankValue > 0 && previewCard.type !== 'money' && (
                  <button
                    className="card-preview__btn card-preview__btn--money"
                    onClick={() => { const c = previewCard; setPreviewCard(null); handlePlayAsMoney(c) }}
                  >
                    Banque ({previewCard.bankValue}M)
                  </button>
                )}
              </div>
            ) : (
              <p className="card-preview__hint">Touchez à côté pour fermer</p>
            )}
          </div>
        </div>
      )}
      {state.winner && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <h2 className="modal__title">
              {state.winner === 'human' ? 'Victoire !' : 'Défaite...'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {state.winner === 'human' ? 'Vous avez 3 sets complets !' : 'Le bot a complété 3 sets avant vous.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
