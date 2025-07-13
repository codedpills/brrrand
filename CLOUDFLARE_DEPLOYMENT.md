# Cloudflare Workers Deployment Guide

This guide explains how to deploy the Brrrand application to Cloudflare Workers.

## Prerequisites

1. A Cloudflare account
2. Wrangler CLI installed (included in dev dependencies)
3. Node.js 16+ installed

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```

### 3. Create KV Namespace
```bash
# Create production KV namespace
npx wrangler kv:namespace create "RATE_LIMIT_KV"

# Create preview KV namespace for development
npx wrangler kv:namespace create "RATE_LIMIT_KV" --preview
```

### 4. Update wrangler.toml
Update the KV namespace IDs in `wrangler.toml` with the IDs from step 3:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-production-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### 5. Set Environment Variables
Update the `[vars]` section in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
VITE_GA_MEASUREMENT_ID = "your-ga-measurement-id"
VITE_GTM_CONTAINER_ID = "your-gtm-container-id"
```

## Deployment Commands

### Build and Deploy
```bash
# Deploy production version
npm run deploy

# Deploy demo version (with mock data)
npm run deploy:demo

# Deploy real version (with actual scraping)
npm run deploy:real
```

### Development
```bash
# Run locally with Cloudflare Workers environment
npm run cf:dev

# Run regular development server
npm run dev
```

## Environment Modes

The application supports two modes controlled by `VITE_DEMO_MODE`:

- **Demo Mode** (`VITE_DEMO_MODE=true`): Uses mock data, safe for public demos
- **Real Mode** (`VITE_DEMO_MODE=false`): Performs actual website scraping

## Architecture

### Cloudflare Workers
- **Main Worker**: `src/worker.ts` - Handles both API routes and static asset serving
- **Rate Limiting**: Uses Cloudflare KV for storing rate limit counters
- **Static Assets**: Served from KV storage using `@cloudflare/kv-asset-handler`

### API Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/proxy?url=<website>` - Website content proxy with rate limiting

### Security Features
- CORS headers configured for cross-origin requests
- URL validation to prevent SSRF attacks
- Content sanitization to prevent XSS
- Rate limiting (100 requests per hour per IP)
- Private IP range blocking

## Monitoring

### Built-in Analytics
- Google Analytics 4 integration
- Google Tag Manager support
- Web Vitals monitoring
- Custom event tracking

### Cloudflare Analytics
Access Cloudflare dashboard for:
- Request metrics
- Error rates
- Geographic distribution
- Performance metrics

## Troubleshooting

### Common Issues

1. **KV Namespace Not Found**
   - Ensure KV namespaces are created and IDs are correct in wrangler.toml

2. **Rate Limiting Issues**
   - Check KV namespace permissions
   - Verify RATE_LIMIT_KV binding is correct

3. **Static Assets Not Loading**
   - Ensure `npm run build` completed successfully
   - Check that `dist/` directory contains built assets

4. **CORS Errors**
   - Verify CORS headers in worker.ts
   - Check if frontend is making requests to correct endpoints

### Debugging
```bash
# View real-time logs
npx wrangler tail

# Check worker status
npx wrangler whoami

# List KV namespaces
npx wrangler kv:namespace list
```

## Cost Estimation

### Free Tier Limits
- 100,000 requests per day
- 10 GB bandwidth per month
- 1 GB KV storage
- 1,000 KV operations per day

### Scaling
For higher usage, consider:
- Workers Paid plan ($5/month for 10M requests)
- KV usage fees for higher operations
- Bandwidth charges for heavy usage

## Security Considerations

### Rate Limiting
- Currently set to 100 requests per hour per IP
- Adjust in `src/utils/rateLimiter.ts` if needed

### Content Security
- All proxied content is sanitized
- Private IP ranges are blocked
- Only HTTP/HTTPS protocols allowed

### Environment Variables
- Never commit sensitive data to repository
- Use Cloudflare Workers secrets for sensitive values
- Environment variables are build-time only
