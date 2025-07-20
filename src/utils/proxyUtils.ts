/**
 * Utility functions for interacting with the proxy server
 */

/**
 * Constants for proxy configuration
 */
const PROXY_SERVER_PORT = 5000; // Match the port in server/index.js
const PROXY_ENDPOINT = '/api/proxy';

/**
 * Check if we should use the proxy based on the environment
 * 
 * @returns Whether to use the proxy
 */
export function shouldUseProxy(): boolean {
  // Always use proxy in production
  if (!import.meta.env.DEV) {
    return true;
  }

  // In development, check for an environment flag
  // This allows us to test the proxy in development when needed
  return import.meta.env.VITE_USE_PROXY === 'true';
}

/**
 * Get the base URL for the proxy server
 * 
 * @returns The base URL for the proxy server
 */
export function getProxyBaseUrl(): string {
  if (!import.meta.env.DEV) {
    // In production, use the same origin
    return `${window.location.protocol}//${window.location.host}`;
  } else {
    // In development, the proxy server runs on a different port
    return `${window.location.protocol}//${window.location.hostname}:${PROXY_SERVER_PORT}`;
  }
}

/**
 * Get the appropriate URL for fetching content through the proxy
 * 
 * @param url The target URL
 * @returns The URL to use for fetching (either direct or through proxy)
 */
export function getProxyUrl(url: string): string {
  if (!shouldUseProxy()) {
    return url;
  }
  
  // Build the proxy URL
  return `${getProxyBaseUrl()}${PROXY_ENDPOINT}?url=${encodeURIComponent(url)}`;
}

/**
 * Fetch content from a URL through the proxy server
 * 
 * @param url The URL to fetch
 * @param options Optional fetch options
 * @returns The content from the URL
 */
export async function fetchThroughProxy(url: string, options?: RequestInit): Promise<string> {
  try {
    const proxyUrl = getProxyUrl(url);
    const startTime = Date.now();
    
    const response = await fetch(proxyUrl, {
      ...options,
      // Credentials mode must be 'same-origin' for the proxy to work correctly
      credentials: 'same-origin',
    });
    
    const endTime = Date.now();
    console.debug(`Proxy fetch completed in ${endTime - startTime}ms`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      throw new Error(`Proxy error (${response.status}): ${errorText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching through proxy:', error);
    throw new Error(`Failed to fetch through proxy: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch content through proxy specifically for asset extraction
 * Uses minimal sanitization to preserve HTML structure for accurate parsing
 * 
 * @param url The URL to fetch for asset extraction
 * @returns The minimally sanitized content from the URL
 */
export async function fetchForAssetExtraction(url: string): Promise<string> {
  try {
    const proxyUrl = getProxyUrl(url);
    const startTime = Date.now();
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'X-Purpose': 'asset-extraction', // Signal for minimal sanitization
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
      credentials: 'same-origin',
    });
    
    const endTime = Date.now();
    console.debug(`Asset extraction fetch completed in ${endTime - startTime}ms`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      throw new Error(`Proxy error (${response.status}): ${errorText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching for asset extraction:', error);
    throw new Error(`Failed to fetch for asset extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if the proxy server is available
 * 
 * @returns Promise that resolves to true if the proxy is available, false otherwise
 */
export async function isProxyAvailable(): Promise<boolean> {
  if (!shouldUseProxy()) {
    return false;
  }
  
  try {
    const healthUrl = `${getProxyBaseUrl()}/api/health`;
    const response = await fetch(healthUrl, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
    });
    
    if (response.ok) {
      const data = await response.json() as { status?: string };
      return data.status === 'ok';
    }
    
    return false;
  } catch (error) {
    console.warn('Proxy health check failed:', error);
    return false;
  }
}
