import { useRef, useEffect, useState } from 'react'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (feedback: string) => void
}

export function FeedbackModal({ open, onClose, onSubmit }: FeedbackModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(feedback)
    setFeedback('')
    onClose()
  }

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-label="Feedback form">
      <form onSubmit={handleSubmit}>
        <h2>Send Feedback</h2>
        <label htmlFor="feedback-text">Your feedback</label>
        <textarea
          id="feedback-text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={5}
          required
        />
        <div>
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  )
}
