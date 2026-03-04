import { useRef, useEffect } from 'react'
import type { LogEntry } from '../game/types'

function getLogIcon(message: string): string {
  if (message.includes('pioche')) return '🃏'
  if (message.includes('banque')) return '💰'
  if (message.includes('loyer') || message.includes('Loyer')) return '🏠'
  if (message.includes('Deal Jackpot') || message.includes('set complet')) return '💥'
  if (message.includes('Deal Duel')) return '⚔️'
  if (message.includes('Deal Troc')) return '🔄'
  if (message.includes('Anniversaire')) return '🎂'
  if (message.includes('Recouvrement')) return '💸'
  if (message.includes('Juste dire non') || message.includes('bloque')) return '🛡️'
  if (message.includes('maison')) return '🏠'
  if (message.includes('hôtel') || message.includes('Hôtel')) return '🏨'
  if (message.includes('vole')) return '🕵️'
  if (message.includes('paie') || message.includes('perd')) return '💳'
  if (message.includes('défausse')) return '🗑️'
  if (message.includes('place')) return '📍'
  if (message.includes('gagne')) return '🏆'
  if (message.includes('mélangée')) return '🔀'
  return '▸'
}

export function ActionLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [entries.length])

  return (
    <div className="action-log">
      <div className="action-log__header">
        <span className="action-log__header-icon">📜</span>
        <span className="action-log__title">Historique</span>
        {entries.length > 0 && (
          <span className="action-log__badge">{entries.length}</span>
        )}
      </div>
      <div className="action-log__feed" ref={ref}>
        {entries.length === 0 && (
          <div className="action-log__empty">
            <span className="action-log__empty-icon">💤</span>
            <span>En attente d'actions…</span>
          </div>
        )}
        {entries.map((entry, i) => (
          <div
            key={i}
            className={`action-log__bubble action-log__bubble--${entry.player}`}
            style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
          >
            <span className="action-log__icon">{getLogIcon(entry.message)}</span>
            <div className="action-log__content">
              <span className="action-log__author">
                {entry.player === 'human' ? 'Vous' : 'Monobot'}
              </span>
              <span className="action-log__message">{entry.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
