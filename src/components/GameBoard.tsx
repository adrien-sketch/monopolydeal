import { useEffect, useRef, useCallback } from 'react'
import { useGame } from '../state/context'
import type { Card as CardType } from '../game/types'
import { Card } from './Card'
import { PlayerArea } from './PlayerArea'
import { ActionLog } from './ActionLog'
import { PaymentModal } from './PaymentModal'
import { PropertyPickerModal } from './PropertyPickerModal'
import { SetPickerModal } from './SetPickerModal'
import { JustSayNoModal } from './JustSayNoModal'
import { DiscardModal } from './DiscardModal'
import {
  computeBotTurn, shouldBotPlayJustSayNo, botSelectPropertyToSteal,
  botSelectSetToSteal, botSelectPropertyToGive,
} from '../game/bot'
import { chooseBotPayment } from '../game/payment'
import '../styles/layout.css'

export function GameBoard({ onGameOver }: { onGameOver: (won: boolean) => void }) {
  const { state, dispatch } = useGame()
  const botTimerRef = useRef<number | null>(null)

  // Clean up bot timer on unmount
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
    }
  }, [])

  // Check for game over
  useEffect(() => {
    if (state.winner) {
      const timer = setTimeout(() => onGameOver(state.winner === 'human'), 1500)
      return () => clearTimeout(timer)
    }
  }, [state.winner, onGameOver])

  // Bot auto-draw
  useEffect(() => {
    if (state.currentPlayer !== 'bot' || state.turnPhase !== 'draw' || state.winner) return
    botTimerRef.current = window.setTimeout(() => dispatch({ type: 'DRAW_CARDS' }), 600)
    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current) }
  }, [state.currentPlayer, state.turnPhase, state.winner, dispatch])

  // Bot play phase
  useEffect(() => {
    if (state.currentPlayer !== 'bot' || state.turnPhase !== 'play' || state.winner) return
    const actions = computeBotTurn(state)
    if (actions.length === 0) {
      botTimerRef.current = window.setTimeout(() => dispatch({ type: 'END_TURN' }), 600)
      return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current) }
    }

    let delay = 800
    const timers: number[] = []
    for (const action of actions) {
      timers.push(window.setTimeout(() => dispatch(action), delay))
      delay += 1000
    }
    timers.push(window.setTimeout(() => dispatch({ type: 'END_TURN' }), delay))
    return () => timers.forEach(clearTimeout)
  }, [state.currentPlayer, state.turnPhase, state.cardsPlayedThisTurn, state.winner, dispatch])

  // Bot responds to Just Say No prompts
  useEffect(() => {
    if (!state.pendingAction || state.pendingAction.type !== 'justSayNo') return
    const jsn = state.pendingAction
    const responder = jsn.depth % 2 === 0 ? jsn.target : jsn.challenger
    if (responder !== 'bot') return

    botTimerRef.current = window.setTimeout(() => {
      if (shouldBotPlayJustSayNo(state)) {
        dispatch({ type: 'PLAY_JUST_SAY_NO' })
      } else {
        dispatch({ type: 'ACCEPT_ACTION' })
      }
    }, 1000)
    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current) }
  }, [state.pendingAction, dispatch])

  // Bot auto-pay debts
  useEffect(() => {
    if (!state.pendingAction || state.pendingAction.type !== 'payDebt') return
    if (state.pendingAction.debtor !== 'bot') return

    const payments = chooseBotPayment(state.players.bot, state.pendingAction.amount)
    botTimerRef.current = window.setTimeout(() => {
      dispatch({ type: 'PAY_DEBT', payments })
    }, 800)
    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current) }
  }, [state.pendingAction, dispatch])

  // Bot selects property for steal
  useEffect(() => {
    if (!state.pendingAction) return
    if (state.pendingAction.type === 'selectProperty' && state.pendingAction.player === 'bot') {
      const result = botSelectPropertyToSteal(state)
      if (result) {
        botTimerRef.current = window.setTimeout(() => {
          dispatch({ type: 'SELECT_PROPERTY', cardId: result.cardId })
        }, 800)
      }
    }
    if (state.pendingAction.type === 'selectOwnProperty' && state.pendingAction.player === 'bot') {
      const result = botSelectPropertyToGive(state)
      if (result) {
        botTimerRef.current = window.setTimeout(() => {
          dispatch({ type: 'SELECT_OWN_PROPERTY', cardId: result.cardId })
        }, 800)
      }
    }
    if (state.pendingAction.type === 'selectSet' && state.pendingAction.player === 'bot') {
      const color = botSelectSetToSteal(state)
      if (color) {
        botTimerRef.current = window.setTimeout(() => {
          dispatch({ type: 'SELECT_SET', color })
        }, 800)
      }
    }
    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current) }
  }, [state.pendingAction, dispatch])

  // Bot discard
  useEffect(() => {
    if (!state.pendingAction || state.pendingAction.type !== 'discard') return
    if (state.pendingAction.player !== 'bot') return
    // Discard lowest value cards
    const hand = [...state.players.bot.hand].sort((a, b) => a.bankValue - b.bankValue)
    const toDiscard = hand.slice(0, state.pendingAction.mustDiscardCount).map(c => c.id)
    botTimerRef.current = window.setTimeout(() => {
      dispatch({ type: 'DISCARD_CARDS', cardIds: toDiscard })
    }, 800)
    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current) }
  }, [state.pendingAction, dispatch])

  const handleCardPlay = useCallback((card: CardType) => {
    if (state.currentPlayer !== 'human' || state.turnPhase !== 'play' || state.cardsPlayedThisTurn >= 3) return
    if (state.pendingAction) return

    if (card.type === 'money') {
      dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
    } else if (card.type === 'property') {
      dispatch({ type: 'PLAY_PROPERTY', cardId: card.id, color: card.color! })
    } else if (card.type === 'action') {
      if (card.actionType === 'justSayNo' || card.actionType === 'doubleTheRent') {
        // These are reactive — play as money
        dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
      } else if (card.actionType === 'house' || card.actionType === 'hotel') {
        // Need to select a color — dispatch directly if only one option
        dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id }) // Simplified — will enhance with modals
      } else {
        dispatch({ type: 'PLAY_ACTION', cardId: card.id })
      }
    } else if (card.type === 'rent') {
      // Need color selection — for now pick first color with properties
      if (card.colors) {
        const color = card.colors.find(c => state.players.human.properties[c].length > 0)
        if (color) {
          dispatch({ type: 'PLAY_RENT', cardId: card.id, color, doubled: false })
        } else {
          dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
        }
      }
    } else if (card.type === 'wildcard') {
      // Need color selection
      if (card.colors && card.colors.length <= 2) {
        dispatch({ type: 'PLAY_PROPERTY', cardId: card.id, color: card.colors[0] })
      } else {
        dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
      }
    }
  }, [state, dispatch])

  const handlePlayAsMoney = useCallback((card: CardType) => {
    if (state.currentPlayer !== 'human' || state.turnPhase !== 'play' || state.cardsPlayedThisTurn >= 3) return
    dispatch({ type: 'PLAY_CARD_AS_MONEY', cardId: card.id })
  }, [state, dispatch])

  const isHumanTurn = state.currentPlayer === 'human'
  const canPlay = isHumanTurn && state.turnPhase === 'play' && state.cardsPlayedThisTurn < 3 && !state.pendingAction

  // Modal states based on pending action
  const showPayment = state.pendingAction?.type === 'payDebt' && state.pendingAction.debtor === 'human'
  const showPropertyPicker = state.pendingAction?.type === 'selectProperty' && state.pendingAction.player === 'human'
  const showOwnPropertyPicker = state.pendingAction?.type === 'selectOwnProperty' && state.pendingAction.player === 'human'
  const showSetPicker = state.pendingAction?.type === 'selectSet' && state.pendingAction.player === 'human'
  const showJustSayNo = state.pendingAction?.type === 'justSayNo' &&
    ((state.pendingAction.depth % 2 === 0 && state.pendingAction.target === 'human') ||
     (state.pendingAction.depth % 2 !== 0 && state.pendingAction.challenger === 'human'))
  const showDiscard = state.pendingAction?.type === 'discard' && state.pendingAction.player === 'human'

  return (
    <div className="game-board">
      {/* Opponent area */}
      <div className="opponent-area">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <strong style={{ color: 'var(--monopoly-red)', fontSize: '0.85rem' }}>Bot</strong>
          <div className="opponent-area__hand">
            {state.players.bot.hand.map((_, i) => (
              <Card
                key={`bot-hand-${i}`}
                card={{ id: `hidden-${i}`, type: 'money', name: '', bankValue: 0 }}
                faceDown
                small
              />
            ))}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>{state.players.bot.hand.length} cartes</span>
        </div>
        <PlayerArea player={state.players.bot} isOpponent />
      </div>

      {/* Middle area */}
      <div className="middle-area">
        <div className="middle-area__center" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="draw-pile">
              <Card
                card={{ id: 'draw', type: 'money', name: '', bankValue: 0 }}
                faceDown
              />
              <span className="draw-pile__count">{state.drawPile.length} cartes</span>
            </div>
            {state.discardPile.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Card card={state.discardPile[state.discardPile.length - 1]} small />
                <span style={{ fontSize: '0.7rem', color: '#888' }}>Défausse</span>
              </div>
            )}
          </div>

          {/* Turn info */}
          <div className="turn-controls">
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
              <button className="turn-controls__btn" onClick={() => dispatch({ type: 'END_TURN' })}>
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
          {state.players.human.hand.map(card => (
            <div key={card.id} style={{ position: 'relative' }}>
              <Card
                card={card}
                selected={false}
                disabled={!canPlay}
                onClick={() => handleCardPlay(card)}
              />
              {canPlay && card.bankValue > 0 && card.type !== 'money' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePlayAsMoney(card) }}
                  style={{
                    position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '0.55rem', padding: '2px 6px', background: '#4CAF50', color: 'white',
                    borderRadius: '4px', whiteSpace: 'nowrap', zIndex: 5,
                  }}
                >
                  {card.bankValue}M
                </button>
              )}
            </div>
          ))}
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

      {showJustSayNo && (
        <JustSayNoModal
          hasCard={state.players.human.hand.some(c => c.actionType === 'justSayNo')}
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

      {state.winner && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <h2 className="modal__title" style={{ color: state.winner === 'human' ? 'var(--monopoly-green)' : 'var(--monopoly-red)' }}>
              {state.winner === 'human' ? 'Victoire !' : 'Défaite...'}
            </h2>
            <p>{state.winner === 'human' ? 'Vous avez 3 sets complets !' : 'Le bot a complété 3 sets avant vous.'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
