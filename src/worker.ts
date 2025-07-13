/**
 * Cloudflare Worker for Brrrand
 * Handles both static asset serving and API routes
 */
/// <reference types="@cloudflare/workers-types" />
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { isValidUrl, sanitizeContent } from './utils/serverUtils';
import { checkRateLimit } from './utils/rateLimiter';

interface Env {
  __STATIC_CONTENT: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    console.log('Request:', url.pathname);
    
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
 * Handle static assets using proper KV Asset Handler
 */
async function handleStaticAssets(
  request: Request, 
  env: Env, 
  ctx: ExecutionContext
): Promise<Response> {
  try {
    return await getAssetFromKV(
      {
        request,
        waitUntil: ctx.waitUntil.bind(ctx),
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        cacheControl: {
          browserTTL: 86400, // 1 day
          edgeTTL: 86400 * 7, // 7 days
        },
      }
    );
  } catch (e) {
    const url = new URL(request.url);
    console.log('Asset not found:', url.pathname, 'Error:', e);
    
    // For SPA routing, return index.html for non-API routes
    if (!url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
      try {
        const indexRequest = new Request(`${url.origin}/index.html`, {
          method: request.method,
          headers: request.headers,
        });
        
        return await getAssetFromKV(
          {
            request: indexRequest,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            cacheControl: {
              browserTTL: 86400,
              edgeTTL: 86400 * 7,
            },
          }
        );
      } catch (indexError) {
        console.error('Index.html not found:', indexError);
      }
    }
    
    return new Response(`Asset not found: ${url.pathname}`, { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}