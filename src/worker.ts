/**
 * Cloudflare Worker for Brrrand
 * Handles both static asset serving and API routes
 */
/// <reference types="@cloudflare/workers-types" />
import { isValidUrl, sanitizeContent } from './utils/serverUtils';
import { checkRateLimit } from './utils/rateLimiter';

interface Env {
  __STATIC_CONTENT: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, url);
    }
    
    // Handle static assets
    return handleStaticAssets(request, env, ctx);
  },
};

/**
 * Handle API requests
 */
async function handleApiRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    switch (url.pathname) {
      case '/api/health':
        return handleHealthCheck(corsHeaders);
      
      case '/api/proxy':
        if (request.method !== 'GET') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        return handleProxy(request, env, url, corsHeaders);
      
      default:
        return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Handle health check endpoint
 */
function handleHealthCheck(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: 'cloudflare-workers'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Handle proxy endpoint
 */
async function handleProxy(
  request: Request, 
  env: Env, 
  url: URL, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const targetUrl = url.searchParams.get('url');
  
  if (!targetUrl || typeof targetUrl !== 'string') {
    return new Response(JSON.stringify({ 
      error: 'URL parameter is required and must be a string' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Validate URL
  if (!isValidUrl(targetUrl)) {
    return new Response(JSON.stringify({
      error: 'Invalid or unsafe URL'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Check for blocked domains
  const parsedUrl = new URL(targetUrl);
  const hostname = parsedUrl.hostname.toLowerCase();
  
  if (hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') || 
      hostname.startsWith('172.16.') ||
      parsedUrl.protocol === 'file:') {
    return new Response(JSON.stringify({
      error: 'Access to local and private resources is forbidden'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Get client IP for rate limiting
  const clientIp = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   request.headers.get('X-Real-IP') || 
                   'unknown';

  // Check rate limit
  const rateLimitResult = await checkRateLimit(clientIp, env.RATE_LIMIT_KV);
  
  if (rateLimitResult.limited) {
    return new Response(JSON.stringify({
      error: 'Too many requests. Please try again later.'
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime / 1000).toString(),
        ...corsHeaders
      },
    });
  }

  try {
    console.log(`Proxying request to: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Brrrand Asset Extractor/1.0 (https://brrrand.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Website returned ${response.status}`
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const responseHeaders: Record<string, string> = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime / 1000).toString(),
      ...corsHeaders
    };

    // Set cache headers
    if (contentType.includes('text/html')) {
      responseHeaders['Cache-Control'] = 'public, max-age=300';
    } else if (contentType.includes('image/') || 
               contentType.includes('font/') ||
               contentType.includes('text/css') || 
               contentType.includes('application/javascript')) {
      responseHeaders['Cache-Control'] = 'public, max-age=86400';
    } else {
      responseHeaders['Cache-Control'] = 'public, max-age=3600';
    }

    if (contentType) {
      responseHeaders['Content-Type'] = contentType;
    }

    const content = await response.text();
    
    if (contentType.includes('text/html')) {
      return new Response(sanitizeContent(content), {
        status: 200,
        headers: responseHeaders,
      });
    } else {
      return new Response(content, {
        status: 200,
        headers: responseHeaders,
      });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch website content' 
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Handle static assets - direct from environment
 */
async function handleStaticAssets(
  request: Request, 
  env: Env, 
  _ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  let assetPath = url.pathname;
  
  // Default to index.html for root path
  if (assetPath === '/') {
    assetPath = '/index.html';
  }
  
  // Remove leading slash for KV lookup
  const assetKey = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  
  try {
    // Try to get the asset from the KV store
    const asset = await env.__STATIC_CONTENT.get(assetKey);
    
    if (asset) {
      // Determine content type
      const contentType = getContentType(assetPath);
      
      return new Response(asset, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // 1 day cache
        },
      });
    }
  } catch (e) {
    console.error('Error fetching asset:', assetKey, e);
  }
  
  // For SPA routing, return index.html for non-API routes and non-asset requests
  if (!url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
    try {
      const indexHtml = await env.__STATIC_CONTENT.get('index.html');
      if (indexHtml) {
        return new Response(indexHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=300', // 5 minutes for SPA routes
          },
        });
      }
    } catch (e) {
      console.error('Error fetching index.html:', e);
    }
  }
  
  return new Response(`Asset not found: ${assetPath}`, { 
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

/**
 * Get content type based on file extension
 */
function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'json':
      return 'application/json';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    default:
      return 'text/plain';
  }
}
