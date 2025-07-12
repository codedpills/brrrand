/**
 * Asset extraction utilities for Brrrand
 * Extracts brand assets (logos, colors, fonts, illustrations) from websites
 */

// Import the secure HTML parser
import { parseHtmlSecurely } from './secureHtmlParser'

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
/**
 * Normalize a URL by ensuring it has a protocol
 */
function normalizeUrl(url: string): string {
  // Check if URL already has a protocol
  if (url.match(/^https?:\/\//)) {
    return url;
  }
  
  // Add https protocol if missing
  return `https://${url}`;
}

export async function extractAssets(url: string): Promise<AssetExtractionResult> {
  // Normalize the URL before processing
  const normalizedUrl = normalizeUrl(url);
  const domain = extractDomain(normalizedUrl);
  
  const baseResult = {
    url: normalizedUrl,
    domain,
    extractedAt: new Date().toISOString()
  }

  try {
    const response = await fetch(normalizedUrl)
    
    if (!response.ok) {
      return {
        ...baseResult,
        success: false,
        assets: null,
        error: `Website returned ${response.status}: ${response.statusText}`
      }
    }

    const html = await response.text()
    
    // Use the secure HTML parser instead of the regex-based one
    // Pass the normalized URL to ensure proper URL resolution
    const assets = await parseHtmlSecurely(html, normalizedUrl)
    
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
