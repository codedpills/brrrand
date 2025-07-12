/**
 * Utility functions for request validation and content sanitization
 */
import * as cheerio from 'cheerio';

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
    const $ = cheerio.load(html);
    
    // Remove potentially dangerous elements
    DANGEROUS_ELEMENTS.forEach((element) => {
      $(element).remove();
    });
    
    // Remove potentially dangerous attributes
    $('*').each((_, element) => {
      // Use any to bypass type checking for cheerio elements
      const attributes = (element as any).attribs || {};
      
      Object.keys(attributes).forEach((attribute) => {
        const attrValue = attributes[attribute].toLowerCase();
        const attributeLower = attribute.toLowerCase();
        
        // Remove event handlers (on*)
        if (attributeLower.startsWith('on')) {
          $(element).removeAttr(attribute);
        }
        
        // Remove dangerous URLs
        if (URL_ATTRIBUTES.includes(attributeLower as any)) {
          if (attrValue.startsWith('javascript:') || 
              attrValue.startsWith('data:') || 
              attrValue.startsWith('vbscript:')) {
            $(element).removeAttr(attribute);
          }
        }
      });
    });
    
    return $.html();
  } catch (error) {
    console.error('Error sanitizing content:', error);
    return ''; // Return empty string on error
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
