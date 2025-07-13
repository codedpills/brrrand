# Deployment Guide: Cloudflare Pages

This guide walks you through deploying the Brrrand app to Cloudflare Pages.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Node.js**: Ensure you have Node.js 18+ installed locally

## Step 1: Set Up Cloudflare KV

1. Go to your Cloudflare dashboard
2. Navigate to **Workers & Pages** → **KV**
3. Create a new KV namespace called `brrrand-rate-limit`
4. Note down the namespace ID for production and preview

## Step 2: Configure Environment Variables

1. Update `.env.production` with your actual analytics IDs:
   ```bash
   VITE_GA_MEASUREMENT_ID=G-YOUR-ACTUAL-ID
   VITE_GTM_CONTAINER_ID=GTM-YOUR-ACTUAL-ID
   ```

## Step 3: Deploy to Cloudflare Pages

### Option A: Using Cloudflare Dashboard (Recommended)

1. Go to **Workers & Pages** in your Cloudflare dashboard
2. Click **Create application** → **Pages** → **Connect to Git**
3. Select your GitHub repository
4. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty if repository root)

5. Set environment variables in the dashboard:
   ```
   VITE_APP_VERSION=1.0.0
   VITE_DEMO_MODE=false
   VITE_SHOW_DEMO_TOGGLE=false
   VITE_ENABLE_ANALYTICS=true
   VITE_GA_MEASUREMENT_ID=G-YOUR-ACTUAL-ID
   VITE_GTM_CONTAINER_ID=GTM-YOUR-ACTUAL-ID
   ```

6. In **Functions** settings, configure:
   - **KV namespace bindings**: 
     - Variable name: `RATE_LIMIT_KV`
     - KV namespace: Select your created namespace

7. Click **Save and Deploy**

### Option B: Using Wrangler CLI

1. Install Wrangler globally:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Update `wrangler.toml` with your KV namespace IDs:
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "your-actual-kv-namespace-id"
   preview_id = "your-actual-preview-kv-namespace-id"
   ```

4. Deploy:
   ```bash
   npm run build
   wrangler pages publish dist --project-name=brrrand
   ```

## Step 4: Configure Custom Domain (Optional)

1. In your Cloudflare Pages dashboard, go to **Custom domains**
2. Add your domain (e.g., `brrrand.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

## Step 5: Set Up Analytics

1. **Google Analytics 4**:
   - Create a GA4 property at [analytics.google.com](https://analytics.google.com)
   - Copy the Measurement ID (G-XXXXXXXXXX)
   - Update your environment variables

2. **Google Tag Manager**:
   - Create a container at [tagmanager.google.com](https://tagmanager.google.com)
   - Copy the Container ID (GTM-XXXXXXX)
   - Update your environment variables

## Step 6: Test Your Deployment

1. Visit your deployed site
2. Test the asset extraction functionality
3. Check browser console for any errors
4. Verify analytics are working (if configured)

## API Endpoints

Your deployed app will have these API endpoints:

- `https://your-domain.pages.dev/api/health` - Health check
- `https://your-domain.pages.dev/api/proxy?url=<website-url>` - Proxy for asset extraction

## Monitoring and Debugging

1. **Real-time logs**: Use `wrangler pages deployment tail` for live logs
2. **Analytics**: Monitor usage in Cloudflare Analytics
3. **Performance**: Check Core Web Vitals in Google Analytics

## Troubleshooting

### Common Issues:

1. **Build failures**: Check Node.js version compatibility
2. **API errors**: Verify KV namespace binding
3. **CORS issues**: Check `_headers` file configuration
4. **Rate limiting**: Monitor KV storage usage

### Support:

- Cloudflare Community: [community.cloudflare.com](https://community.cloudflare.com)
- GitHub Issues: Create an issue in your repository
- Documentation: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_APP_VERSION` | App version for analytics | No | `1.0.0` |
| `VITE_DEMO_MODE` | Enable demo mode | No | `false` |
| `VITE_SHOW_DEMO_TOGGLE` | Show demo toggle | No | `false` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | No | `true` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 ID | No | `G-XXXXXXXXXX` |
| `VITE_GTM_CONTAINER_ID` | Google Tag Manager ID | No | `GTM-XXXXXXX` |

## Security Notes

- Rate limiting is implemented using Cloudflare KV
- CORS headers are configured for security
- Content Security Policy is set in `_headers`
- URL validation prevents access to private networks
- HTML content is sanitized before serving
