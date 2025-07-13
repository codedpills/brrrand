# Brrrand - Brand Asset Extraction

A React-based web application that extracts brand assets (logos, colors, fonts, illustrations) from websites.

## Features

- **Instant Asset Extraction**: Extract brand assets from any website URL
- **Demo Mode**: Test with realistic mock data to avoid CORS issues
- **Server-side Proxy**: Bypasses CORS restrictions and adds security
- **Environment-Based Configuration**: Configurable via environment variables
- **Comprehensive Testing**: Full test coverage with TDD approach
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Environment Configuration

### Environment Variables

- `VITE_DEMO_MODE`: Controls demo mode (true/false)
- `VITE_SHOW_DEMO_TOGGLE`: Controls toggle visibility (true/false)
- `VITE_USE_PROXY`: Controls whether to use the proxy in development (true/false)
- `PORT`: The port on which the proxy server will run (default: 5000)
- `ALLOWED_ORIGIN`: In production, restricts CORS to this origin (default: https://brrrand.com)

### Development Scripts

```bash
# Default development (uses .env.development)
npm run dev

# Force demo mode
npm run dev:demo

# Force real extraction mode
npm run dev:real

# Run proxy server in development mode
npm run dev:server

# Run both client and proxy server together
npm run dev:full
```

### Build Scripts

```bash
# Default production build (uses .env.production)
npm run build

# Build with demo mode enabled
npm run build:demo

# Build with real mode enabled
npm run build:real
```

### Production Scripts

```bash
# Build and start production server
npm run start

# Start server only (after build)
npm run server
```

## Environment Files

- `.env.development` - Development defaults (demo mode enabled)
- `.env.production` - Production defaults (real mode enabled)
- `.env.local` - Local overrides (git-ignored)

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Project Structure

```
src/
├── components/
│   ├── LandingPage.tsx        # Main UI component
│   └── LandingPage.test.tsx   # Component tests
├── utils/
│   ├── urlValidation.ts       # URL validation utilities
│   ├── urlValidation.test.ts  # URL validation tests
│   ├── assetExtraction.ts     # Real asset extraction logic
│   ├── assetExtraction.test.ts# Asset extraction tests
│   ├── mockAssetExtraction.ts # Mock data for demo mode
│   └── mockAssetExtraction.ts # Mock extraction tests
└── test/
    └── setup.ts               # Test configuration
```

## Why Demo Mode?

Demo mode was created to solve CORS (Cross-Origin Resource Sharing) issues that occur when trying to fetch content from external websites in the browser. Demo mode provides:

- Mock asset extraction with realistic data
- Suggested test sites (Stripe, GitHub, OpenAI, etc.)
- Full functionality testing without CORS restrictions
- Consistent results for development and testing

For production deployments that need real asset extraction, you would typically need a backend proxy or CORS-enabled setup.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite 6
- **Testing**: Vitest, Testing Library
- **Routing**: TanStack Router (configured)
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

4. Test with demo mode (default) or toggle to real mode

## Configuration Examples

### Local Development with Real Mode
Create `.env.local`:
```
VITE_DEMO_MODE=false
VITE_SHOW_DEMO_TOGGLE=true
```

### Demo Deployment
```bash
npm run build:demo
```

### Production with Real Extraction
```bash
npm run build:real
```

## Deployment

### Cloudflare Pages (Recommended)
Deploy to Cloudflare Pages for reliable static site hosting with serverless functions:

```bash
# Build for deployment
npm run build
```

Then follow the step-by-step guide in [QUICK_PAGES_DEPLOYMENT.md](./QUICK_PAGES_DEPLOYMENT.md).

**Quick Setup:**
1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Connect your GitHub repository
3. Use build command: `npm run build`
4. Set build output directory: `dist`
5. Add environment variables as specified in the guide

### Alternative Deployments
- **Cloudflare Workers**: See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- **Traditional Server**: Node.js/Express deployment options in [DEPLOYMENT.md](./DEPLOYMENT.md)

## Development

The application is fully configured with environment-based demo mode:

- **Development**: Demo mode enabled by default to avoid CORS issues
- **Production**: Real mode enabled by default for actual asset extraction
- **Testing**: Comprehensive test suite with 41 passing tests

For detailed environment configuration, see [ENV_CONFIG.md](./ENV_CONFIG.md).

## Proxy Server

The application includes a server-side proxy to handle CORS issues when extracting assets from external websites. This is especially important for production use.

### Key Features

- **CORS Handling**: Bypasses browser CORS restrictions
- **Rate Limiting**: Prevents abuse of the proxy
- **URL Validation**: Ensures only valid URLs are processed
- **Content Sanitization**: Removes potentially dangerous elements
- **Security Headers**: Protects against common web vulnerabilities

### Architecture

```
Client (React App) <-> Proxy Server (Express) <-> External Websites
```

### Configuration

To use the proxy server in development:

```bash
# Start both client and server
npm run dev:full

# Or set environment variable in .env.local
VITE_USE_PROXY=true
```

For more details on the proxy server implementation, see [server/README.md](./server/README.md).
