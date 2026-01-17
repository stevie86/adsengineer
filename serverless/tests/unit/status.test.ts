import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { status } from '../../src/routes/status';

describe('Status Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/v1/status', status);
    vi.clearAllMocks();
  });

  describe('GET /api/v1/status', () => {
    it('should return system health status', async () => {
      vi.mock('../../src/services/api-monitor', () => ({
        getSystemHealth: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: '2026-01-12T15:30:00Z',
          uptime: 86400,
          version: '1.0.0',
          services: {
            database: { status: 'healthy', responseTime: 45 },
            googleAds: { status: 'healthy', responseTime: 120 },
            stripe: { status: 'healthy', responseTime: 85 }
          }
        })
      }));

      const response = await app.request('/api/v1/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('status', 'healthy');
      expect(data.data).toHaveProperty('timestamp');
      expect(data.data).toHaveProperty('uptime');
      expect(data.data).toHaveProperty('services');
      expect(data.data.services.database).toHaveProperty('status', 'healthy');
    });

    it('should include performance metrics', async () => {
      vi.mock('../../src/services/api-monitor', () => ({
        getSystemHealth: vi.fn().mockResolvedValue({
          status: 'healthy',
          metrics: {
            requestsPerMinute: 150,
            averageResponseTime: 125,
            errorRate: 0.01,
            memoryUsage: { used: 512, total: 1024 },
            cpuUsage: 45
          }
        })
      }));

      const response = await app.request('/api/v1/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveProperty('metrics');
      expect(data.data.metrics).toHaveProperty('requestsPerMinute');
      expect(data.data.metrics).toHaveProperty('averageResponseTime');
      expect(data.data.metrics).toHaveProperty('errorRate');
    });
  });

  describe('GET /api/v1/status/health', () => {
    it('should return simple health check for load balancers', async () => {
      const response = await app.request('/api/v1/status/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/status/version', () => {
    it('should return application version information', async () => {
      const response = await app.request('/api/v1/status/version', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('version');
      expect(data.data).toHaveProperty('buildNumber');
      expect(data.data).toHaveProperty('deployedAt');
    });
  });

  describe('GET /api/v1/status/metrics', () => {
    it('should require admin authentication', async () => {
      const response = await app.request('/api/v1/status/metrics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });

    it('should return detailed metrics for authenticated admin', async () => {
      const mockAdminToken = 'admin.jwt.token';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'admin-123', role: 'admin' });
          await next();
        }
      }));

      vi.mock('../../src/services/api-monitor', () => ({
        getDetailedMetrics: vi.fn().mockResolvedValue({
          requests: {
            total: 1000000,
            last24h: 15000,
            perMinute: 150
          },
          errors: {
            total: 1000,
            last24h: 15,
            rate: 0.001
          },
          performance: {
            averageResponseTime: 125,
            p95ResponseTime: 250,
            p99ResponseTime: 500
          },
          resources: {
            memory: { used: 512, total: 1024, percentage: 50 },
            cpu: { average: 45, peak: 80 },
            storage: { used: 1024, total: 10240, percentage: 10 }
          }
        })
      }));

      const response = await app.request('/api/v1/status/metrics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mockAdminToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('requests');
      expect(data.data).toHaveProperty('errors');
      expect(data.data).toHaveProperty('performance');
      expect(data.data).toHaveProperty('resources');
    });
  });
});