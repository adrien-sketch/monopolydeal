import { useState } from 'react'
import type { Card as CardType } from '../game/types'
import { Card } from './Card'

interface DiscardModalProps {
  hand: CardType[]
  mustDiscard: number
  onDiscard: (cardIds: string[]) => void
}

export function DiscardModal({ hand, mustDiscard, onDiscard }: DiscardModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < mustDiscard) {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal__title">Défaussez {mustDiscard} carte{mustDiscard > 1 ? 's' : ''}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Vous avez trop de cartes en main. Sélectionnez {mustDiscard} carte{mustDiscard > 1 ? 's' : ''} à défausser.
          ({selected.size}/{mustDiscard})
        </p>
        <div className="selectable-cards">
          {hand.map(card => (
            <Card
              key={card.id}
              card={card}
              selected={selected.has(card.id)}
              onClick={() => toggle(card.id)}
            />
          ))}
        </div>
        <div className="modal__actions">
          <button
            className="modal__btn modal__btn--primary"
            disabled={selected.size !== mustDiscard}
            onClick={() => onDiscard(Array.from(selected))}
          >
            Défausser
          </button>
        </div>
      </div>
    </div>
  )
}
