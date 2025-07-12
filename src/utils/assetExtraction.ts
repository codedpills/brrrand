/**
 * Asset extraction utilities for Brrrand
 * Extracts brand assets (logos, colors, fonts, illustrations) from websites
 */

export interface BrandAsset {
  type: 'logo' | 'color' | 'font' | 'illustration'
  url?: string
  value?: string
  name?: string
  alt?: string
  format?: string
  source?: 'css' | 'html' | 'inline' | 'link'
}

export interface ExtractedAssets {
  logos: BrandAsset[]
  colors: BrandAsset[]
  fonts: BrandAsset[]
  illustrations: BrandAsset[]
}

export interface AssetExtractionResult {
  success: boolean
  url: string
  domain: string | null
  assets: ExtractedAssets | null
  error: string | null
  extractedAt: string
}

/**
 * Extracts brand assets from a website URL
 */
export async function extractAssets(url: string): Promise<AssetExtractionResult> {
  const domain = extractDomain(url)
  const baseResult = {
    url,
    domain,
    extractedAt: new Date().toISOString()
  }

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      return {
        ...baseResult,
        success: false,
        assets: null,
        error: `Website returned ${response.status}: ${response.statusText}`
      }
    }

    const html = await response.text()
    
    const assets = await parseHtmlForAssets(html, url)
    
    return {
      ...baseResult,
      success: true,
      assets,
      error: null
    }
    
  } catch (error) {
    return {
      ...baseResult,
      success: false,
      assets: null,
      error: 'Failed to fetch website content'
    }
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/**
 * Parse HTML content and extract brand assets
 */
export async function parseHtmlForAssets(html: string, baseUrl: string): Promise<ExtractedAssets> {
  // Create a simple DOM-like parser using regex patterns
  // In a real implementation, you'd use a proper HTML parser like jsdom
  
  const assets: ExtractedAssets = {
    logos: [],
    colors: [],
    fonts: [],
    illustrations: []
  }

  // Extract logos
  assets.logos = extractLogos(html, baseUrl)
  
  // Extract colors
  assets.colors = extractColors(html)
  
  // Extract fonts
  assets.fonts = extractFonts(html)
  
  // Extract illustrations
  assets.illustrations = extractIllustrations(html, baseUrl)
  
  // Deduplicate assets
  return deduplicateAssets(assets)
}

/**
 * Extract logo assets from HTML
 */
function extractLogos(html: string, baseUrl: string): BrandAsset[] {
  const logos: BrandAsset[] = []
  
  // Extract favicon and touch icons
  const iconMatches = html.match(/<link[^>]*rel=["'](?:icon|apple-touch-icon|shortcut icon)["'][^>]*>/gi) || []
  iconMatches.forEach(match => {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i)
    if (hrefMatch) {
      logos.push({
        type: 'logo',
        url: resolveUrl(hrefMatch[1], baseUrl),
        source: 'link',
        alt: 'Favicon'
      })
    }
  })
  
  // Extract logo images (images with logo-related keywords)
  const imgMatches = html.match(/<img[^>]*>/gi) || []
  imgMatches.forEach(match => {
    const srcMatch = match.match(/src=["']([^"']+)["']/i)
    const altMatch = match.match(/alt=["']([^"']+)["']/i)
    const classMatch = match.match(/class=["']([^"']+)["']/i)
    
    if (srcMatch) {
      const src = srcMatch[1]
      const alt = altMatch ? altMatch[1] : ''
      const className = classMatch ? classMatch[1] : ''
      
      // Check if this looks like a logo
      if (isLikelyLogo(src, alt, className)) {
        logos.push({
          type: 'logo',
          url: resolveUrl(src, baseUrl),
          alt: alt || undefined,
          source: 'html'
        })
      }
    }
  })
  
  return logos
}

/**
 * Check if an image is likely to be a logo
 */
function isLikelyLogo(src: string, alt: string, className: string): boolean {
  const logoKeywords = ['logo', 'brand', 'mark', 'icon']
  const text = `${src} ${alt} ${className}`.toLowerCase()
  return logoKeywords.some(keyword => text.includes(keyword))
}

/**
 * Extract color assets from HTML and CSS
 */
function extractColors(html: string): BrandAsset[] {
  const colors: BrandAsset[] = []
  const colorSet = new Set<string>()
  
  // Extract colors from CSS and inline styles
  const colorPatterns = [
    /#[0-9a-f]{6}|#[0-9a-f]{3}/gi, // Hex colors
    /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi, // RGB colors
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*\)/gi, // RGBA colors
    /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/gi // HSL colors
  ]
  
  colorPatterns.forEach(pattern => {
    const matches = html.match(pattern) || []
    matches.forEach(match => {
      const normalizedColor = normalizeColor(match)
      if (normalizedColor && !colorSet.has(normalizedColor)) {
        colorSet.add(normalizedColor)
        colors.push({
          type: 'color',
          value: normalizedColor,
          source: 'css'
        })
      }
    })
  })
  
  return colors
}

/**
 * Normalize color values to hex format when possible
 */
function normalizeColor(color: string): string | null {
  const trimmed = color.trim().toLowerCase()
  
  // If it's already a hex color, ensure it's 6 digits
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      // Convert #abc to #aabbcc
      return '#' + trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3]
    }
    return trimmed
  }
  
  // For RGB values, convert to hex
  if (trimmed.startsWith('rgb(')) {
    const rgbMatch = trimmed.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1])
      const g = parseInt(rgbMatch[2])
      const b = parseInt(rgbMatch[3])
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }
  }
  
  // Return as-is for other formats (rgba, hsl, etc.)
  return trimmed
}

/**
 * Extract font assets from HTML and CSS
 */
function extractFonts(html: string): BrandAsset[] {
  const fonts: BrandAsset[] = []
  const fontSet = new Set<string>()
  
  // Extract from Google Fonts links
  const googleFontsMatches = html.match(/fonts\.googleapis\.com\/css[^"']*/gi) || []
  googleFontsMatches.forEach(match => {
    const familyMatch = match.match(/family=([^&"']*)/i)
    if (familyMatch) {
      const families = decodeURIComponent(familyMatch[1]).split('|')
      families.forEach(family => {
        const fontName = family.split(':')[0].replace(/\+/g, ' ')
        if (!fontSet.has(fontName)) {
          fontSet.add(fontName)
          fonts.push({
            type: 'font',
            name: fontName,
            source: 'link'
          })
        }
      })
    }
  })
  
  // Extract from font-family declarations
  const fontFamilyMatches = html.match(/font-family\s*:\s*[^;}]+/gi) || []
  fontFamilyMatches.forEach(match => {
    const fontFamily = match.replace(/font-family\s*:\s*/i, '').trim()
    const fonts_list = fontFamily.split(',')
    
    fonts_list.forEach(font => {
      const cleanFont = font.trim().replace(/['"]/g, '')
      // Skip generic font families
      if (!isGenericFont(cleanFont) && !fontSet.has(cleanFont)) {
        fontSet.add(cleanFont)
        fonts.push({
          type: 'font',
          name: cleanFont,
          source: 'css'
        })
      }
    })
  })
  
  return fonts
}

/**
 * Check if a font name is a generic CSS font family
 */
function isGenericFont(fontName: string): boolean {
  const genericFonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', '-apple-system', 'BlinkMacSystemFont']
  return genericFonts.includes(fontName.toLowerCase())
}

/**
 * Extract illustration assets from HTML
 */
function extractIllustrations(html: string, baseUrl: string): BrandAsset[] {
  const illustrations: BrandAsset[] = []
  
  // Extract images that are not logos
  const imgMatches = html.match(/<img[^>]*>/gi) || []
  imgMatches.forEach(match => {
    const srcMatch = match.match(/src=["']([^"']+)["']/i)
    const altMatch = match.match(/alt=["']([^"']+)["']/i)
    const classMatch = match.match(/class=["']([^"']+)["']/i)
    
    if (srcMatch) {
      const src = srcMatch[1]
      const alt = altMatch ? altMatch[1] : ''
      const className = classMatch ? classMatch[1] : ''
      
      // If it's not a logo, treat it as an illustration
      if (!isLikelyLogo(src, alt, className)) {
        illustrations.push({
          type: 'illustration',
          url: resolveUrl(src, baseUrl),
          alt: alt || undefined,
          source: 'html'
        })
      }
    }
  })
  
  // Extract background images from CSS
  const backgroundImageMatches = html.match(/background-image\s*:\s*url\([^)]+\)/gi) || []
  backgroundImageMatches.forEach(match => {
    const urlMatch = match.match(/url\(['"]?([^'"]+)['"]?\)/i)
    if (urlMatch) {
      illustrations.push({
        type: 'illustration',
        url: resolveUrl(urlMatch[1], baseUrl),
        source: 'css'
      })
    }
  })
  
  return illustrations
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

/**
 * Remove duplicate assets from the extracted results
 */
function deduplicateAssets(assets: ExtractedAssets): ExtractedAssets {
  return {
    logos: deduplicateByUrl(assets.logos),
    colors: deduplicateByValue(assets.colors),
    fonts: deduplicateByName(assets.fonts),
    illustrations: deduplicateByUrl(assets.illustrations)
  }
}

function deduplicateByUrl(assets: BrandAsset[]): BrandAsset[] {
  const seen = new Set<string>()
  return assets.filter(asset => {
    if (asset.url && seen.has(asset.url)) {
      return false
    }
    if (asset.url) {
      seen.add(asset.url)
    }
    return true
  })
}

function deduplicateByValue(assets: BrandAsset[]): BrandAsset[] {
  const seen = new Set<string>()
  return assets.filter(asset => {
    if (asset.value && seen.has(asset.value)) {
      return false
    }
    if (asset.value) {
      seen.add(asset.value)
    }
    return true
  })
}

function deduplicateByName(assets: BrandAsset[]): BrandAsset[] {
  const seen = new Set<string>()
  return assets.filter(asset => {
    if (asset.name && seen.has(asset.name)) {
      return false
    }
    if (asset.name) {
      seen.add(asset.name)
    }
    return true
  })
}
