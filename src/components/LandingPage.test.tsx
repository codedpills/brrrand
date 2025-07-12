import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('should render the hero section with main heading', () => {
    render(<LandingPage />)
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Extract Brand Assets')).toBeInTheDocument()
    expect(screen.getByText('Instantly')).toBeInTheDocument()
  })

  it('should display the value proposition clearly', () => {
    render(<LandingPage />)
    
    expect(screen.getByText(/no more email chains/i)).toBeInTheDocument()
    expect(screen.getByText(/free to use/i)).toBeInTheDocument()
  })

  it('should have a prominent URL input field', () => {
    render(<LandingPage />)
    
    const urlInput = screen.getByLabelText(/website url/i)
    expect(urlInput).toBeInTheDocument()
    expect(urlInput).toHaveAttribute('type', 'url')
    expect(urlInput).toHaveAttribute('placeholder')
  })

  it('should have an extract assets button', () => {
    render(<LandingPage />)
    
    const extractButton = screen.getByRole('button', { name: /extract assets/i })
    expect(extractButton).toBeInTheDocument()
    expect(extractButton).toHaveClass('bg-primary-500')
  })

  it('should display features list', () => {
    render(<LandingPage />)
    
    expect(screen.getByRole('heading', { name: /logos/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /colors/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /typography/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /illustrations/i })).toBeInTheDocument()
  })

  it('should be mobile responsive', () => {
    render(<LandingPage />)
    
    const container = screen.getByTestId('landing-page')
    expect(container).toHaveClass('min-h-screen')
    expect(container).toHaveClass('px-4') // Mobile padding
  })

  it('should include legal disclaimer', () => {
    render(<LandingPage />)
    
    expect(screen.getByText(/disclaimer/i)).toBeInTheDocument()
    expect(screen.getByText(/don't own the content/i)).toBeInTheDocument()
  })

  it('should show validation error for invalid URL', async () => {
    const user = userEvent.setup()
    render(<LandingPage />)
    
    const input = screen.getByLabelText(/website url/i)
    const button = screen.getByRole('button', { name: /extract assets/i })
    
    // Enter invalid URL
    await user.type(input, 'not-a-url')
    await user.click(button)
    
    expect(screen.getByRole('alert')).toHaveTextContent(/please enter a valid website url/i)
  })

  it('should clear validation error when user starts typing', async () => {
    const user = userEvent.setup()
    render(<LandingPage />)
    
    const input = screen.getByLabelText(/website url/i)
    const button = screen.getByRole('button', { name: /extract assets/i })
    
    // Enter invalid URL and submit
    await user.type(input, 'invalid')
    await user.click(button)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    
    // Start typing again
    await user.type(input, 'x')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should accept valid URLs without showing errors', async () => {
    const user = userEvent.setup()
    render(<LandingPage />)
    
    const input = screen.getByLabelText(/website url/i)
    const button = screen.getByRole('button', { name: /extract assets/i })
    
    // Enter valid URL
    await user.type(input, 'example.com')
    await user.click(button)
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should show validation error for empty URL', async () => {
    const user = userEvent.setup()
    render(<LandingPage />)
    
    const button = screen.getByRole('button', { name: /extract assets/i })
    
    // Submit without entering URL
    await user.click(button)
    
    expect(screen.getByRole('alert')).toHaveTextContent(/url is required/i)
  })
})
