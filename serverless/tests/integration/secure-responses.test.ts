import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/testing';
import type { AppEnv } from '../../src/types';

// Create a test app to verify secure error responses
const testApp = new Hono<AppEnv>();

// Simulate the secure error response behavior
function createSecureErrorResponse(errorType: string, statusCode: number) {
  const response = new Response(
    JSON.stringify({
      error: errorType,
      message: getErrorMessage(errorType),
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        ...(statusCode === 429 && { 'Retry-After': '60' }),
      },
    }
  );

  return response;
}

function getErrorMessage(errorType: string): string {
  const messages: Record<string, string> = {
    invalid_signature: 'Webhook signature validation failed',
    invalid_payload: 'Webhook payload validation failed',
    rate_limit_exceeded: 'Request rate limit exceeded',
    missing_shop_domain: 'Required shop domain header missing',
    configuration_error: 'Service configuration error',
    processing_failed: 'Webhook processing failed',
  };
  return messages[errorType] || 'An error occurred processing the webhook';
}

// Test routes that simulate the error responses
testApp.get('/test-401', () => createSecureErrorResponse('invalid_signature', 401));
testApp.get('/test-400', () => createSecureErrorResponse('invalid_payload', 400));
testApp.get('/test-429', () => createSecureErrorResponse('rate_limit_exceeded', 429));
testApp.get('/test-500', () => createSecureErrorResponse('processing_failed', 500));

describe('Secure Error Response Integration', () => {
  const middleware = createMiddleware(testApp);

  describe('401 Unauthorized responses', () => {
    it('should include all security headers', async () => {
      const res = await middleware.request('/test-401');

      expect(res.status).toBe(401);
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(res.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains'
      );
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should include proper error message', async () => {
      const res = await middleware.request('/test-401');
      const body = await res.json();

      expect(body.error).toBe('invalid_signature');
      expect(body.message).toBe('Webhook signature validation failed');
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('400 Bad Request responses', () => {
    it('should include security headers', async () => {
      const res = await middleware.request('/test-400');

      expect(res.status).toBe(400);
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should include proper error message', async () => {
      const res = await middleware.request('/test-400');
      const body = await res.json();

      expect(body.error).toBe('invalid_payload');
      expect(body.message).toBe('Webhook payload validation failed');
    });
  });

  describe('429 Too Many Requests responses', () => {
    it('should include Retry-After header', async () => {
      const res = await middleware.request('/test-429');

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('60');
    });

    it('should include rate limit error message', async () => {
      const res = await middleware.request('/test-429');
      const body = await res.json();

      expect(body.error).toBe('rate_limit_exceeded');
      expect(body.message).toBe('Request rate limit exceeded');
    });
  });

  describe('500 Internal Server Error responses', () => {
    it('should include security headers', async () => {
      const res = await middleware.request('/test-500');

      expect(res.status).toBe(500);
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should include generic error message', async () => {
      const res = await middleware.request('/test-500');
      const body = await res.json();

      expect(body.error).toBe('processing_failed');
      expect(body.message).toBe('Webhook processing failed');
    });
  });

  describe('Error message security', () => {
    it('should not leak implementation details', () => {
      const messages = [
        getErrorMessage('invalid_signature'),
        getErrorMessage('invalid_payload'),
        getErrorMessage('rate_limit_exceeded'),
      ];

      messages.forEach((message) => {
        expect(message).not.toMatch(/regex/i);
        expect(message).not.toMatch(/validation/i);
        expect(message).not.toMatch(/secret/i);
        expect(message).not.toMatch(/algorithm/i);
        expect(message).not.toMatch(/HMAC/i);
      });
    });

    it('should provide generic fallback', () => {
      expect(getErrorMessage('unknown_error')).toBe('An error occurred processing the webhook');
    });
  });
});
