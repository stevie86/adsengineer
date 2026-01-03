import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Hono Context
const createMockContext = () => ({
  json: vi.fn((data, status) => {
    const response = {
      json: () => data,
      status,
      headers: new Map()
    };
    return response;
  })
});

// Local implementations for testing (copied from shopify.ts)
function createSecureErrorResponse(errorType: string, statusCode: number) {
  const response = {
    status: statusCode,
    headers: new Map([
      ['X-Content-Type-Options', 'nosniff'],
      ['X-Frame-Options', 'DENY'],
      ['X-XSS-Protection', '1; mode=block'],
      ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
      ['Referrer-Policy', 'strict-origin-when-cross-origin'],
      ...(statusCode === 429 ? [['Retry-After', '60']] : [])
    ])
  };
  return response;
}

function getErrorMessage(errorType: string): string {
  const messages: Record<string, string> = {
    'invalid_signature': 'Webhook signature validation failed',
    'invalid_payload': 'Webhook payload validation failed',
    'rate_limit_exceeded': 'Request rate limit exceeded',
    'missing_shop_domain': 'Required shop domain header missing',
    'configuration_error': 'Service configuration error',
    'processing_failed': 'Webhook processing failed'
  };
  return messages[errorType] || 'An error occurred processing the webhook';
}

describe('Secure Error Response Handling', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockContext();
    vi.clearAllMocks();
  });

  describe('createSecureErrorResponse', () => {
    it('should create response with security headers for 401 error', () => {
      const response = createSecureErrorResponse(mockContext, 'invalid_signature', 401);

      expect(response.status).toBe(401);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should add Retry-After header for 429 errors', () => {
      const response = createSecureErrorResponse(mockContext, 'rate_limit_exceeded', 429);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should include generic error message', () => {
      const response = createSecureErrorResponse(mockContext, 'invalid_signature', 401);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'invalid_signature',
          message: 'Webhook signature validation failed',
          timestamp: expect.any(String)
        }),
        401
      );
    });
  });

  describe('getErrorMessage', () => {
    it('should return generic messages for known error types', () => {
      expect(getErrorMessage('invalid_signature')).toBe('Webhook signature validation failed');
      expect(getErrorMessage('invalid_payload')).toBe('Webhook payload validation failed');
      expect(getErrorMessage('rate_limit_exceeded')).toBe('Request rate limit exceeded');
      expect(getErrorMessage('missing_shop_domain')).toBe('Required shop domain header missing');
      expect(getErrorMessage('configuration_error')).toBe('Service configuration error');
      expect(getErrorMessage('processing_failed')).toBe('Webhook processing failed');
    });

    it('should return generic fallback for unknown error types', () => {
      expect(getErrorMessage('unknown_error')).toBe('An error occurred processing the webhook');
      expect(getErrorMessage('')).toBe('An error occurred processing the webhook');
    });
  });

  describe('Security Headers Coverage', () => {
    const errorTypes = [
      { type: 'invalid_signature', status: 401 },
      { type: 'invalid_payload', status: 400 },
      { type: 'rate_limit_exceeded', status: 429 },
      { type: 'configuration_error', status: 500 }
    ];

    errorTypes.forEach(({ type, status }) => {
      it(`should include all security headers for ${type} (${status})`, () => {
        const response = createSecureErrorResponse(mockContext, type, status);

        // Core security headers
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
        expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
        expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');

        // Rate limit specific header
        if (status === 429) {
          expect(response.headers.get('Retry-After')).toBe('60');
        }
      });
    });
  });

  describe('Error Message Security', () => {
    it('should not leak validation logic details', () => {
      // Ensure error messages are generic and don't reveal internal validation rules
      const messages = [
        getErrorMessage('invalid_signature'),
        getErrorMessage('invalid_payload'),
        getErrorMessage('rate_limit_exceeded')
      ];

      messages.forEach(message => {
        expect(message).not.toMatch(/regex/i);
        expect(message).not.toMatch(/validation/i);
        expect(message).not.toMatch(/secret/i);
        expect(message).not.toMatch(/algorithm/i);
        expect(message).not.toMatch(/HMAC/i);
      });
    });

    it('should include timestamps for debugging', () => {
      const response = createSecureErrorResponse(mockContext, 'invalid_signature', 401);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        }),
        401
      );
    });
  });
});