import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LandingPage } from './LandingPage'

// Mock both asset extraction modules
vi.mock('../utils/assetExtraction', () => ({
  extractAssets: vi.fn()
}))

vi.mock('../utils/mockAssetExtraction', () => ({
  mockExtractAssets: vi.fn(),
  suggestedTestSites: ['https://stripe.com', 'https://github.com']
}))

import { mockExtractAssets } from '../utils/mockAssetExtraction'
const mockExtractAssetsFunc = vi.mocked(mockExtractAssets)

describe('LandingPage', () => {
  beforeEach(() => {
    mockExtractAssetsFunc.mockClear()
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
    mockExtractAssetsFunc.mockResolvedValueOnce({
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
    mockExtractAssetsFunc.mockResolvedValueOnce({
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
    expect(mockExtractAssetsFunc).toHaveBeenCalledWith('https://example.com')
  })

  it('should display error message when asset extraction fails', async () => {
    const user = userEvent.setup()
    
    // Mock failed asset extraction
    mockExtractAssetsFunc.mockResolvedValueOnce({
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

  describe('Environment Variable Configuration', () => {
    it('should show toggle and demo sites in development mode', () => {
      // For now, just test that the component renders with default dev settings
      render(<LandingPage />)
      
      // Should show demo toggle and sites (default behavior)
      expect(screen.getByText('Demo Mode')).toBeInTheDocument()
      expect(screen.getByText(/try these demo sites/i)).toBeInTheDocument()
    })

    it('should allow toggling between demo and real mode when toggle is shown', async () => {
      const user = userEvent.setup()

      render(<LandingPage />)
      
      // Should start in demo mode (default)
      expect(screen.getByText(/try these demo sites/i)).toBeInTheDocument()
      
      // Click toggle to switch to real mode
      const toggleButton = screen.getByTestId('demo-mode-toggle')
      await user.click(toggleButton)
      
      // Demo sites should disappear
      expect(screen.queryByText(/try these demo sites/i)).not.toBeInTheDocument()
    })

    it('should show download functionality when assets are extracted', async () => {
      const user = userEvent.setup()
      
      // Mock successful asset extraction
      mockExtractAssetsFunc.mockResolvedValueOnce({
        success: true,
        url: 'https://example.com',
        domain: 'example.com',
        error: null,
        extractedAt: new Date().toISOString(),
        assets: {
          logos: [{ type: 'logo', url: 'https://example.com/logo.png', alt: 'Test Logo' }],
          colors: [{ type: 'color', value: '#ff0000' }, { type: 'color', value: '#00ff00' }],
          fonts: [{ type: 'font', name: 'Arial', url: 'https://fonts.google.com/arial' }],
          illustrations: [{ type: 'illustration', url: 'https://example.com/image.jpg', alt: 'Test Image' }]
        }
      })

      render(<LandingPage />)
      
      const input = screen.getByLabelText(/website url/i)
      const button = screen.getByRole('button', { name: /extract assets/i })
      
      // Submit form
      await user.type(input, 'https://example.com')
      await user.click(button)
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/assets extracted successfully/i)).toBeInTheDocument()
      })
      
      // Check for download functionality
      expect(screen.getByRole('button', { name: /download all/i })).toBeInTheDocument()
      expect(screen.getByText('Copy All')).toBeInTheDocument() // Color copy all button
      expect(screen.getByRole('button', { name: /copy all links/i })).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /download/i })).toHaveLength(3) // Download All + 2 individual downloads
      expect(screen.getAllByRole('button', { name: /copy link/i })).toHaveLength(1) // Font copy link button
    })

    it('should show CSS import button for Google Fonts', async () => {
      const user = userEvent.setup()
      
      // Mock successful asset extraction with Google Font
      mockExtractAssetsFunc.mockResolvedValueOnce({
        success: true,
        url: 'https://example.com',
        domain: 'example.com',
        error: null,
        extractedAt: new Date().toISOString(),
        assets: {
          logos: [],
          colors: [],
          fonts: [{ type: 'font', name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter' }],
          illustrations: []
        }
      })

      render(<LandingPage />)
      
      const input = screen.getByLabelText(/website url/i)
      const button = screen.getByRole('button', { name: /extract assets/i })
      
      // Submit form
      await user.type(input, 'https://example.com')
      await user.click(button)
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/assets extracted successfully/i)).toBeInTheDocument()
      })
      
      // Check for CSS import button (only appears for Google Fonts)
      expect(screen.getByRole('button', { name: /copy css imports/i })).toBeInTheDocument()
    })
  })
})
