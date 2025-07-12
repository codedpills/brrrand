/**
 * Mock asset extraction for testing and development
 * Simulates real website asset extraction without CORS issues
 */

import { type AssetExtractionResult } from './assetExtraction'

// Mock HTML content for different test websites
const mockWebsites: Record<string, string> = {
  'stripe.com': `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Stripe - Online payment processing</title>
        <link rel="icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary-color: #635bff;
            --secondary-color: #0a2540;
            --accent-color: #00d924;
          }
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #0a2540;
            background: linear-gradient(180deg, #635bff 0%, #0a2540 100%);
          }
          .logo { background-color: #635bff; }
        </style>
      </head>
      <body>
        <img src="/logo.svg" alt="Stripe Logo" class="logo">
        <img src="/hero-illustration.svg" alt="Payment Processing" class="hero">
        <div style="color: #635bff; background: rgba(99, 91, 255, 0.1);">
          <h1 style="font-family: 'Inter', sans-serif; color: #0a2540;">Online payments</h1>
        </div>
      </body>
    </html>
  `,
  
  'github.com': `
    <!DOCTYPE html>
    <html>
      <head>
        <title>GitHub</title>
        <link rel="icon" href="/favicon.svg">
        <style>
          :root {
            --color-canvas-default: #ffffff;
            --color-fg-default: #24292f;
            --color-accent-fg: #0969da;
            --color-success-fg: #1a7f37;
            --color-danger-fg: #cf222e;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            background: #0d1117;
            color: #f0f6fc;
          }
        </style>
      </head>
      <body>
        <img src="/github-mark.svg" alt="GitHub" class="octicon">
        <img src="/github-logo.svg" alt="GitHub Logo" class="logo">
        <img src="/hero-galaxy.svg" alt="Galaxy Background" class="hero-bg">
        <div style="background: linear-gradient(135deg, #7c3aed, #0969da);">
          <h1>Where the world builds software</h1>
        </div>
      </body>
    </html>
  `,

  'openai.com': `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OpenAI</title>
        <link rel="icon" href="/favicon.ico">
        <link href="https://fonts.googleapis.com/css2?family=Söhne:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Söhne', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #2d333a;
            background: #ffffff;
          }
          .primary { color: #10a37f; }
          .secondary { color: #ff6b6b; }
          .dark { background: #343541; color: #ececf1; }
        </style>
      </head>
      <body>
        <img src="/openai-logo.svg" alt="OpenAI" class="logo">
        <img src="/chatgpt-icon.png" alt="ChatGPT" class="product-logo">
        <img src="/dall-e-gallery.jpg" alt="DALL-E Gallery" class="hero-image">
        <div style="background: linear-gradient(90deg, #10a37f, #1a73e8);">
          <h1 style="font-family: 'Söhne', sans-serif;">Artificial Intelligence</h1>
        </div>
      </body>
    </html>
  `,

  'tailwindcss.com': `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tailwind CSS</title>
        <link rel="icon" href="/favicon.ico">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
        <style>
          :root {
            --tw-color-blue-500: #3b82f6;
            --tw-color-cyan-400: #22d3ee;
            --tw-color-pink-500: #ec4899;
            --tw-color-violet-600: #7c3aed;
          }
          body { 
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          code { font-family: 'JetBrains Mono', monospace; }
        </style>
      </head>
      <body>
        <img src="/tailwind-logo.svg" alt="Tailwind CSS" class="logo">
        <img src="/hero-pattern.svg" alt="Background Pattern" class="pattern">
        <div style="background: linear-gradient(90deg, #3b82f6, #ec4899, #22d3ee);">
          <h1>Rapidly build modern websites</h1>
        </div>
      </body>
    </html>
  `,

  'figma.com': `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Figma</title>
        <link rel="icon" href="/favicon.png">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #ffffff;
          }
          .brand-orange { color: #ff7262; }
          .brand-purple { color: #a259ff; }
          .brand-blue { color: #1abcfe; }
          .brand-green { color: #0acf83; }
          .brand-red { color: #f24e1e; }
        </style>
      </head>
      <body>
        <img src="/figma-logo.svg" alt="Figma" class="logo">
        <img src="/figma-icon.svg" alt="Figma Icon" class="icon">
        <img src="/design-illustration.svg" alt="Design Tools" class="hero">
        <div style="background: linear-gradient(45deg, #ff7262, #a259ff, #1abcfe, #0acf83);">
          <h1>Design and prototype in one place</h1>
        </div>
      </body>
    </html>
  `
}

/**
 * Mock asset extraction that simulates real extraction without CORS issues
 */
export async function mockExtractAssets(url: string): Promise<AssetExtractionResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))

  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    
    // Check if we have mock data for this domain
    if (mockWebsites[domain]) {
      // Use the real parseHtmlForAssets function with our mock HTML
      const { parseHtmlForAssets } = await import('./assetExtraction')
      const assets = await (parseHtmlForAssets as any)(mockWebsites[domain], url)
      
      return {
        success: true,
        url,
        domain,
        extractedAt: new Date().toISOString(),
        assets,
        error: null
      }
    } else {
      // For unknown domains, simulate a realistic extraction result
      return {
        success: true,
        url,
        domain,
        extractedAt: new Date().toISOString(),
        assets: {
          logos: [
            { type: 'logo', url: `${url}/favicon.ico`, alt: 'Favicon', source: 'link' },
            { type: 'logo', url: `${url}/logo.png`, alt: 'Company Logo', source: 'html' }
          ],
          colors: [
            { type: 'color', value: '#007bff', source: 'css' },
            { type: 'color', value: '#6c757d', source: 'css' },
            { type: 'color', value: '#28a745', source: 'css' }
          ],
          fonts: [
            { type: 'font', name: 'Inter', source: 'link' },
            { type: 'font', name: 'Arial', source: 'css' }
          ],
          illustrations: [
            { type: 'illustration', url: `${url}/hero-image.jpg`, alt: 'Hero Image', source: 'html' }
          ]
        },
        error: null
      }
    }
  } catch (error) {
    return {
      success: false,
      url,
      domain: null,
      extractedAt: new Date().toISOString(),
      assets: null,
      error: 'Invalid URL format'
    }
  }
}

/**
 * List of suggested test websites with good mock data
 */
export const suggestedTestSites = [
  'https://stripe.com',
  'https://github.com', 
  'https://openai.com',
  'https://tailwindcss.com',
  'https://figma.com'
]
