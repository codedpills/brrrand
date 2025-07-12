# Brrrand - Brand Asset Extraction

A React-based web application that extracts brand assets (logos, colors, fonts, illustrations) from websites.

## Features

- **Instant Asset Extraction**: Extract brand assets from any website URL
- **Demo Mode**: Test with realistic mock data to avoid CORS issues
- **Environment-Based Configuration**: Configurable via environment variables
- **Comprehensive Testing**: Full test coverage with TDD approach
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Environment Configuration

### Environment Variables

- `VITE_DEMO_MODE`: Controls demo mode (true/false)
- `VITE_SHOW_DEMO_TOGGLE`: Controls toggle visibility (true/false)

### Development Scripts

```bash
# Default development (uses .env.development)
npm run dev

# Force demo mode
npm run dev:demo

# Force real extraction mode
npm run dev:real
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

## Development

The application is fully configured with environment-based demo mode:

- **Development**: Demo mode enabled by default to avoid CORS issues
- **Production**: Real mode enabled by default for actual asset extraction
- **Testing**: Comprehensive test suite with 41 passing tests

For detailed environment configuration, see [ENV_CONFIG.md](./ENV_CONFIG.md).
