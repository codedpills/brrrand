#!/bin/bash

# Brrrand Cloudflare Workers Deployment Script

echo "🚀 Brrrand Deployment to Cloudflare Workers"
echo "==========================================="

# Check if wrangler is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is required but not installed."
    exit 1
fi

# Check if wrangler.toml exists
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found in current directory."
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Check KV namespace configuration
echo "🔍 Checking KV namespace configuration..."
if grep -q "your-kv-namespace-id" wrangler.toml; then
    echo "⚠️  Warning: Default KV namespace IDs found in wrangler.toml"
    echo "   Please update with your actual KV namespace IDs:"
    echo "   1. Run: npx wrangler kv:namespace create \"RATE_LIMIT_KV\""
    echo "   2. Run: npx wrangler kv:namespace create \"RATE_LIMIT_KV\" --preview"
    echo "   3. Update the IDs in wrangler.toml"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Check environment variables
echo "🔧 Checking environment configuration..."
if grep -q "your-ga-measurement-id" wrangler.toml; then
    echo "⚠️  Warning: Default GA measurement ID found in wrangler.toml"
    echo "   Consider updating with your actual Google Analytics ID"
fi

if grep -q "your-gtm-container-id" wrangler.toml; then
    echo "⚠️  Warning: Default GTM container ID found in wrangler.toml"
    echo "   Consider updating with your actual Google Tag Manager ID"
fi

# Deploy
echo "🚀 Deploying to Cloudflare Workers..."
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 Next steps:"
    echo "1. Test your deployment at the provided URL"
    echo "2. Monitor logs with: npx wrangler tail"
    echo "3. Check analytics in Cloudflare dashboard"
    echo ""
    echo "🔗 Useful commands:"
    echo "   npx wrangler tail           # View real-time logs"
    echo "   npx wrangler kv:namespace list  # List KV namespaces"
    echo "   npm run cf:dev             # Local development"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
