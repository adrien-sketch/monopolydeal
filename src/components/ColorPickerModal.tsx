import type { PropertyColor } from '../game/types'
import { COLOR_NAMES } from '../game/constants'
import { cssColorVar } from '../game/utils'

interface ColorPickerModalProps {
  colors: PropertyColor[]
  title: string
  onSelect: (color: PropertyColor) => void
}

export function ColorPickerModal({ colors, title, onSelect }: ColorPickerModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal__title">{title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {colors.map(color => (
            <button
              key={color}
              className="modal__btn"
              style={{
                background: `var(--color-${cssColorVar(color)})`,
                color: ['yellow', 'lightBlue'].includes(color) ? '#0a0e1a' : 'white',
                minWidth: '100px',
              }}
              onClick={() => onSelect(color)}
            >
              {COLOR_NAMES[color]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

