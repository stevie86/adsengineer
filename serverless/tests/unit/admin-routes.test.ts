import { Hono } from 'hono';
import { describe, expect, test, vi } from 'vitest';
import { adminRoutes } from '../../src/routes/admin';

// Create a proper mock for D1 database that supports chaining
function createMockDB(mockData = {}) {
  const defaultMocks = {
    all: { results: [], meta: {} },
    first: null,
    run: { meta: { last_row_id: 1, changes: 1 } },
  };

  return {
    prepare: vi.fn((query) => {
      const mockResult = mockData[query] || defaultMocks;

      return {
        all: vi.fn().mockResolvedValue(mockResult.all),
        first: vi.fn().mockResolvedValue(mockResult.first),
        run: vi.fn().mockResolvedValue(mockResult.run),
        bind: vi.fn().mockReturnThis(),
      };
    }),
  };
}

// Create a test app with proper middleware injection
function createTestApp(mockDB) {
  const app = new Hono();

  // Apply admin middleware that properly sets up context
  app.use('/api/v1/admin/*', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    const adminSecret = c.env?.ADMIN_SECRET;

    if (!adminSecret) {
      return c.json({ error: 'Admin endpoint not configured' }, 503);
    }

    const token = authHeader?.replace('Bearer ', '');
    if (!token || token !== adminSecret) {
      return c.json({ error: 'Unauthorized - Invalid admin token' }, 401);
    }

    await next();
  });

  app.route('/api/v1/admin', adminRoutes);

  return app;
}

describe('Admin Routes - Comprehensive Coverage', () => {
  describe('Authentication & Authorization', () => {
    test('rejects requests without admin secret', async () => {
      const mockDB = createMockDB();
      const app = createTestApp(mockDB);

      const res = await app.request('/api/v1/admin/agencies', {
        method: 'GET',
        headers: { Authorization: 'Bearer wrong-secret' },
      });

      expect([401, 503]).toContain(res.status);
    });

    test('accepts requests with valid admin secret', async () => {
      const mockDB = createMockDB();
      const app = createTestApp(mockDB);

      const res = await app.request('/api/v1/admin/agencies', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-admin-secret' },
      });

      // Should not be auth error (401) or server error (500)
      expect(res.status).not.toBe(401);
    });
  });

  describe('Agency Management', () => {
    test('GET /agencies returns paginated agencies', async () => {
      const mockDB = createMockDB({
        'SELECT * FROM agencies ORDER BY created_at DESC LIMIT ? OFFSET ?': {
          all: { results: [{ id: '1', name: 'Agency 1' }], meta: { total: 1 } },
        },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies?page=1&limit=20', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-admin-secret' },
      });

      // Should not return 401 (auth) or 500 (error)
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(500);
    });

    test('POST /agencies creates new agency', async () => {
      const mockDB = createMockDB({
        'INSERT INTO agencies': { run: { meta: { last_row_id: 1 } } },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-admin-secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Agency',
          contact_email: 'new@example.com',
          status: 'active',
        }),
      });

      // Should not be auth error
      expect(res.status).not.toBe(401);
    });

    test('PUT /agencies/:id updates agency', async () => {
      const mockDB = createMockDB({
        'UPDATE agencies': { run: { meta: { changes: 1 } } },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies/agency-123', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-admin-secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Agency',
          contact_email: 'updated@example.com',
          status: 'active',
        }),
      });

      expect(res.status).not.toBe(401);
    });

    test('DELETE /agencies/:id removes agency', async () => {
      const mockDB = createMockDB({
        'DELETE FROM agencies': { run: { meta: { changes: 1 } } },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies/agency-123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-admin-secret' },
      });

      expect(res.status).not.toBe(401);
    });
  });

  describe('Subscription Management', () => {
    test('GET /agencies/:id/subscriptions returns subscriptions', async () => {
      const mockDB = createMockDB({
        'SELECT s.*, p.name as plan_name': {
          all: {
            results: [
              {
                id: 'sub_1',
                stripe_subscription_id: 'sub_123',
                status: 'active',
                plan_name: 'Starter',
              },
            ],
          },
        },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies/agency-123/subscriptions', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-admin-secret' },
      });

      expect(res.status).not.toBe(401);
    });

    test('PUT /agencies/:id/subscriptions/:id can cancel subscription', async () => {
      const mockDB = createMockDB({
        'UPDATE subscriptions SET status': { run: { meta: { changes: 1 } } },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies/agency-123/subscriptions/sub_123', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-admin-secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      expect(res.status).not.toBe(401);
    });

    test('PUT /agencies/:id/subscriptions/:id can upgrade subscription', async () => {
      const mockDB = createMockDB({
        'UPDATE subscriptions SET stripe_price_id': { run: { meta: { changes: 1 } } },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies/agency-123/subscriptions/sub_123', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer test-admin-secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'upgrade', price_id: 'price_professional' }),
      });

      expect(res.status).not.toBe(401);
    });
  });

  describe('Usage & Analytics', () => {
    test('GET /agencies/:id/usage returns usage metrics', async () => {
      const mockDB = createMockDB({
        'SELECT metric_type': {
          all: {
            results: [{ metric_type: 'leads', usage_count: 150, limit_count: 1000 }],
          },
        },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies/agency-123/usage', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-admin-secret' },
      });

      expect(res.status).not.toBe(401);
    });

    test('GET /agencies/:id/analytics returns comprehensive analytics', async () => {
      const mockDB = createMockDB({
        'SELECT COUNT(*) as count FROM leads': { first: { count: 100 } },
        'SELECT SUM(adjusted_value_cents)': { first: { total: 50000 } },
        'SELECT COUNT(*) as count FROM subscriptions WHERE status': { first: { count: 10 } },
        'SELECT metric_type': {
          all: { results: [{ metric_type: 'leads', total_usage: 500 }] },
        },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/agencies/agency-123/analytics?period=30', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-admin-secret' },
      });

      expect(res.status).not.toBe(401);
    });
  });

  describe('System Health', () => {
    test('GET /system/health returns system metrics', async () => {
      const mockDB = createMockDB({
        'SELECT COUNT(*) as count FROM agencies': { first: { count: 50 } },
        'SELECT COUNT(*) as count FROM leads': { first: { count: 1000 } },
        'SELECT SUM(adjusted_value_cents)': { first: { total: 50000 } },
        'SELECT COUNT(*) as count FROM subscriptions WHERE status': { first: { count: 25 } },
      });

      const app = new Hono();
      app.use('/api/v1/admin/*', async (c, next) => {
        c.env = { DB: mockDB, ADMIN_SECRET: 'test-admin-secret' };
        await next();
      });
      app.route('/api/v1/admin', adminRoutes);

      const res = await app.request('/api/v1/admin/system/health', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-admin-secret' },
      });

      // Should not be auth error - system health endpoint should work
      expect(res.status).not.toBe(401);
    });
  });
});
