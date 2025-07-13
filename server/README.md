# Brrrand Proxy Server

This proxy server is used by the Brrrand application to bypass CORS restrictions when extracting assets from external websites.

## Architecture

The server is built using Express.js and provides the following functionality:

- **Proxy Endpoint**: `/api/proxy?url=<target-url>` - Fetches content from external websites, bypassing CORS restrictions
- **Health Check**: `/api/health` - Provides server status information
- **Static File Serving**: Serves the built React application in production mode

## Security Features

The proxy server implements several security measures:

1. **Rate Limiting**: Prevents abuse by limiting requests per IP address
2. **URL Validation**: Only allows valid HTTP/HTTPS URLs, blocks access to local/private networks
3. **Content Sanitization**: Removes potentially dangerous HTML elements and attributes
4. **Helmet Security Headers**: Sets appropriate security headers to prevent common attacks
5. **CORS Restrictions**: Configures Cross-Origin Resource Sharing appropriately for production

## Endpoints

### GET /api/proxy

Fetches content from an external URL and returns it with appropriate CORS headers.

Query Parameters:
- `url` (required): The target URL to fetch content from

Response:
- Returns the content from the target URL
- Sets appropriate content type headers
- Sanitizes HTML content to prevent XSS attacks

### GET /api/health

Returns the health status of the server.

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2023-09-01T12:00:00.000Z"
}
```

## Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev:server
   ```

3. Run both client and server in development mode:
   ```
   npm run dev:full
   ```

## Production Deployment

1. Build the client application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   NODE_ENV=production npm run server
   ```

## Configuration

The server can be configured using environment variables:

- `PORT`: The port on which the server will listen (default: 5000)
- `NODE_ENV`: Set to 'production' for production mode
- `ALLOWED_ORIGIN`: In production, restricts CORS to this origin (default: https://brrrand.it.com)

## Files

- `index.js`: Main server entry point and route definitions
- `rateLimiter.js`: Rate limiting implementation
- `security.js`: Security middleware configuration
- `utils.js`: Utility functions for validation and sanitization

**Query Parameters:**
- `url` (required): The URL to fetch content from

**Example:**
```
GET /api/proxy?url=https://example.com
```

**Success Response:**
- Status Code: 200
- Content: HTML content from the requested URL

**Error Responses:**
- 400 Bad Request: URL parameter is missing
- 404 Not Found: The requested website could not be found
- 502 Bad Gateway: Connection to the website was refused
- 5xx: Various server errors

## Security Considerations

- The proxy implements basic rate limiting
- URLs are validated before making requests
- Responses are properly sanitized
- Request timeouts prevent hanging connections

## Running the Server

In development:
```
npm run dev:server
```

In production:
```
npm run server
```

Or as part of the full application:
```
npm start
```
