import { describe, it, expect, beforeEach } from 'vitest';
import { webhookIpRateLimit, webhookShopRateLimit } from '../../src/middleware/rate-limit';

// Mock KV namespace
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
};

// Mock context
const createMockContext = (headers: Record<string, string> = {}) => ({
  req: {
    header: vi.fn((name: string) => headers[name] || headers[name.toLowerCase()]),
  },
  env: {
    RATE_LIMIT_KV: mockKV,
    WEBHOOK_IP_WINDOW_MS: '60000', // 1 minute for testing
    WEBHOOK_IP_MAX_REQUESTS: '2', // 2 requests per minute
    WEBHOOK_SHOP_WINDOW_MS: '60000',
    WEBHOOK_SHOP_MAX_REQUESTS: '3',
  },
  header: vi.fn(),
  json: vi.fn(),
});

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKV.get.mockResolvedValue(null);
    mockKV.put.mockResolvedValue(undefined);
  });

  describe('IP-based rate limiting', () => {
    it('should allow requests under the limit', async () => {
      const mockContext = createMockContext({
        'CF-Connecting-IP': '192.168.1.1',
      });
      const mockNext = vi.fn();

      // First request should pass
      await webhookIpRateLimit(mockContext as any, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.json).not.toHaveBeenCalled();
    });

    it('should block requests exceeding the limit', async () => {
      const mockContext = createMockContext({
        'CF-Connecting-IP': '192.168.1.2',
      });
      const mockNext = vi.fn();

      // Simulate 2 existing requests (at limit)
      const now = Date.now();
      mockKV.get.mockResolvedValue(JSON.stringify([now - 1000, now - 2000]));

      await webhookIpRateLimit(mockContext as any, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      // Rate limiting now returns a Response directly, so json should not be called
    });

    it('should include rate limit headers', async () => {
      const mockContext = createMockContext({
        'CF-Connecting-IP': '192.168.1.3',
      });
      const mockNext = vi.fn();

      await webhookIpRateLimit(mockContext as any, mockNext);

      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Limit', '2');
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');
    });
  });

  describe('Shop domain rate limiting', () => {
    it('should allow requests under shop limit', async () => {
      const mockContext = createMockContext({
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
      });
      const mockNext = vi.fn();

      await webhookShopRateLimit(mockContext as any, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.json).not.toHaveBeenCalled();
    });
  });
});
