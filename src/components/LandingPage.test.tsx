import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LandingPage } from './LandingPage'

// Mock the asset extraction module
vi.mock('../utils/assetExtraction', () => ({
  extractAssets: vi.fn()
}))

import { extractAssets } from '../utils/assetExtraction'
const mockExtractAssets = vi.mocked(extractAssets)

describe('LandingPage', () => {
  beforeEach(() => {
    mockExtractAssets.mockClear()
  })

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
    
    // Mock successful asset extraction for this test
    mockExtractAssets.mockResolvedValueOnce({
      success: true,
      url: 'https://example.com',
      domain: 'example.com',
      extractedAt: '2024-01-01T00:00:00Z',
      assets: {
        logos: [],
        colors: [],
        fonts: [],
        illustrations: []
      },
      error: null
    })
    
    render(<LandingPage />)
    
    const input = screen.getByLabelText(/website url/i)
    const button = screen.getByRole('button', { name: /extract assets/i })
    
    // Enter valid URL
    await user.type(input, 'example.com')
    await user.click(button)
    
    // Wait for extraction to complete and check no validation error
    await waitFor(() => {
      expect(screen.queryByText(/an unexpected error occurred/i)).not.toBeInTheDocument()
    })
  })

  it('should show validation error for empty URL', async () => {
    const user = userEvent.setup()
    render(<LandingPage />)
    
    const button = screen.getByRole('button', { name: /extract assets/i })
    
    // Submit without entering URL
    await user.click(button)
    
    expect(screen.getByRole('alert')).toHaveTextContent(/url is required/i)
  })

  it('should extract and display assets when form is submitted with valid URL', async () => {
    const user = userEvent.setup()
    
    // Mock successful asset extraction
    mockExtractAssets.mockResolvedValueOnce({
      success: true,
      url: 'https://example.com',
      domain: 'example.com',
      extractedAt: '2024-01-01T00:00:00Z',
      assets: {
        logos: [
          { type: 'logo', url: 'https://example.com/logo.png', alt: 'Company Logo' }
        ],
        colors: [
          { type: 'color', value: '#007bff', source: 'css' },
          { type: 'color', value: '#6c757d', source: 'css' }
        ],
        fonts: [
          { type: 'font', name: 'Arial', source: 'css' }
        ],
        illustrations: [
          { type: 'illustration', url: 'https://example.com/hero.jpg', alt: 'Hero Image' }
        ]
      },
      error: null
    })
    
    render(<LandingPage />)
    
    const input = screen.getByLabelText(/website url/i)
    const button = screen.getByRole('button', { name: /extract assets/i })
    
    // Enter valid URL and submit
    await user.type(input, 'https://example.com')
    await user.click(button)
    
    // Wait for extraction to complete - skip checking extracting state since it's too fast
    await waitFor(() => {
      expect(screen.getByText(/assets extracted successfully/i)).toBeInTheDocument()
    })
    
    // Should display extracted assets
    expect(screen.getByText(/found 1 logos, 2 colors, 1 fonts, and 1 illustrations/i)).toBeInTheDocument()
    expect(screen.getByText(/logos \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/colors \(2\)/i)).toBeInTheDocument()
    expect(screen.getByText(/fonts \(1\)/i)).toBeInTheDocument()
    expect(screen.getByText(/illustrations \(1\)/i)).toBeInTheDocument()
    
    // Verify extractAssets was called with normalized URL
    expect(mockExtractAssets).toHaveBeenCalledWith('https://example.com')
  })

  it('should display error message when asset extraction fails', async () => {
    const user = userEvent.setup()
    
    // Mock failed asset extraction
    mockExtractAssets.mockResolvedValueOnce({
      success: false,
      url: 'https://unreachable.com',
      domain: 'unreachable.com',
      extractedAt: '2024-01-01T00:00:00Z',
      assets: null,
      error: 'Failed to fetch website content'
    })
    
    render(<LandingPage />)
    
    const input = screen.getByLabelText(/website url/i)
    const button = screen.getByRole('button', { name: /extract assets/i })
    
    // Enter URL and submit
    await user.type(input, 'https://unreachable.com')
    await user.click(button)
    
    // Wait for extraction to complete
    await waitFor(() => {
      expect(screen.getByText(/unable to extract assets/i)).toBeInTheDocument()
    })
    
    // Check for the error message in the results section (not validation error)
    expect(screen.getAllByText(/failed to fetch website content/i)).toHaveLength(2) // One in validation, one in results
  })
})
