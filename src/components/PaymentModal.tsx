import { useState } from 'react'
import type { PlayerState, PropertyColor } from '../game/types'
import { PROPERTY_COLORS } from '../game/types'
import { getTotalAssets } from '../game/sets'
import { Card } from './Card'

interface PaymentModalProps {
  amount: number
  reason: string
  player: PlayerState
  onPay: (payments: { cardId: string; source: 'bank' | PropertyColor }[]) => void
}

export function PaymentModal({ amount, reason, player, onPay }: PaymentModalProps) {
  const [selected, setSelected] = useState<Map<string, 'bank' | PropertyColor>>(new Map())

  const totalSelected = Array.from(selected.keys()).reduce((sum, id) => {
    const bankCard = player.bank.find(c => c.id === id)
    if (bankCard) return sum + bankCard.bankValue
    for (const color of PROPERTY_COLORS) {
      const propCard = player.properties[color].find(c => c.id === id)
      if (propCard) return sum + propCard.bankValue
    }
    return sum
  }, 0)

  const totalAssets = getTotalAssets(player)
  const canPay = totalSelected >= amount || totalSelected >= totalAssets

  const toggle = (id: string, source: 'bank' | PropertyColor) => {
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.set(id, source)
      }
      return next
    })
  }

  const handlePay = () => {
    const payments = Array.from(selected.entries()).map(([cardId, source]) => ({ cardId, source }))
    onPay(payments)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal__title">Paiement requis</h3>
        <p style={{ marginBottom: '12px' }}>
          <strong>{reason}</strong> — Vous devez payer <strong>{amount}M</strong>
        </p>
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '16px' }}>
          Sélectionné : {totalSelected}M / {amount}M
        </p>

        {player.bank.length > 0 && (
          <>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Banque</h4>
            <div className="selectable-cards">
              {player.bank.map(card => (
                <Card
                  key={card.id}
                  card={card}
                  small
                  selected={selected.has(card.id)}
                  onClick={() => toggle(card.id, 'bank')}
                />
              ))}
            </div>
          </>
        )}

        {PROPERTY_COLORS.filter(c => player.properties[c].length > 0).map(color => (
          <div key={color} style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Propriétés {color}</h4>
            <div className="selectable-cards">
              {player.properties[color].map(card => (
                <Card
                  key={card.id}
                  card={card}
                  small
                  selected={selected.has(card.id)}
                  onClick={() => toggle(card.id, color)}
                  displayColor={color}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="modal__actions">
          <button className="modal__btn modal__btn--primary" onClick={handlePay} disabled={!canPay}>
            Payer {totalSelected}M
          </button>
        </div>
      </div>
    </div>
  )
}
