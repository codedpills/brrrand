import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExtractionForm } from './ExtractionForm'

describe('ExtractionForm', () => {
  const mockProps = {
    url: '',
    validationError: null,
    isValidating: false,
    isExtracting: false,
    isDemoMode: true,
    showDemoToggle: true,
    onSubmit: vi.fn(),
    onUrlChange: vi.fn(),
    onDemoToggle: vi.fn()
  }

  it('should render form elements', () => {
    render(<ExtractionForm {...mockProps} />)
    
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /extract assets/i })).toBeInTheDocument()
    expect(screen.getByTestId('demo-mode-toggle')).toBeInTheDocument()
  })

  it('should show validation error when provided', () => {
    render(<ExtractionForm {...mockProps} validationError="Invalid URL" />)
    
    expect(screen.getByText('Invalid URL')).toBeInTheDocument()
  })

  it('should call onDemoToggle when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<ExtractionForm {...mockProps} />)
    
    await user.click(screen.getByTestId('demo-mode-toggle'))
    expect(mockProps.onDemoToggle).toHaveBeenCalled()
  })

  it('should call onSubmit when form is submitted', () => {
    render(<ExtractionForm {...mockProps} />)
    
    fireEvent.submit(screen.getByRole('button', { name: /extract assets/i }))
    expect(mockProps.onSubmit).toHaveBeenCalled()
  })
})
