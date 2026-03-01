import { useRef, useEffect } from 'react'
import type { LogEntry } from '../game/types'

export function ActionLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [entries.length])

  return (
    <div className="action-log" ref={ref}>
      <div className="action-log__title">Historique</div>
      {entries.length === 0 && (
        <div style={{ color: '#aaa', fontSize: '0.7rem' }}>Aucune action</div>
      )}
      {entries.map((entry, i) => (
        <div key={i} className={`action-log__entry action-log__entry--${entry.player}`}>
          <strong>{entry.player === 'human' ? 'Vous' : 'Bot'}</strong> {entry.message}
        </div>
      ))}
    </div>
  )
}
