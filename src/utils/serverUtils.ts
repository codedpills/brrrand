/**
 * Server utilities for Cloudflare Workers
 */

// HTML entities to sanitize user content
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
} as const;

/**
 * Validates if a URL is safe and properly formatted
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // Check for valid hostname
    if (!url.hostname || url.hostname.length === 0) {
      return false;
    }
    
    // Prevent access to local/private networks
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost and loopback addresses
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '::1') {
      return false;
    }
    
    // Block private IP ranges
    if (hostname.match(/^10\./) || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./) || 
        hostname.match(/^192\.168\./)) {
      return false;
    }
    
    // Block other special-use addresses
    if (hostname.match(/^169\.254\./) || // Link-local
        hostname.match(/^224\./) ||     // Multicast
        hostname.match(/^255\.255\.255\.255$/)) { // Broadcast
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeContent(content: string): string {
  if (typeof content !== 'string') {
    return '';
  }
  
  // Basic HTML entity encoding
  return content.replace(/[&<>"'`=\/]/g, (match) => {
    return HTML_ENTITIES[match as keyof typeof HTML_ENTITIES] || match;
  });
}

/**
 * Validates and normalizes a URL for proxy requests
 */
export function validateProxyUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required and must be a string' };
  }
  
  // Trim whitespace
  const trimmedUrl = url.trim();
  
  if (trimmedUrl.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }
  
  // Add protocol if missing
  let normalizedUrl = trimmedUrl;
  if (!normalizedUrl.match(/^https?:\/\//)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  
  if (!isValidUrl(normalizedUrl)) {
    return { valid: false, error: 'Invalid or unsafe URL' };
  }
  
  return { valid: true, normalized: normalizedUrl };
}

/**
 * Extracts the domain from a URL for logging/tracking purposes
 */
export function extractDomain(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return null;
  }
}

/**
 * Creates a user agent string for proxy requests
 */
export function createUserAgent(): string {
  return 'Brrrand Asset Extractor/1.0 (https://brrrand.it.com)';
}

/**
 * Determines if content should be cached based on content type
 */
export function getCacheHeaders(contentType: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (contentType.includes('text/html')) {
    headers['Cache-Control'] = 'public, max-age=300'; // 5 minutes for HTML
  } else if (contentType.includes('image/') || 
             contentType.includes('font/') ||
             contentType.includes('text/css') || 
             contentType.includes('application/javascript')) {
    headers['Cache-Control'] = 'public, max-age=86400'; // 1 day for assets
  } else {
    headers['Cache-Control'] = 'public, max-age=3600'; // 1 hour for other content
  }
  
  return headers;
}
