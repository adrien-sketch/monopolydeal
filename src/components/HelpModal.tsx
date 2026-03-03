import { useState } from 'react'

export function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="help-btn"
        onClick={() => setOpen(true)}
        title="Règles du jeu"
      >
        ?
      </button>
      {open && <HelpModal onClose={() => setOpen(false)} />}
    </>
  )
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal help-modal" onClick={e => e.stopPropagation()}>
        <button className="help-modal__close" onClick={onClose}>×</button>
        <h2 className="modal__title">Règles du jeu</h2>

        <div className="help-modal__content">
          <section>
            <h4>Objectif</h4>
            <p>Soyez le premier à compléter <strong>3 sets de propriétés</strong>.</p>
          </section>

          <section>
            <h4>Déroulement d'un tour</h4>
            <ol>
              <li><strong>Piocher</strong> 2 cartes</li>
              <li><strong>Jouer</strong> jusqu'à 3 cartes (optionnel)</li>
              <li>Si vous avez plus de 7 cartes en main, vous devez <strong>défausser</strong></li>
            </ol>
          </section>

          <section>
            <h4>Types de cartes</h4>
            <ul>
              <li><strong>Propriétés</strong> — Placez-les dans vos sets de couleur</li>
              <li><strong>Argent</strong> — Allez directement en banque</li>
              <li><strong>Loyer</strong> — Demandez le loyer à l'adversaire</li>
              <li><strong>Actions</strong> — Effets spéciaux (vol, échange, etc.)</li>
              <li><strong>Jokers</strong> — Propriétés de la couleur de votre choix</li>
            </ul>
          </section>

          <section>
            <h4>Cartes Action</h4>
            <ul>
              <li><strong>Départ</strong> — Piochez 2 cartes supplémentaires</li>
              <li><strong>Agent de Recouvrement</strong> — L'adversaire paie 5M</li>
              <li><strong>Anniversaire</strong> — L'adversaire paie 2M</li>
              <li><strong>Deal Duel</strong> — Volez une propriété</li>
              <li><strong>Deal Troc</strong> — Échangez une propriété</li>
              <li><strong>Deal Jackpot</strong> — Volez un set complet !</li>
              <li><strong>Juste dire Non</strong> — Annulez une action adverse</li>
              <li><strong>Double Loyer</strong> — Doublez un loyer</li>
              <li><strong>Maison / Hôtel</strong> — Bonus de loyer sur un set complet</li>
            </ul>
          </section>

          <section>
            <h4>Astuces</h4>
            <ul>
              <li>Toute carte peut être jouée comme argent (cliquez le badge vert sous la carte)</li>
              <li>Les paiements peuvent se faire en argent ou en propriétés</li>
              <li>Un set complet brille en doré</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
