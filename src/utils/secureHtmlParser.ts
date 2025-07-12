/**
 * Secure HTML parsing utilities for Brrrand
 * Uses cheerio for robust and secure DOM manipulation
 */
import * as cheerio from 'cheerio';
import type { BrandAsset, ExtractedAssets } from './assetExtraction';

/**
 * Parse HTML content and extract brand assets using cheerio (secure implementation)
 */
export async function parseHtmlSecurely(html: string, baseUrl: string): Promise<ExtractedAssets> {
  const assets: ExtractedAssets = {
    logos: [],
    colors: [],
    fonts: [],
    illustrations: []
  };

  // Ensure baseUrl is valid before proceeding
  let validBaseUrl: string;
  try {
    // Attempt to parse the baseUrl
    new URL(baseUrl);
    validBaseUrl = baseUrl;
  } catch (e) {
    // If baseUrl is invalid, use a placeholder URL
    validBaseUrl = 'https://example.com';
  }

  try {
    // Load HTML with cheerio
    const $ = cheerio.load(html, {
      xml: false
    });
    
    // Extract logos
    assets.logos = extractLogosSecurely($, validBaseUrl);
    
    // Extract colors (still uses regex as it's pattern matching in CSS)
    assets.colors = extractColorsSecurely($, html);
    
    // Extract fonts
    assets.fonts = extractFontsSecurely($, validBaseUrl);
    
    // Extract illustrations
    assets.illustrations = extractIllustrationsSecurely($, validBaseUrl);
    
    // Deduplicate assets (reusing existing function)
    return deduplicateAssets(assets);
  } catch (error) {
    console.error('Secure HTML parsing failed:', error);
    return assets;
  }
}

/**
 * Extract logo assets from HTML using cheerio
 */
function extractLogosSecurely($: cheerio.CheerioAPI, baseUrl: string): BrandAsset[] {
  const logos: BrandAsset[] = [];
  
  // Extract favicon and touch icons
  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        // Validate URL to prevent javascript: protocol exploits
        const url = new URL(href, baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          logos.push({
            type: 'logo',
            url: url.href,
            source: 'link',
            alt: 'Favicon'
          });
        }
      } catch (e) {
        // Log invalid URLs but don't crash
        console.warn('Invalid logo URL found:', href);
      }
    }
  });
  
  // Extract logo images (images with logo-related keywords)
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    const className = $(el).attr('class') || '';
    
    if (src) {
      try {
        // Validate URL
        const url = new URL(src, baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          // Check if this looks like a logo
          if (isLikelyLogo(src, alt, className)) {
            logos.push({
              type: 'logo',
              url: url.href,
              alt: alt || undefined,
              source: 'html'
            });
          }
        }
      } catch (e) {
        console.warn('Invalid image URL found:', src);
      }
    }
  });
  
  return logos;
}

/**
 * Check if an image is likely to be a logo (reused from original implementation)
 */
function isLikelyLogo(src: string, alt: string, className: string): boolean {
  const logoKeywords = ['logo', 'brand', 'mark', 'icon'];
  const text = `${src} ${alt} ${className}`.toLowerCase();
  return logoKeywords.some(keyword => text.includes(keyword));
}

/**
 * Extract color assets from HTML and CSS
 * Still uses regex for color extraction as it's appropriate for this use case
 */
function extractColorsSecurely($: cheerio.CheerioAPI, html: string): BrandAsset[] {
  const colors: BrandAsset[] = [];
  const colorSet = new Set<string>();
  
  // Process inline styles
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    extractColorsFromText(style, colors, colorSet);
  });
  
  // Process style tags
  $('style').each((_, el) => {
    const styleContent = $(el).html() || '';
    extractColorsFromText(styleContent, colors, colorSet);
  });
  
  // Process any remaining CSS in the HTML (like in attributes)
  extractColorsFromText(html, colors, colorSet);
  
  return colors;
}

function extractColorsFromText(text: string, colors: BrandAsset[], colorSet: Set<string>): void {
  const colorPatterns = [
    /#[0-9a-f]{6}|#[0-9a-f]{3}/gi, // Hex colors
    /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi, // RGB colors
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*\)/gi, // RGBA colors
    /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/gi // HSL colors
  ];
  
  colorPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      const normalizedColor = normalizeColor(match);
      if (normalizedColor && !colorSet.has(normalizedColor)) {
        colorSet.add(normalizedColor);
        colors.push({
          type: 'color',
          value: normalizedColor,
          source: 'css'
        });
      }
    });
  });
}

/**
 * Normalize color values to hex format when possible (reused from original implementation)
 */
function normalizeColor(color: string): string | null {
  const trimmed = color.trim().toLowerCase();
  
  // If it's already a hex color, ensure it's 6 digits
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      // Convert #abc to #aabbcc
      return '#' + trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3];
    }
    return trimmed;
  }
  
  // For RGB values, convert to hex
  if (trimmed.startsWith('rgb(')) {
    const rgbMatch = trimmed.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
  
  // Return as-is for other formats (rgba, hsl, etc.)
  return trimmed;
}

/**
 * Extract font assets from HTML and CSS
 */
function extractFontsSecurely($: cheerio.CheerioAPI, baseUrl: string): BrandAsset[] {
  const fonts: BrandAsset[] = [];
  const fontSet = new Set<string>();
  
  // Extract from Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href');
    
    if (href) {
      try {
        // Validate URL
        const url = new URL(href, baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          const familyMatch = href.match(/family=([^&"']*)/i);
          if (familyMatch) {
            const families = decodeURIComponent(familyMatch[1]).split('|');
            families.forEach(family => {
              const fontName = family.split(':')[0].replace(/\+/g, ' ');
              if (!fontSet.has(fontName)) {
                fontSet.add(fontName);
                fonts.push({
                  type: 'font',
                  name: fontName,
                  url: url.href,
                  source: 'link'
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('Invalid Google Fonts URL:', href);
      }
    }
  });
  
  // Extract from style tags
  $('style').each((_, el) => {
    const css = $(el).html() || '';
    extractFontFamiliesFromCSS(css, fonts, fontSet);
  });
  
  // Extract from inline styles
  $('[style*="font-family"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    extractFontFamiliesFromCSS(style, fonts, fontSet);
  });
  
  return fonts;
}

function extractFontFamiliesFromCSS(css: string, fonts: BrandAsset[], fontSet: Set<string>): void {
  const fontFamilyMatches = css.match(/font-family\s*:\s*[^;}]+/gi) || [];
  
  fontFamilyMatches.forEach(match => {
    const fontFamily = match.replace(/font-family\s*:\s*/i, '').trim();
    const fontsList = fontFamily.split(',');
    
    fontsList.forEach(font => {
      const cleanFont = font.trim().replace(/['"]/g, '');
      // Skip generic font families
      if (!isGenericFont(cleanFont) && !fontSet.has(cleanFont)) {
        fontSet.add(cleanFont);
        fonts.push({
          type: 'font',
          name: cleanFont,
          source: 'css'
        });
      }
    });
  });
}

/**
 * Check if a font name is a generic CSS font family (reused from original implementation)
 */
function isGenericFont(fontName: string): boolean {
  const genericFonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', '-apple-system', 'BlinkMacSystemFont'];
  return genericFonts.includes(fontName.toLowerCase());
}

/**
 * Extract illustration assets from HTML
 */
function extractIllustrationsSecurely($: cheerio.CheerioAPI, baseUrl: string): BrandAsset[] {
  const illustrations: BrandAsset[] = [];
  
  // Extract images that are not logos
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    const className = $(el).attr('class') || '';
    
    if (src) {
      try {
        // Validate URL
        const url = new URL(src, baseUrl);
        if ((url.protocol === 'http:' || url.protocol === 'https:') && !isLikelyLogo(src, alt, className)) {
          illustrations.push({
            type: 'illustration',
            url: url.href,
            alt: alt || undefined,
            source: 'html'
          });
        }
      } catch (e) {
        console.warn('Invalid illustration URL:', src);
      }
    }
  });
  
  // Extract background images
  // Using a separate function that extracts from style attributes and CSS
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    extractBackgroundImagesFromCSS(style, illustrations, baseUrl);
  });
  
  $('style').each((_, el) => {
    const css = $(el).html() || '';
    extractBackgroundImagesFromCSS(css, illustrations, baseUrl);
  });
  
  return illustrations;
}

function extractBackgroundImagesFromCSS(css: string, illustrations: BrandAsset[], baseUrl: string): void {
  const backgroundImageMatches = css.match(/background-image\s*:\s*url\([^)]+\)/gi) || [];
  
  backgroundImageMatches.forEach(match => {
    const urlMatch = match.match(/url\(['"]?([^'"]+)['"]?\)/i);
    if (urlMatch) {
      try {
        const url = new URL(urlMatch[1], baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          illustrations.push({
            type: 'illustration',
            url: url.href,
            source: 'css'
          });
        }
      } catch (e) {
        console.warn('Invalid background image URL:', urlMatch[1]);
      }
    }
  });
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
  };
}

function deduplicateByUrl(assets: BrandAsset[]): BrandAsset[] {
  const seen = new Set<string>();
  return assets.filter(asset => {
    if (asset.url && seen.has(asset.url)) {
      return false;
    }
    if (asset.url) {
      seen.add(asset.url);
    }
    return true;
  });
}

function deduplicateByValue(assets: BrandAsset[]): BrandAsset[] {
  const seen = new Set<string>();
  return assets.filter(asset => {
    if (asset.value && seen.has(asset.value)) {
      return false;
    }
    if (asset.value) {
      seen.add(asset.value);
    }
    return true;
  });
}

function deduplicateByName(assets: BrandAsset[]): BrandAsset[] {
  const seen = new Set<string>();
  return assets.filter(asset => {
    if (asset.name && seen.has(asset.name)) {
      return false;
    }
    if (asset.name) {
      seen.add(asset.name);
    }
    return true;
  });
}
