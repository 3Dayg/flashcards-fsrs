import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CardForm } from './CardForm'

describe('CardForm', () => {
  it('renders all card type options with accessible labels', () => {
    render(<CardForm onSubmit={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Open question' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'True / false' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Multiple choice' })).toBeInTheDocument()
  })

  it('shows true/false correct-answer tiles when that type is selected', async () => {
    const user = userEvent.setup()
    render(<CardForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('radio', { name: 'True / false' }))

    expect(screen.getByRole('group', { name: 'Correct answer' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'True' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'False' })).toBeInTheDocument()
    expect(screen.queryByText('Multiple-choice options')).not.toBeInTheDocument()
  })

  it('shows multiple-choice options when that type is selected', async () => {
    const user = userEvent.setup()
    render(<CardForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('radio', { name: 'Multiple choice' }))

    expect(screen.getByText('Multiple-choice options')).toBeInTheDocument()
    expect(screen.getByLabelText('Mark option 1 as correct')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Correct answer' })).not.toBeInTheDocument()
  })

  it('hides type-specific editors for open questions', async () => {
    const user = userEvent.setup()
    render(<CardForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('radio', { name: 'Multiple choice' }))
    await user.click(screen.getByRole('radio', { name: 'Open question' }))

    expect(screen.queryByText('Multiple-choice options')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Correct answer' })).not.toBeInTheDocument()
    expect(
      screen.getByLabelText('Answer (revealed after you recall)'),
    ).toBeInTheDocument()
  })
})
