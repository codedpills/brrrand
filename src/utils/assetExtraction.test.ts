import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractAssets, AssetExtractionResult, BrandAsset } from './assetExtraction'

// Mock fetch for testing
const mockFetch = vi.fn()
// @ts-ignore - we're mocking global fetch for testing
globalThis.fetch = mockFetch

describe('Asset Extraction API', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('extractAssets', () => {
    it('should extract assets from a valid website', async () => {
      // Mock successful HTML response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Test Company</title>
              <link rel="icon" href="/favicon.ico">
              <style>
                :root { --primary-color: #007bff; --secondary-color: #6c757d; }
                body { font-family: 'Arial', sans-serif; color: #333; }
                .logo { background-image: url('/logo.png'); }
              </style>
            </head>
            <body>
              <img src="/company-logo.svg" alt="Company Logo" class="logo">
              <img src="/hero-image.jpg" alt="Hero Image">
              <div style="color: #ff6b6b; background-color: rgba(0, 123, 255, 0.1);">
                <h1 style="font-family: 'Roboto', sans-serif;">Welcome</h1>
              </div>
            </body>
          </html>
        `)
      })

      const result = await extractAssets('https://example.com')

      expect(result.success).toBe(true)
      expect(result.url).toBe('https://example.com')
      expect(result.domain).toBe('example.com')
      expect(result.assets).toBeDefined()
      expect(result.assets.logos).toHaveLength(2) // favicon + company logo
      expect(result.assets.logos.some((logo: BrandAsset) => logo.url === 'https://example.com/company-logo.svg')).toBe(true)
      expect(result.assets.logos.some((logo: BrandAsset) => logo.url === 'https://example.com/favicon.ico')).toBe(true)
      expect(result.assets.colors.length).toBeGreaterThan(3) // CSS colors + inline colors
      expect(result.assets.fonts.length).toBeGreaterThan(1) // Arial, Roboto
      expect(result.error).toBeNull()
    })

    it('should handle multiple logo sources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <link rel="icon" href="/favicon.svg">
              <link rel="apple-touch-icon" href="/apple-touch-icon.png">
            </head>
            <body>
              <img src="/logo-dark.png" alt="Dark Logo">
              <img src="/logo-light.svg" alt="Light Logo">
              <div class="logo-container">
                <img src="/brand-mark.png" alt="Brand Mark">
              </div>
            </body>
          </html>
        `)
      })

      const result = await extractAssets('https://company.com')

      expect(result.success).toBe(true)
      expect(result.assets.logos).toHaveLength(5) // 2 favicon + 3 logo images
      
      const logoUrls = result.assets.logos.map((logo: BrandAsset) => logo.url)
      expect(logoUrls).toContain('https://company.com/favicon.svg')
      expect(logoUrls).toContain('https://company.com/apple-touch-icon.png')
      expect(logoUrls).toContain('https://company.com/logo-dark.png')
      expect(logoUrls).toContain('https://company.com/logo-light.svg')
      expect(logoUrls).toContain('https://company.com/brand-mark.png')
    })

    it('should extract color palette from CSS and inline styles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <style>
                .primary { color: #3498db; background: #2ecc71; }
                .secondary { border-color: rgb(231, 76, 60); }
                .accent { background-color: rgba(155, 89, 182, 0.8); }
              </style>
            </head>
            <body style="background: linear-gradient(45deg, #f39c12, #e74c3c);">
              <div style="color: #1abc9c; border: 2px solid hsl(280, 50%, 60%);">Content</div>
            </body>
          </html>
        `)
      })

      const result = await extractAssets('https://colors.com')

      expect(result.success).toBe(true)
      expect(result.assets.colors.length).toBeGreaterThan(5)
      
      const colorValues = result.assets.colors.map((color: BrandAsset) => color.value)
      expect(colorValues).toContain('#3498db')
      expect(colorValues).toContain('#2ecc71')
      expect(colorValues).toContain('#e74c3c')
      expect(colorValues).toContain('#f39c12')
      expect(colorValues).toContain('#1abc9c')
    })

    it('should extract font families from CSS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
                h1 { font-family: "Playfair Display", Georgia, serif; }
                .mono { font-family: 'JetBrains Mono', 'Courier New', monospace; }
              </style>
            </head>
            <body>
              <h1 style="font-family: 'Custom Font', Arial, sans-serif;">Title</h1>
            </body>
          </html>
        `)
      })

      const result = await extractAssets('https://fonts.com')

      expect(result.success).toBe(true)
      expect(result.assets.fonts.length).toBeGreaterThan(3)
      
      const fontNames = result.assets.fonts.map((font: BrandAsset) => font.name)
      expect(fontNames).toContain('Inter')
      expect(fontNames).toContain('Playfair Display')
      expect(fontNames).toContain('Custom Font')
    })

    it('should extract illustrations and graphics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <body>
              <img src="/illustration-hero.svg" alt="Hero Illustration" class="illustration">
              <img src="/graphic-pattern.png" alt="Background Pattern">
              <img src="/icon-set.svg" alt="Icon Set">
              <div style="background-image: url('/bg-illustration.svg');">Content</div>
            </body>
          </html>
        `)
      })

      const result = await extractAssets('https://graphics.com')

      expect(result.success).toBe(true)
      expect(result.assets.illustrations.length).toBeGreaterThan(2)
      
      const illustrationUrls = result.assets.illustrations.map((ill: BrandAsset) => ill.url)
      expect(illustrationUrls).toContain('https://graphics.com/illustration-hero.svg')
      expect(illustrationUrls).toContain('https://graphics.com/graphic-pattern.png')
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await extractAssets('https://unreachable.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch website content')
      expect(result.assets).toBeNull()
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const result = await extractAssets('https://notfound.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Website returned 404: Not Found')
      expect(result.assets).toBeNull()
    })

    it('should handle invalid HTML gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Not valid HTML content')
      })

      const result = await extractAssets('https://invalid.com')

      expect(result.success).toBe(true) // Should still succeed with empty results
      expect(result.assets.logos).toHaveLength(0)
      expect(result.assets.colors).toHaveLength(0)
      expect(result.assets.fonts).toHaveLength(0)
      expect(result.assets.illustrations).toHaveLength(0)
    })

    it('should normalize relative URLs correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <body>
              <img src="logo.png" alt="Logo">
              <img src="/assets/hero.jpg" alt="Hero">
              <img src="../images/pattern.svg" alt="Pattern">
              <img src="./icons/star.png" alt="Icon">
            </body>
          </html>
        `)
      })

      const result = await extractAssets('https://example.com/pages/about')

      expect(result.success).toBe(true)
      
      const urls = [
        ...result.assets.logos.map((l: BrandAsset) => l.url),
        ...result.assets.illustrations.map((i: BrandAsset) => i.url)
      ]
      
      expect(urls).toContain('https://example.com/pages/logo.png')
      expect(urls).toContain('https://example.com/assets/hero.jpg')
      expect(urls).toContain('https://example.com/images/pattern.svg')
      expect(urls).toContain('https://example.com/pages/icons/star.png')
    })

    it('should filter out duplicate assets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <style>
                .primary { color: #007bff; }
                .secondary { background-color: #007bff; }
              </style>
            </head>
            <body>
              <img src="/logo.png" alt="Logo">
              <img src="/logo.png" alt="Logo Copy">
              <div style="color: #007bff;">Text</div>
            </body>
          </html>
        `)
      })

      const result = await extractAssets('https://duplicate.com')

      expect(result.success).toBe(true)
      
      // Should only have one instance of each unique asset
      const logoUrls = result.assets.logos.map((l: BrandAsset) => l.url)
      const uniqueLogos = [...new Set(logoUrls)]
      expect(logoUrls.length).toBe(uniqueLogos.length)
      
      const colorValues = result.assets.colors.map((c: BrandAsset) => c.value)
      const blueColors = colorValues.filter((c: string) => c === '#007bff')
      expect(blueColors.length).toBe(1) // Should be deduplicated
    })
  })
})
