# Cloudflare Pages Deployment Guide

This guide will walk you through deploying your Brrrand application to Cloudflare Pages.

## Step-by-Step Deployment

### 1. Access Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Log into your Cloudflare account
3. Navigate to **Workers & Pages** in the left sidebar
4. Click **Create application**
5. Select the **Pages** tab
6. Click **Connect to Git**

### 2. Connect Your GitHub Repository
1. **Authorize GitHub**: If prompted, authorize Cloudflare to access your GitHub account
2. **Select Repository**: Choose your `brrrand` repository from the list
3. **Select Branch**: Choose `main` (or your default branch)
4. Click **Begin setup**

### 3. Configure Build Settings

**Framework preset**: `Vite`

**Build configurations**:
```
Build command: npm run build
Build output directory: dist
Root directory: (leave empty)
```

**Advanced settings**:
```
Node.js version: 18
Environment variables: (see next step)
```

### 4. Set Environment Variables

Click **Add variable** for each of these:

**Required Variables**:
```
VITE_DEMO_MODE = false
VITE_SHOW_DEMO_TOGGLE = false
VITE_APP_VERSION = 1.0.0
VITE_ENABLE_ANALYTICS = true
```

**Optional (Analytics)**:
```
VITE_GA_MEASUREMENT_ID = your-actual-ga-id
VITE_GTM_CONTAINER_ID = your-actual-gtm-id
```

### 5. Deploy
1. Click **Save and Deploy**
2. Cloudflare will:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy static assets and API functions

### 6. Set Up KV Storage for Rate Limiting

1. Go to **Workers & Pages** → **KV**
2. Click **Create namespace**
3. Name it: `brrrand-rate-limit`
4. Go back to your Pages project
5. Go to **Settings** → **Functions**
6. Add KV namespace binding:
   - **Variable name**: `RATE_LIMIT_KV`
   - **KV namespace**: Select `brrrand-rate-limit`

### 7. Test Your Deployment

Your app will be available at: `https://brrrand.it.com` (with custom domain) or `https://brrrand.pages.dev` (Cloudflare subdomain)

**Test these endpoints**:
- **Homepage**: `https://brrrand.it.com`
- **Health Check**: `https://brrrand.it.com/api/health`
- **Asset Extraction**: Try extracting assets from a website

## What Gets Deployed

### Static Assets
- React application (HTML, CSS, JS)
- Images and fonts
- Service worker (if applicable)

### API Functions
- `/api/health` - Health check endpoint
- `/api/proxy` - Website content proxy with rate limiting

### Features Included
- ✅ Brand asset extraction
- ✅ Rate limiting (100 requests/hour per IP)
- ✅ CORS configured for cross-origin requests
- ✅ Analytics tracking (GA4 + GTM)
- ✅ Responsive design
- ✅ Demo/real mode switching

## Custom Domain (Optional)

### Add Your Domain
1. In your Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `brrrand.it.com`
4. Follow DNS configuration instructions
5. SSL certificate will be automatically provisioned

### DNS Configuration
You'll need to add a CNAME record:
```
Type: CNAME
Name: @ (or subdomain)
Target: brrrand.pages.dev
```

## Monitoring & Analytics

### Built-in Monitoring
- **Pages Analytics**: View in Cloudflare dashboard
- **Real-time Logs**: Available in Functions section
- **Performance Metrics**: Core Web Vitals tracking

### Your Analytics
- **Google Analytics 4**: Configured if you set GA_MEASUREMENT_ID
- **Google Tag Manager**: Configured if you set GTM_CONTAINER_ID
- **Web Vitals**: Automatic performance monitoring

## Automatic Deployments

Every time you push to your `main` branch:
1. Cloudflare automatically detects changes
2. Rebuilds your application
3. Deploys the new version
4. Zero downtime deployment

## Environment Modes

Your app supports different modes:

**Demo Mode** (`VITE_DEMO_MODE=true`):
- Uses mock data
- Safe for public demos
- No actual web scraping

**Production Mode** (`VITE_DEMO_MODE=false`):
- Real website scraping
- Rate limited for safety
- Full functionality

## Cost & Limits

### Free Tier Includes:
- **Builds**: 500 builds per month
- **Bandwidth**: 100 GB per month
- **Requests**: 100,000 per day
- **Custom domains**: Unlimited
- **SSL certificates**: Automatic

### Rate Limiting:
- 100 requests per hour per IP address
- Adjustable in `/functions/_lib/rateLimiter.ts`

## Troubleshooting

### Build Fails
- Check Node.js version is 18
- Verify all dependencies are in `package.json`
- Test build locally: `npm run build`

### Functions Not Working
- Check KV namespace is properly bound
- Verify environment variables are set
- Check function logs in dashboard

### Assets Not Loading
- Verify build output directory is `dist`
- Check that Vite build completed successfully
- Ensure proper CORS headers

## Next Steps After Deployment

1. **Test thoroughly**: Check all features work
2. **Set up monitoring**: Configure alerts if needed
3. **Add analytics**: Update GA4/GTM IDs
4. **Custom domain**: Set up your domain
5. **Performance**: Monitor Core Web Vitals

Your Brrrand application will be fully functional and production-ready!
