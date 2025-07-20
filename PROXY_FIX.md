# Proxy Error Fix - July 20, 2025

## Issue
Production deployment was failing with proxy error:
```
Failed to fetch through proxy: Proxy error (500): {"error":"Internal server error"}
```

## Root Cause
1. **Missing Rate Limiter**: The `functions/_lib/rateLimiter.ts` file was empty, causing `checkRateLimit` function to be undefined
2. **Cheerio Dependency**: The utils function was trying to import `cheerio` which isn't available in Cloudflare Functions environment
3. **Insufficient Error Handling**: Limited logging made debugging difficult

## Fixes Applied

### 1. Created Rate Limiter Function
- **File**: `functions/_lib/rateLimiter.ts`
- **Added**: Complete rate limiting implementation with KV storage
- **Features**:
  - 100 requests per hour per IP
  - Graceful fallback if KV unavailable
  - Error handling for KV operations

### 2. Removed Cheerio Dependency
- **File**: `functions/_lib/utils.ts`
- **Changed**: `sanitizeContent` function to use regex-based sanitization
- **Benefit**: No external dependencies, works in Cloudflare Functions
- **Security**: Still removes dangerous elements and attributes

### 3. Enhanced Error Handling
- **File**: `functions/api/proxy.ts`
- **Added**:
  - Detailed logging with request context
  - Optional KV handling (graceful degradation)
  - Better error messages with specific HTTP status codes
  - Development mode error details

### 4. Improved Logging
- **Added**: Console logs for debugging:
  - Request parameters
  - KV availability status
  - Rate limit results
  - Detailed error information

## Configuration Required

### KV Namespace Binding
Ensure in Cloudflare Pages dashboard:
1. **Workers & Pages** → **KV** → Create namespace: `brrrand-rate-limit`
2. **Pages Project** → **Settings** → **Functions** → Add binding:
   - Variable name: `RATE_LIMIT_KV`
   - KV namespace: `brrrand-rate-limit`

### Environment Variables
No additional environment variables required for this fix.

## Testing

### Local Development
The proxy should work locally with graceful fallbacks.

### Production Testing
Test these endpoints after redeployment:
- `https://brrrand.it.com/api/health` - Should return OK
- `https://brrrand.it.com/api/proxy?url=https://example.com` - Should return website content

## Fallback Behavior

### If KV Unavailable
- Rate limiting is skipped with warning log
- Request proceeds with default limits
- User experience is unaffected

### If Sanitization Fails
- Falls back to basic HTML entity escaping
- Content is still safely served
- Error is logged for monitoring

## Future Improvements

1. **Add Metrics**: Track proxy usage and errors
2. **Enhanced Sanitization**: Consider DOMPurify for better HTML cleaning
3. **Caching**: Add response caching for frequently requested sites
4. **Rate Limit UI**: Show rate limit status to users

## Deployment Notes

After this fix:
1. Redeploy to Cloudflare Pages
2. Verify KV namespace binding
3. Test proxy functionality
4. Monitor function logs for any remaining issues

The application should now handle website proxying correctly in production.

---

## Asset Extraction Enhancement - July 20, 2025

### Issue with Original Fix
After implementing the proxy error fix, websites were returning zero assets because:
- The regex-based sanitization was too aggressive 
- It removed `<link>`, `<meta>`, `<style>`, and other elements needed for asset extraction
- The secure HTML parser (`cheerio`) needs these elements to extract brand assets

### Enhanced Solution

#### 1. **Two-Tier Sanitization Approach**
- **Regular sanitization**: For general web browsing (removes forms, dangerous elements)
- **Minimal sanitization**: For asset extraction (preserves HTML structure)

#### 2. **Smart Header-Based Detection**
- Client sends `X-Purpose: asset-extraction` header for asset extraction requests
- Proxy automatically uses minimal sanitization for these requests
- Maintains security while maximizing extraction accuracy

#### 3. **Specialized Functions**
- **`fetchForAssetExtraction()`**: New function for asset extraction with proper headers
- **`minimalSanitizeForExtraction()`**: Removes only critical security threats
- **`sanitizeContent()`**: Enhanced to preserve asset-related elements

#### 4. **What Gets Preserved for Asset Extraction**
- ✅ `<link>` tags (for fonts, stylesheets, favicons)
- ✅ `<meta>` tags (for theme colors, descriptions)
- ✅ `<style>` tags (for CSS analysis)
- ✅ `<img>` and `<svg>` tags (for logos and illustrations)
- ✅ Class and ID attributes (for CSS selectors)
- ✅ Data URLs for inline SVGs and images

#### 5. **What Still Gets Removed**
- ❌ `<script>` tags (critical security)
- ❌ Event handlers (`onclick`, `onload`, etc.)
- ❌ `javascript:` protocols
- ❌ Form elements (`<form>`, `<input>`, `<button>`)
- ❌ Dangerous objects (`<iframe>`, `<object>`, `<embed>`)

### Files Updated
- `functions/_lib/utils.ts` - Added `minimalSanitizeForExtraction()` function
- `functions/api/proxy.ts` - Header-based sanitization selection
- `src/utils/proxyUtils.ts` - Added `fetchForAssetExtraction()` function
- `src/utils/assetExtraction.ts` - Uses new specialized fetch function

### Expected Results
✅ **Much higher asset extraction success rate** - Websites should now return logos, colors, fonts, and illustrations  
✅ **Maintained security** - Still protected against XSS and code injection  
✅ **Better performance** - Optimized sanitization based on request type  
✅ **Detailed logging** - Enhanced debugging information for troubleshooting  
