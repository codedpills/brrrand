import { isValidUrl, sanitizeContent, minimalSanitizeForExtraction } from '../_lib/utils';
import { checkRateLimit } from '../_lib/rateLimiter';

interface Env {
  RATE_LIMIT_KV: KVNamespace;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  console.log('Proxy request received:', { targetUrl, hasKV: !!env.RATE_LIMIT_KV });

  if (!targetUrl || typeof targetUrl !== 'string') {
    console.log('Invalid URL parameter:', targetUrl);
    return new Response(JSON.stringify({ 
      error: 'URL parameter is required and must be a string' 
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    if (!isValidUrl(targetUrl)) {
      return new Response(JSON.stringify({
        error: 'Invalid or unsafe URL'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const parsedUrl = new URL(targetUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Block local/private resources
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
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     request.headers.get('X-Real-IP') || 
                     'unknown';

    console.log('Client IP:', clientIp);

    // Check rate limit if KV is available
    let rateLimitResult = {
      limited: false,
      remaining: 100,
      resetTime: Date.now() + 3600000 // 1 hour from now
    };

    if (env.RATE_LIMIT_KV) {
      try {
        rateLimitResult = await checkRateLimit(clientIp, env.RATE_LIMIT_KV);
        console.log('Rate limit result:', rateLimitResult);
      } catch (error) {
        console.error('Rate limit check failed:', error);
        // Continue without rate limiting if KV fails
      }
    } else {
      console.warn('RATE_LIMIT_KV not available, skipping rate limiting');
    }
    
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
        }
      });
    }

    console.log(`Proxying request to: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Brrrand Asset Extractor/1.0 (https://brrrand.it.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Website returned ${response.status}`
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const responseHeaders = {
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
      // Check if this is an asset extraction request (minimal sanitization)
      const isAssetExtraction = request.headers.get('X-Purpose') === 'asset-extraction';
      
      const sanitizedContent = isAssetExtraction 
        ? minimalSanitizeForExtraction(content)
        : sanitizeContent(content);
        
      console.log('HTML sanitization:', { 
        isAssetExtraction, 
        originalLength: content.length, 
        sanitizedLength: sanitizedContent.length 
      });
      
      return new Response(sanitizedContent, {
        status: 200,
        headers: responseHeaders
      });
    } else {
      return new Response(content, {
        status: 200,
        headers: responseHeaders
      });
    }
    
  } catch (error) {
    console.error('Proxy error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      targetUrl,
      timestamp: new Date().toISOString()
    });
    
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch website content',
          details: 'The target website may be unavailable or blocking requests'
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      if (error.message.includes('timeout')) {
        return new Response(JSON.stringify({ 
          error: 'Request timeout',
          details: 'The target website took too long to respond'
        }), {
          status: 504,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
