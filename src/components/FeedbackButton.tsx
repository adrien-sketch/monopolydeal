import { useState } from 'react'
import { FeedbackModal } from './FeedbackModal'

interface FeedbackButtonProps {
  onSubmit?: (feedback: string) => void
}

export function FeedbackButton({ onSubmit }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (feedback: string) => {
    onSubmit?.(feedback)
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Give Feedback</button>
      <FeedbackModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  )
}
