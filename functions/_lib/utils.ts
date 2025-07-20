/**
 * Utility functions for request validation and content sanitization
 */

/**
 * List of blocked host names for security purposes
 */
const BLOCKED_HOSTS: readonly string[] = [
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0'
] as const;

/**
 * Mapping of special characters to their HTML entity counterparts for sanitization
 */
const HTML_ENTITY_MAP: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Check if a URL is valid and safe to proxy
 * 
 * @param url - The URL to validate
 * @returns Whether the URL is valid and safe
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    
    // Only allow HTTP/HTTPS protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    
    // Block local/private IPs and reserved hostnames
    const hostname = parsed.hostname.toLowerCase();
    
    if (BLOCKED_HOSTS.includes(hostname)) {
      return false;
    }
    
    // Block private IP ranges
    if (hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return false;
    }
    
    // Block potentially dangerous URL characters
    const urlString = url.toString();
    if (urlString.includes('javascript:') || 
        urlString.includes('data:') || 
        urlString.includes('vbscript:')) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitize text to prevent XSS attacks
 * 
 * @param text - The text to sanitize
 * @returns The sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text.replace(/[<>&"']/g, (c) => HTML_ENTITY_MAP[c] || c);
}

/**
 * List of potentially dangerous HTML elements that should be removed during sanitization
 */
const DANGEROUS_ELEMENTS: readonly string[] = [
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'base',
  'form',
  'input',
  'button',
  'meta',
  'frame',
  'frameset',
  'link'
] as const;

/**
 * List of attribute names that may contain URLs that need to be checked
 */
const URL_ATTRIBUTES: readonly string[] = [
  'href',
  'src',
  'xlink:href',
  'data-src'
] as const;

/**
 * Sanitize HTML content by removing potentially dangerous elements and attributes
 * 
 * @param html - The HTML content to sanitize
 * @returns The sanitized HTML content
 */
export function sanitizeContent(html: string): string {
  if (!html) return '';
  
  try {
    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/iframe>/gi, '');
    
    // Remove object and embed tags
    sanitized = sanitized.replace(/<(?:object|embed|applet)\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/(?:object|embed|applet)>/gi, '');
    
    // Remove form elements
    sanitized = sanitized.replace(/<(?:form|input|button)\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/(?:form|input|button)>/gi, '');
    
    // Remove meta tags (except charset and viewport)
    sanitized = sanitized.replace(/<meta\b(?![^>]*(?:charset|viewport))[^>]*>/gi, '');
    
    // Remove event handlers (onclick, onload, etc.)
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: and data: protocols from href and src attributes
    sanitized = sanitized.replace(/(?:href|src)\s*=\s*["'](?:javascript|data):[^"']*["']/gi, '');
    
    // Return the sanitized content as-is (don't escape HTML entities for now)
    return sanitized;
  } catch (error) {
    console.error('Content sanitization failed:', error);
    // Return safely escaped content if sanitization fails
    return html.replace(/[<>&"']/g, (c) => HTML_ENTITY_MAP[c] || c);
  }
}

/**
 * List of safe image file extensions
 */
const SAFE_IMAGE_EXTENSIONS: readonly string[] = [
  'jpg', 
  'jpeg', 
  'png', 
  'gif', 
  'svg', 
  'webp', 
  'ico', 
  'bmp'
] as const;

/**
 * Check if a URL is likely to be an image URL with a safe extension
 * 
 * @param url - The URL to check
 * @returns Whether the URL is likely to be an image with a safe extension
 */
export function isSafeImageUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  
  try {
    // Check file extension
    const ext = url.split('.').pop()?.toLowerCase();
    
    return ext !== undefined && SAFE_IMAGE_EXTENSIONS.includes(ext as any);
  } catch {
    return false;
  }
}

// No need for re-export as each function is already exported individually
