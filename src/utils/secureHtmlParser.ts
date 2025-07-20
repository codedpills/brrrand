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
  
  // Add common favicon if not already present
  const hasFavicon = assets.logos.some(logo => 
    logo.url?.includes('favicon.ico') || logo.url?.includes('favicon')
  );
  if (!hasFavicon) {
    try {
      const faviconUrl = new URL('/favicon.ico', validBaseUrl);
      assets.logos.push({
        type: 'logo',
        url: faviconUrl.href,
        source: 'html',
        alt: 'Default favicon'
      });
    } catch (e) {
      // Ignore favicon.ico if base URL is invalid
    }
  }
    
    // Extract colors (still uses regex as it's pattern matching in CSS)
    assets.colors = extractColorsSecurely($, html);
    
    // Extract fonts
    assets.fonts = extractFontsSecurely($, validBaseUrl);
    
    // Extract illustrations
    assets.illustrations = extractIllustrationsSecurely($, validBaseUrl);
    
    // Enhanced extraction for SPAs - extract additional assets from CSS files
    const cssAssets = await extractAssetsFromCssLinks($, validBaseUrl);
    assets.fonts.push(...cssAssets.fonts);
    assets.colors.push(...cssAssets.colors);
    
    // Extract meta tag assets for SPAs (OG images, theme colors, etc.)
    const metaAssets = extractAssetsFromMetaTags($, validBaseUrl);
    assets.logos.push(...metaAssets.logos);
    assets.colors.push(...metaAssets.colors);
    assets.illustrations.push(...metaAssets.illustrations);
    
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
  
  // Extract favicon and touch icons with size prioritization
  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').each((_, el) => {
    const href = $(el).attr('href');
    const sizes = $(el).attr('sizes');
    if (href) {
      try {
        // Validate URL to prevent javascript: protocol exploits
        const url = new URL(href, baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          logos.push({
            type: 'logo',
            url: url.href,
            source: 'link',
            alt: sizes ? `Favicon (${sizes})` : 'Favicon'
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
    const id = $(el).attr('id') || '';
    
    if (src) {
      try {
        // Validate URL
        const url = new URL(src, baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          // Check if this looks like a logo with enhanced detection
          if (isLikelyLogo(src, alt, className, id)) {
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

  // Extract SVG logos (inline SVGs with logo-related attributes)
  $('svg').each((_, el) => {
    const className = $(el).attr('class') || '';
    const id = $(el).attr('id') || '';
    const title = $(el).find('title').text() || '';
    
    if (isLikelyLogo('', title, className, id)) {
      // Convert SVG to data URL for inline logos
      const svgHtml = $.html(el);
      if (svgHtml) {
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgHtml).toString('base64')}`;
        logos.push({
          type: 'logo',
          url: dataUrl,
          alt: title || 'Inline SVG logo',
          source: 'inline'
        });
      }
    }
  });
  
  return logos;
}

/**
 * Check if an image is likely to be a logo (enhanced with ID support)
 */
function isLikelyLogo(src: string, alt: string, className: string, id?: string): boolean {
  const logoKeywords = ['logo', 'brand', 'mark', 'icon'];
  const text = `${src} ${alt} ${className} ${id || ''}`.toLowerCase();
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
  
  // Process style tags with enhanced extraction
  $('style').each((_, el) => {
    const styleContent = $(el).html() || '';
    extractColorsFromText(styleContent, colors, colorSet);
    
    // Also use the enhanced CSS content extraction for style tags
    const cssColors = extractColorsFromCssContent(styleContent);
    cssColors.forEach(color => {
      if (!colorSet.has(color.value!)) {
        colorSet.add(color.value!);
        colors.push(color);
      }
    });
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
 * Extract assets from meta tags (for SPAs and modern websites)
 */
function extractAssetsFromMetaTags($: cheerio.CheerioAPI, baseUrl: string): ExtractedAssets {
  const assets: ExtractedAssets = {
    logos: [],
    colors: [],
    fonts: [],
    illustrations: []
  };

  // Extract OG images and Twitter images (these are usually illustrations/hero images, not logos)
  $('meta[property="og:image"], meta[name="twitter:image"], meta[property="og:image:url"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content) {
      try {
        const url = new URL(content, baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          // Check if this might be a logo based on filename
          const filename = url.pathname.toLowerCase();
          const isLikelyLogo = ['logo', 'icon', 'favicon'].some(keyword => filename.includes(keyword));
          
          if (isLikelyLogo) {
            assets.logos.push({
              type: 'logo',
              url: url.href,
              source: 'html',
              alt: 'Social media logo'
            });
          } else {
            assets.illustrations.push({
              type: 'illustration',
              url: url.href,
              source: 'html',
              alt: 'Social media image'
            });
          }
        }
      } catch (e) {
        console.warn('Invalid meta image URL:', content);
      }
    }
  });

  // Extract theme colors
  $('meta[name="theme-color"], meta[name="msapplication-TileColor"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content) {
      const normalizedColor = normalizeColor(content);
      if (normalizedColor) {
        assets.colors.push({
          type: 'color',
          value: normalizedColor,
          source: 'html'
        });
      }
    }
  });

  // Extract additional favicon formats specifically for logos
  $('link[rel="mask-icon"], link[rel="fluid-icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        const url = new URL(href, baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          assets.logos.push({
            type: 'logo',
            url: url.href,
            source: 'html',
            alt: 'Website icon'
          });
        }
      } catch (e) {
        console.warn('Invalid meta icon URL:', href);
      }
    }
  });

  return assets;
}

/**
 * Extract assets from linked CSS files (for SPAs with external stylesheets)
 */
async function extractAssetsFromCssLinks($: cheerio.CheerioAPI, baseUrl: string): Promise<ExtractedAssets> {
  const assets: ExtractedAssets = {
    logos: [],
    colors: [],
    fonts: [],
    illustrations: []
  };

  // Find CSS links
  const cssLinks: string[] = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        const url = new URL(href, baseUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          cssLinks.push(url.href);
        }
      } catch (e) {
        console.warn('Invalid CSS URL:', href);
      }
    }
  });

  // Extract Google Fonts and other font services from URLs
  cssLinks.forEach(cssUrl => {
    // Google Fonts detection
    if (cssUrl.includes('fonts.googleapis.com') || cssUrl.includes('fonts.gstatic.com')) {
      const fontMatch = cssUrl.match(/family=([^&:]+)/);
      if (fontMatch) {
        const fontName = decodeURIComponent(fontMatch[1]).replace(/\+/g, ' ');
        assets.fonts.push({
          type: 'font',
          name: fontName,
          url: cssUrl,
          source: 'link'
        });
      }
    }

    // Adobe Fonts / Typekit detection
    if (cssUrl.includes('use.typekit.net') || cssUrl.includes('use.adobe.com')) {
      assets.fonts.push({
        type: 'font',
        name: 'Adobe Fonts',
        url: cssUrl,
        source: 'link'
      });
    }
  });

  // For same-origin CSS files, try to fetch and parse them for colors and fonts
  const sameOriginCss = cssLinks.filter(cssUrl => {
    try {
      const cssUrlObj = new URL(cssUrl);
      const baseUrlObj = new URL(baseUrl);
      return cssUrlObj.hostname === baseUrlObj.hostname;
    } catch {
      return false;
    }
  });

  // Fetch and parse same-origin CSS files (limit to first 2 to avoid performance issues)
  for (const cssUrl of sameOriginCss.slice(0, 2)) {
    try {
      console.log('Fetching CSS for asset extraction:', cssUrl);
      
      // Use our proxy for CSS files (both development and production)
      let cssContent: string;
      try {
        // Always use the proxy for CSS files to avoid CORS issues
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(cssUrl)}`;
        const response = await fetch(proxyUrl, {
          headers: {
            'X-Purpose': 'asset-extraction'
          }
        });
        if (response.ok) {
          cssContent = await response.text();
        } else {
          console.warn('Proxy failed for CSS, skipping:', cssUrl, response.status);
          continue;
        }
      } catch (proxyError) {
        console.warn('Proxy error for CSS, skipping:', cssUrl, proxyError);
        continue;
      }

      // Extract colors from CSS
      const cssColors = extractColorsFromCssContent(cssContent);
      assets.colors.push(...cssColors);

      // Extract font families from CSS
      const cssFonts = extractFontsFromCssContent(cssContent);
      assets.fonts.push(...cssFonts);

    } catch (error) {
      console.warn('Failed to fetch CSS file:', cssUrl, error);
      // Continue with other CSS files
    }
  }

  return assets;
}

/**
 * Extract colors from CSS content
 */
function extractColorsFromCssContent(cssContent: string): BrandAsset[] {
  const colors: BrandAsset[] = [];
  const colorSet = new Set<string>();

  // Standard color patterns
  const colorPatterns = [
    /#[0-9a-f]{6}|#[0-9a-f]{3}/gi, // Hex colors
    /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi, // RGB colors
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*\)/gi, // RGBA colors
    /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/gi // HSL colors
  ];

  // CSS custom property definitions (--color: value)
  const customPropertyPattern = /--[a-zA-Z0-9_-]+\s*:\s*([^;]+)/gi;
  const customPropertyMatches = cssContent.match(customPropertyPattern) || [];
  
  customPropertyMatches.forEach(match => {
    // Extract the value part after the colon
    const valueMatch = match.match(/:\s*([^;]+)/);
    if (valueMatch) {
      const value = valueMatch[1].trim();
      // Check if the value is a color
      colorPatterns.forEach(pattern => {
        pattern.lastIndex = 0; // Reset regex
        const colorMatch = pattern.exec(value);
        if (colorMatch) {
          const normalizedColor = normalizeColor(colorMatch[0]);
          if (normalizedColor && !colorSet.has(normalizedColor)) {
            colorSet.add(normalizedColor);
            colors.push({
              type: 'color',
              value: normalizedColor,
              source: 'css'
            });
          }
        }
      });

      // Check for RGB values in comma-separated format (often used with CSS custom properties)
      const rgbTripletMatch = value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (rgbTripletMatch) {
        const r = parseInt(rgbTripletMatch[1]);
        const g = parseInt(rgbTripletMatch[2]);
        const b = parseInt(rgbTripletMatch[3]);
        if (r <= 255 && g <= 255 && b <= 255) {
          const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          if (!colorSet.has(hexColor)) {
            colorSet.add(hexColor);
            colors.push({
              type: 'color',
              value: hexColor,
              source: 'css'
            });
          }
        }
      }
    }
  });

  // Standard color extraction
  colorPatterns.forEach(pattern => {
    const matches = cssContent.match(pattern) || [];
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

  return colors;
}

/**
 * Extract font families from CSS content
 */
function extractFontsFromCssContent(cssContent: string): BrandAsset[] {
  const fonts: BrandAsset[] = [];
  const fontSet = new Set<string>();

  // Match font-family declarations
  const fontFamilyPattern = /font-family\s*:\s*([^;}]+)/gi;
  const matches = cssContent.match(fontFamilyPattern) || [];

  matches.forEach(match => {
    // Extract the font family value
    const fontValue = match.replace(/font-family\s*:\s*/i, '').trim();
    
    // Split by comma and clean up each font name
    const fontNames = fontValue.split(',').map(font => 
      font.trim()
        .replace(/['"]/g, '') // Remove quotes
        .replace(/!important/gi, '') // Remove !important
        .trim()
    ).filter(font => 
      font && 
      font.length > 0 &&
      !['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'inherit', 'initial', 'unset'].includes(font.toLowerCase())
    );

    fontNames.forEach(fontName => {
      if (!fontSet.has(fontName)) {
        fontSet.add(fontName);
        fonts.push({
          type: 'font',
          name: fontName,
          source: 'css'
        });
      }
    });
  });

  // Also check for font shorthand properties
  const fontShorthandPattern = /font\s*:\s*([^;}]+)/gi;
  const shorthandMatches = cssContent.match(fontShorthandPattern) || [];

  shorthandMatches.forEach(match => {
    // Font shorthand: [font-style] [font-variant] [font-weight] [font-size]/[line-height] font-family
    const fontValue = match.replace(/font\s*:\s*/i, '').trim();
    
    // Try to extract the font family from the end of the shorthand
    const parts = fontValue.split(/\s+/);
    if (parts.length >= 2) {
      // Take the last parts as potential font family
      const potentialFontFamily = parts.slice(-2).join(' ');
      
      const fontNames = potentialFontFamily.split(',').map(font => 
        font.trim()
          .replace(/['"]/g, '')
          .replace(/!important/gi, '')
          .trim()
      ).filter(font => 
        font && 
        font.length > 0 &&
        !['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'inherit', 'initial', 'unset'].includes(font.toLowerCase()) &&
        !/^\d/.test(font) // Exclude values that start with numbers (likely sizes)
      );

      fontNames.forEach(fontName => {
        if (!fontSet.has(fontName)) {
          fontSet.add(fontName);
          fonts.push({
            type: 'font',
            name: fontName,
            source: 'css'
          });
        }
      });
    }
  });

  return fonts;
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
  if (assets.length === 0) return assets;
  
  // For logos, implement smart deduplication
  if (assets[0].type === 'logo') {
    return deduplicateLogos(assets);
  }
  
  // For other assets, use simple URL deduplication
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

function deduplicateLogos(logos: BrandAsset[]): BrandAsset[] {
  // Group logos by similarity (same domain, similar filenames)
  const groups = new Map<string, BrandAsset[]>();
  
  logos.forEach(logo => {
    if (!logo.url) return;
    
    try {
      const url = new URL(logo.url);
      const filename = url.pathname.split('/').pop() || '';
      
      // Create a similarity key based on domain + normalized filename
      const normalizedFilename = filename
        .replace(/[-_\.]/g, '') // Remove separators
        .replace(/\d+x?\d*/g, '') // Remove size indicators like "32x32", "180"
        .replace(/android|apple|ms|favicon|touch|icon/gi, '') // Remove common prefixes
        .toLowerCase();
      
      const similarityKey = `${url.hostname}:${normalizedFilename}`;
      
      if (!groups.has(similarityKey)) {
        groups.set(similarityKey, []);
      }
      groups.get(similarityKey)!.push(logo);
    } catch (e) {
      // If URL parsing fails, treat as unique
      const uniqueKey = `invalid:${logo.url}`;
      groups.set(uniqueKey, [logo]);
    }
  });
  
  // For each group, select the best logo
  const deduplicated: BrandAsset[] = [];
  
  groups.forEach(groupLogos => {
    if (groupLogos.length === 1) {
      deduplicated.push(groupLogos[0]);
      return;
    }
    
    // Sort by preference: larger sizes, better formats, more specific alt text
    const sortedLogos = groupLogos.sort((a, b) => {
      // Prefer logos with size information in URL (usually higher quality)
      const aSizeMatch = a.url?.match(/(\d+)x?(\d+)?/);
      const bSizeMatch = b.url?.match(/(\d+)x?(\d+)?/);
      
      if (aSizeMatch && bSizeMatch) {
        const aSize = parseInt(aSizeMatch[1]) * (parseInt(aSizeMatch[2]) || parseInt(aSizeMatch[1]));
        const bSize = parseInt(bSizeMatch[1]) * (parseInt(bSizeMatch[2]) || parseInt(bSizeMatch[2]));
        if (aSize !== bSize) return bSize - aSize; // Prefer larger
      } else if (aSizeMatch && !bSizeMatch) {
        return -1; // Prefer sized over unsized
      } else if (!aSizeMatch && bSizeMatch) {
        return 1;
      }
      
      // Prefer SVG over other formats
      const aIsSvg = a.url?.includes('.svg') || a.url?.includes('svg');
      const bIsSvg = b.url?.includes('.svg') || b.url?.includes('svg');
      if (aIsSvg && !bIsSvg) return -1;
      if (!aIsSvg && bIsSvg) return 1;
      
      // Prefer logos with meaningful alt text
      const aHasAlt = a.alt && a.alt.length > 3 && !a.alt.toLowerCase().includes('favicon');
      const bHasAlt = b.alt && b.alt.length > 3 && !b.alt.toLowerCase().includes('favicon');
      if (aHasAlt && !bHasAlt) return -1;
      if (!aHasAlt && bHasAlt) return 1;
      
      return 0;
    });
    
    // Take the best logo from this group
    deduplicated.push(sortedLogos[0]);
  });
  
  return deduplicated;
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
