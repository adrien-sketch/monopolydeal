import type { PendingAction } from '../game/types'

interface JustSayNoModalProps {
  hasCard: boolean
  originalAction: PendingAction
  onPlay: () => void
  onAccept: () => void
}

function describeAction(action: PendingAction): string {
  if (action.type === 'payDebt') {
    return `${action.reason} — ${action.amount}M`
  }
  if (action.type === 'selectProperty') {
    if (action.purpose === 'slyDeal') return 'Deal Duel — voler une propriété'
    if (action.purpose === 'forcedDeal-take') return 'Deal Troc — échanger une propriété'
  }
  if (action.type === 'selectSet') {
    return 'Deal Jackpot — voler un set complet'
  }
  return 'Action inconnue'
}

export function JustSayNoModal({ hasCard, originalAction, onPlay, onAccept }: JustSayNoModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: 'center' }}>
        <h3 className="modal__title">Action contre vous !</h3>
        <p style={{ marginBottom: '8px', fontWeight: 700, fontSize: '1rem' }}>
          {describeAction(originalAction)}
        </p>
        <p style={{ marginBottom: '16px' }}>
          {hasCard
            ? 'Vous avez un Juste dire non. Voulez-vous bloquer cette action ?'
            : "Vous n'avez pas de Juste dire non. Vous devez accepter."}
        </p>
        <div className="modal__actions" style={{ justifyContent: 'center' }}>
          {hasCard && (
            <button className="modal__btn modal__btn--danger" onClick={onPlay}>
              Juste dire non !
            </button>
          )}
          <button className="modal__btn modal__btn--secondary" onClick={onAccept}>
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
