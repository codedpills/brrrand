import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { checkRateLimit } from './rateLimiter';
import { isValidUrl, sanitizeContent } from './utils';
import { setupSecurityMiddleware } from './security';
import { ErrorResponse, HealthResponse } from './types';

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 5000;

setupSecurityMiddleware(app);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.ALLOWED_ORIGIN || 'https://brrrand.it.com']
    : '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist')));

interface RequestWithClientIp extends Request {
  clientIp?: string;
}

app.use((req: Request, res: Response, next: NextFunction) => {
  (req as RequestWithClientIp).clientIp = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
  next();
});
app.get('/api/proxy', async (req: Request, res: Response) => {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ 
      error: 'URL parameter is required and must be a string' 
    } as ErrorResponse);
  }
  
  try {
    new URL(url);
    
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.16.') ||
        parsedUrl.protocol === 'file:') {
      return res.status(403).json({
        error: 'Access to local and private resources is forbidden'
      } as ErrorResponse);
    }
    
    const clientIp = (req as RequestWithClientIp).clientIp || '';
    const rateLimitResult = checkRateLimit(clientIp);
    
    if (rateLimitResult.limited) {
      res.set('X-RateLimit-Limit', MAX_REQUESTS_PER_HOUR.toString());
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', Math.floor(rateLimitResult.resetTime / 1000).toString());
      
      return res.status(429).json({
        error: 'Too many requests. Please try again later.'
      } as ErrorResponse);
    }

    console.log(`[${new Date().toISOString()}] Proxying request to: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Brrrand Asset Extractor/1.0 (https://brrrand.it.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
      maxRedirects: 5,
      responseType: 'text'
    });
    
    res.set('X-RateLimit-Limit', MAX_REQUESTS_PER_HOUR.toString());
    res.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.set('X-RateLimit-Reset', Math.floor(rateLimitResult.resetTime / 1000).toString());
    
    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('text/html')) {
      res.set('Cache-Control', 'public, max-age=300');
    } else if (contentType.includes('image/') || 
               contentType.includes('font/') ||
               contentType.includes('text/css') || 
               contentType.includes('application/javascript')) {
      res.set('Cache-Control', 'public, max-age=86400');
    } else {
      res.set('Cache-Control', 'public, max-age=3600');
    }
    
    if (contentType) {
      res.set('Content-Type', contentType);
    }
    
    if (contentType.includes('text/html')) {
      return res.status(200).send(sanitizeContent(response.data));
    } else {
      return res.status(200).send(response.data);
    }
    
  } catch (error) {
    console.error('Proxy error:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOTFOUND') {
        return res.status(404).json({ 
          error: 'Website not found' 
        } as ErrorResponse);
      }
      
      if ('code' in error && error.code === 'ECONNREFUSED') {
        return res.status(502).json({ 
          error: 'Connection to website refused' 
        } as ErrorResponse);
      }
      
      if ('response' in error && error.response) {
        const axiosResponse = error.response as any;
        const status = axiosResponse.status || 500;
        return res.status(status).json({ 
          error: `Website returned ${status}` 
        } as ErrorResponse);
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch website content' 
    } as ErrorResponse);
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString()
  } as HealthResponse);
});

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' } as ErrorResponse);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' } as ErrorResponse);
});

// Define constant before it's used
const MAX_REQUESTS_PER_HOUR = 100;

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
