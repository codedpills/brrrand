# Domain Configuration Update

## New Domain: brrrand.it.com

The Brrrand application has been updated to use the new domain `brrrand.it.com` instead of the originally planned `brrrand.com`.

### Updated Files

**Code Files:**
- `src/utils/serverUtils.ts` - Updated User-Agent string
- `server/security.ts` - Updated CORS origin
- `server/index.ts` - Updated CORS origin and User-Agent
- `functions/api/proxy.ts` - Updated User-Agent string
- `src/worker.ts` - Updated User-Agent string
- `package.json` - Added homepage field

**Documentation Files:**
- `README.md` - Updated ALLOWED_ORIGIN documentation
- `server/README.md` - Updated ALLOWED_ORIGIN documentation
- `DEPLOYMENT.md` - Updated custom domain example
- `QUICK_PAGES_DEPLOYMENT.md` - Updated custom domain example and test URLs

### Deployment Steps for New Domain

1. **Cloudflare Pages Setup:**
   - Domain: `brrrand.it.com`
   - Cloudflare subdomain: `brrrand.pages.dev`

2. **DNS Configuration:**
   ```
   Type: CNAME
   Name: @ (root domain)
   Target: brrrand.pages.dev
   ```

3. **Environment Variables:**
   - Set `ALLOWED_ORIGIN=https://brrrand.it.com` for production
   - All other environment variables remain the same

### Testing URLs

- **Production:** `https://brrrand.it.com`
- **Staging:** `https://brrrand.pages.dev`
- **Health Check:** `https://brrrand.it.com/api/health`
- **API Proxy:** `https://brrrand.it.com/api/proxy`

All references to the old domain have been updated to ensure proper functionality with the new domain.
