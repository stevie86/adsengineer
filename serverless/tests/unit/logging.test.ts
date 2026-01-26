import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Logger,
  logger,
  logPayloadError,
  logWebhookFailure,
  logWebhookSuccess,
} from '../../src/services/logging';

// Mock console methods
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

describe('Logging Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Logger singleton', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Security event logging', () => {
    it('should log webhook signature failures with proper severity', () => {
      const mockContext = {
        req: {
          header: vi.fn((name: string) => {
            if (name === 'CF-Connecting-IP') return '192.168.1.1';
            if (name === 'X-Request-ID') return 'req_123';
            if (name === 'X-Shopify-Shop-Domain') return 'test-shop.myshopify.com';
            return undefined;
          }),
          raw: {
            headers: new Headers({
              'CF-Connecting-IP': '192.168.1.1',
              'X-Request-ID': 'req_123',
              'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
            }),
          },
        },
      };

      logger.logWebhookSignatureFailure(
        mockContext as any,
        'test-shop.myshopify.com',
        'Invalid signature'
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SECURITY-HIGH] webhook_signature_failure: Webhook signature validation failed for shop: test-shop.myshopify.com',
        expect.objectContaining({
          error: 'Invalid signature',
          shopDomain: 'test-shop.myshopify.com',
          ipAddress: '192.168.1.1',
        })
      );
    });

    it('should log payload validation errors', () => {
      const mockContext = {
        req: {
          header: vi.fn((name: string) => {
            const headers: Record<string, string> = {
              'CF-Connecting-IP': '192.168.1.2',
              'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
            };
            return headers[name];
          }),
        },
      };

      logger.logWebhookPayloadError(
        mockContext as any,
        'test-shop.myshopify.com',
        'customers/create',
        'Missing required field: id'
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SECURITY-MEDIUM] payload_validation_error: Webhook payload validation failed: Missing required field: id',
        expect.objectContaining({
          error: 'Missing required field: id',
          shopDomain: 'test-shop.myshopify.com',
          ipAddress: '192.168.1.2',
        })
      );
    });

    it('should log rate limit violations', () => {
      const mockContext = {
        req: {
          header: vi.fn((name: string) => '192.168.1.3'),
          raw: {
            headers: new Headers(),
          },
        },
      };

      logger.logRateLimitExceeded(mockContext as any, 'webhook:ip:192.168.1.3', 100, 3600000);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SECURITY-MEDIUM] rate_limit_exceeded: Rate limit exceeded for key: webhook:ip:192.168.1.3',
        expect.objectContaining({
          ipAddress: '192.168.1.3',
        })
      );
    });
  });

  describe('Data redaction', () => {
    it('should redact sensitive headers', () => {
      const logger = Logger.getInstance();
      const headers = {
        Authorization: 'Bearer secret-token',
        'X-Shopify-Hmac-Sha256': 'secret-hmac',
        'Content-Type': 'application/json',
        'User-Agent': 'Shopify/1.0',
      };

      // Access private method for testing
      const redacted = (logger as any).redactSensitiveHeaders(headers);

      expect(redacted['Authorization']).toBe('[REDACTED]');
      expect(redacted['X-Shopify-Hmac-Sha256']).toBe('[REDACTED]');
      expect(redacted['Content-Type']).toBe('application/json');
      expect(redacted['User-Agent']).toBe('Shopify/1.0');
    });

    it('should redact usernames and emails', () => {
      const logger = Logger.getInstance();

      // Access private method for testing
      expect((logger as any).redactUsername('john.doe@example.com')).toBe('jo***@***.***');
      expect((logger as any).redactUsername('admin')).toBe('ad***');
      expect((logger as any).redactUsername('a')).toBe('***');
      expect((logger as any).redactUsername(undefined)).toBe('unknown');
    });
  });

  describe('Log level filtering', () => {
    beforeEach(() => {
      // Set log level to WARN
      process.env.LOG_LEVEL = 'WARN';
    });

    afterEach(() => {
      delete process.env.LOG_LEVEL;
    });

    it('should not log DEBUG messages when level is WARN', () => {
      const mockContext = {
        req: {
          header: vi.fn(() => undefined),
          raw: { headers: new Headers() },
        },
      };
      logger.log('DEBUG', 'Debug message', {}, mockContext as any);
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should log WARN messages when level is WARN', () => {
      const mockContext = {
        req: {
          header: vi.fn(() => undefined),
          raw: { headers: new Headers() },
        },
      };
      logger.log('WARN', 'Warning message', {}, mockContext as any);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('Convenience functions', () => {
    it('should provide convenience logging functions', () => {
      const mockContext = {
        req: {
          header: vi.fn((name: string) => {
            const headers: Record<string, string> = {
              'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
              'CF-Connecting-IP': '192.168.1.1',
            };
            return headers[name];
          }),
          raw: {
            headers: new Headers({
              'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
              'CF-Connecting-IP': '192.168.1.1',
            }),
          },
        },
      };

      // Test success logging
      logWebhookSuccess(mockContext as any, 'customers/create', 'test-shop.myshopify.com');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security validation passed'),
        expect.any(Object)
      );

      // Test failure logging
      logWebhookFailure(mockContext as any, 'test-shop.myshopify.com', 'Invalid signature');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('webhook_signature_failure'),
        expect.any(Object)
      );

      // Test payload error logging
      logPayloadError(
        mockContext as any,
        'test-shop.myshopify.com',
        'orders/create',
        'Invalid data'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('payload_validation_error'),
        expect.any(Object)
      );
    });
  });
});
