/**
 * Common types for the server
 */

import { Request, Response } from 'express';

/**
 * Extended Express Request with IP
 */
export interface ExtendedRequest extends Request {
  clientIp?: string;
}

/**
 * Rate limit response
 */
export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  status?: number;
  details?: unknown;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}
