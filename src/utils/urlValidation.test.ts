import { describe, it, expect } from 'vitest'
import { validateUrl, normalizeUrl, isValidUrl, getUrlDomain } from './urlValidation'

describe('URL Validation Utils', () => {
  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('http://www.google.com')).toBe(true)
      expect(isValidUrl('http://subdomain.example.org')).toBe(true)
    })

    it('should return true for valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('https://www.google.com')).toBe(true)
      expect(isValidUrl('https://app.example.com/path')).toBe(true)
    })

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('ftp://example.com')).toBe(false)
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('   ')).toBe(false)
    })

    it('should return false for malformed URLs', () => {
      expect(isValidUrl('http://')).toBe(false)
      expect(isValidUrl('https://')).toBe(false)
      expect(isValidUrl('http://.')).toBe(false)
      expect(isValidUrl('http://..')).toBe(false)
    })
  })

  describe('normalizeUrl', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com')
      expect(normalizeUrl('www.google.com')).toBe('https://www.google.com')
      expect(normalizeUrl('subdomain.example.org')).toBe('https://subdomain.example.org')
    })

    it('should preserve existing protocol', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com')
      expect(normalizeUrl('https://example.com')).toBe('https://example.com')
    })

    it('should trim whitespace', () => {
      expect(normalizeUrl('  example.com  ')).toBe('https://example.com')
      expect(normalizeUrl('\n\texample.com\t\n')).toBe('https://example.com')
    })

    it('should handle URLs with paths and query parameters', () => {
      expect(normalizeUrl('example.com/path?query=1')).toBe('https://example.com/path?query=1')
      expect(normalizeUrl('www.site.com/page#anchor')).toBe('https://www.site.com/page#anchor')
    })
  })

  describe('getUrlDomain', () => {
    it('should extract domain from valid URLs', () => {
      expect(getUrlDomain('https://example.com')).toBe('example.com')
      expect(getUrlDomain('http://www.google.com')).toBe('www.google.com')
      expect(getUrlDomain('https://app.example.com/path')).toBe('app.example.com')
    })

    it('should handle URLs with ports', () => {
      expect(getUrlDomain('https://example.com:8080')).toBe('example.com')
      expect(getUrlDomain('http://localhost:3000')).toBe('localhost')
    })

    it('should return null for invalid URLs', () => {
      expect(getUrlDomain('not-a-url')).toBe(null)
      expect(getUrlDomain('')).toBe(null)
      expect(getUrlDomain('ftp://example.com')).toBe(null)
    })
  })

  describe('validateUrl', () => {
    it('should return success result for valid URLs', () => {
      const result = validateUrl('https://example.com')
      expect(result.isValid).toBe(true)
      expect(result.normalizedUrl).toBe('https://example.com')
      expect(result.domain).toBe('example.com')
      expect(result.error).toBeNull()
    })

    it('should normalize and validate URLs without protocol', () => {
      const result = validateUrl('example.com')
      expect(result.isValid).toBe(true)
      expect(result.normalizedUrl).toBe('https://example.com')
      expect(result.domain).toBe('example.com')
      expect(result.error).toBeNull()
    })

    it('should return error result for invalid URLs', () => {
      const result = validateUrl('not-a-url')
      expect(result.isValid).toBe(false)
      expect(result.normalizedUrl).toBeNull()
      expect(result.domain).toBeNull()
      expect(result.error).toBe('Please enter a valid website URL')
    })

    it('should return error for empty input', () => {
      const result = validateUrl('')
      expect(result.isValid).toBe(false)
      expect(result.normalizedUrl).toBeNull()
      expect(result.domain).toBeNull()
      expect(result.error).toBe('URL is required')
    })

    it('should return error for whitespace-only input', () => {
      const result = validateUrl('   ')
      expect(result.isValid).toBe(false)
      expect(result.normalizedUrl).toBeNull()
      expect(result.domain).toBeNull()
      expect(result.error).toBe('URL is required')
    })
  })
})
