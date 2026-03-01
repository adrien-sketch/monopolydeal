import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { FeedbackButton } from './FeedbackButton'

// jsdom doesn't implement HTMLDialogElement methods
beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '')
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
})

afterEach(() => {
  cleanup()
})

describe('FeedbackButton', () => {
  it('renders the feedback button', () => {
    render(<FeedbackButton />)
    expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument()
  })

  it('opens the modal when the button is clicked', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)

    await user.click(screen.getByRole('button', { name: /give feedback/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/your feedback/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onSubmit with the feedback text when submitted', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FeedbackButton onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /give feedback/i }))
    await user.type(screen.getByLabelText(/your feedback/i), 'Great app!')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(onSubmit).toHaveBeenCalledWith('Great app!')
  })

  it('closes the modal when cancel is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<FeedbackButton />)

    await user.click(screen.getByRole('button', { name: /give feedback/i }))
    expect(screen.getByRole('dialog')).toHaveAttribute('open')

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    // After closing, the dialog loses the dialog role, so query the element directly
    const dialog = container.querySelector('dialog')
    expect(dialog).not.toHaveAttribute('open')
  })

  it('clears the text area after submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<FeedbackButton onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /give feedback/i }))
    await user.type(screen.getByLabelText(/your feedback/i), 'Some feedback')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Re-open modal and check textarea is empty
    await user.click(screen.getByRole('button', { name: /give feedback/i }))
    expect(screen.getByLabelText(/your feedback/i)).toHaveValue('')
  })
})
