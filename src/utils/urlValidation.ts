/**
 * URL validation utilities for Brrrand
 */

export interface UrlValidationResult {
  isValid: boolean
  normalizedUrl: string | null
  domain: string | null
  error: string | null
}

/**
 * Checks if a URL is valid (HTTP/HTTPS only)
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    
    // Only allow HTTP/HTTPS protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false
    }
    
    // Check for malformed hostnames
    if (!parsedUrl.hostname || parsedUrl.hostname === '.' || parsedUrl.hostname === '..') {
      return false
    }
    
    // Ensure hostname has at least one valid character that's not just dots
    if (!/[a-zA-Z0-9]/.test(parsedUrl.hostname)) {
      return false
    }
    
    // Check for valid domain format (must contain at least one dot for domain, or be localhost)
    const hostname = parsedUrl.hostname
    if (hostname !== 'localhost' && !hostname.includes('.')) {
      return false
    }
    
    // Additional check: if it contains a dot, ensure it's a proper domain format
    if (hostname.includes('.')) {
      const parts = hostname.split('.')
      // Each part should be non-empty and contain valid domain characters
      for (const part of parts) {
        if (!part || !/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(part)) {
          return false
        }
      }
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Normalizes a URL by adding https:// if no protocol is present
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  
  // If it already has a protocol, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  
  // Add https:// by default
  return `https://${trimmed}`
}

/**
 * Extracts the domain from a valid URL
 */
export function getUrlDomain(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    
    // Only allow HTTP/HTTPS protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null
    }
    
    // Remove port from hostname if present
    return parsedUrl.hostname
  } catch {
    return null
  }
}

/**
 * Validates and normalizes a URL input
 */
export function validateUrl(input: string): UrlValidationResult {
  const trimmed = input.trim()
  
  // Check if input is empty
  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: null,
      domain: null,
      error: 'URL is required'
    }
  }
  
  // Normalize the URL
  const normalized = normalizeUrl(trimmed)
  
  // Check if the normalized URL is valid
  if (!isValidUrl(normalized)) {
    return {
      isValid: false,
      normalizedUrl: null,
      domain: null,
      error: 'Please enter a valid website URL'
    }
  }
  
  // Extract domain
  const domain = getUrlDomain(normalized)
  
  return {
    isValid: true,
    normalizedUrl: normalized,
    domain,
    error: null
  }
}
