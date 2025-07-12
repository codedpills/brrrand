# Environment Configuration

This project supports environment-based configuration for demo mode and other features.

## Environment Variables

### VITE_DEMO_MODE
Controls whether the application starts in demo mode (using mock data) or real mode (fetching from actual websites).

- `true` - Enable demo mode (uses mock asset extraction to avoid CORS issues)
- `false` - Enable real mode (attempts to fetch from actual websites)
- Default: `true` in development, `false` in production

### VITE_SHOW_DEMO_TOGGLE
Controls whether the demo mode toggle switch is visible to users.

- `true` - Show the demo mode toggle
- `false` - Hide the demo mode toggle
- Default: `true` in development, `false` in production

## Environment Files

### .env.development
Used when running `npm run dev` or in development mode.
```
VITE_DEMO_MODE=true
VITE_SHOW_DEMO_TOGGLE=true
```

### .env.production
Used when building for production with `npm run build`.
```
VITE_DEMO_MODE=false
VITE_SHOW_DEMO_TOGGLE=false
```

### .env.local
Use this file to override environment variables for your local development environment.
This file is git-ignored and won't be committed.

Example `.env.local`:
```
# Override to test real extraction locally
VITE_DEMO_MODE=false
VITE_SHOW_DEMO_TOGGLE=true
```

## NPM Scripts

### Development Scripts
- `npm run dev` - Start development server with default environment
- `npm run dev:demo` - Force demo mode enabled
- `npm run dev:real` - Force real mode enabled

### Build Scripts
- `npm run build` - Build for production with default environment
- `npm run build:demo` - Build with demo mode enabled
- `npm run build:real` - Build with real mode enabled

## Usage Examples

### Development with Demo Mode (Default)
```bash
npm run dev
```

### Development with Real Mode (for testing CORS solutions)
```bash
npm run dev:real
```

### Testing Different Configurations
```bash
# Test with custom environment variables
VITE_DEMO_MODE=false VITE_SHOW_DEMO_TOGGLE=true npm run dev
```

### Production Build with Demo Mode (for demo deployments)
```bash
npm run build:demo
```

## Why Demo Mode?

Demo mode was created to solve CORS (Cross-Origin Resource Sharing) issues that occur when trying to fetch content from external websites in the browser. When running locally or from a different domain, browsers block requests to external sites for security reasons.

Demo mode provides:
- Mock asset extraction with realistic data
- Suggested test sites (Stripe, GitHub, OpenAI, etc.)
- Full functionality testing without CORS restrictions
- Consistent results for development and testing

For production deployments that need real asset extraction, you would typically:
1. Deploy to the same domain as the target websites, or
2. Use a backend proxy server to fetch content, or  
3. Use a CORS proxy service
