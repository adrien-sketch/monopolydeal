interface JustSayNoModalProps {
  hasCard: boolean
  onPlay: () => void
  onAccept: () => void
}

export function JustSayNoModal({ hasCard, onPlay, onAccept }: JustSayNoModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: 'center' }}>
        <h3 className="modal__title">Action contre vous !</h3>
        <p style={{ marginBottom: '16px' }}>
          {hasCard
            ? 'Vous avez un Just Say No. Voulez-vous bloquer cette action ?'
            : "Vous n'avez pas de Just Say No. Vous devez accepter."}
        </p>
        <div className="modal__actions" style={{ justifyContent: 'center' }}>
          {hasCard && (
            <button className="modal__btn modal__btn--danger" onClick={onPlay}>
              Just Say No !
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
