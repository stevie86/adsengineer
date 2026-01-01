import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { leadRoutes } from '../src/routes/leads';
import { db } from '../src/database';
import type { AppEnv } from '../src/types';

vi.mock('../src/database');

describe('Lead Management API', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono<AppEnv>();
    
    app.use('*', async (c, next) => {
      c.set('db', db);
      c.set('auth', { siteId: 'test-site-001' });
      await next();
    });
    
    app.route('/api/v1/leads', leadRoutes);
  });

  describe('POST /api/v1/leads', () => {
    it('should create a new lead with valid data', async () => {
      const mockLead = {
        email: 'john@example.com',
        phone: '+1234567890',
        gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
        value_cents: 15000,
        vertical: 'dental',
      };

      vi.mocked(db.prepare).mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
      } as any);

      const response = await app.request('/api/v1/leads', {
        method: 'POST',
        body: JSON.stringify(mockLead),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('leadId');
    });

    it('should reject invalid email format', async () => {
      const invalidLead = {
        email: 'invalid-email',
        phone: '+1234567890',
        value_cents: 15000,
      };

      const response = await app.request('/api/v1/leads', {
        method: 'POST',
        body: JSON.stringify(invalidLead),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const appNoAuth = new Hono();
      appNoAuth.route('/api/v1/leads', leadRoutes);

      const response = await appNoAuth.request('/api/v1/leads', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/leads', () => {
    it('should return paginated list of leads', async () => {
      const mockLeads = [
        { id: 1, email: 'john@example.com', value_cents: 15000 },
        { id: 2, email: 'jane@example.com', value_cents: 25000 },
      ];

      vi.mocked(db.prepare).mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockLeads }),
      } as any);

      const response = await app.request('/api/v1/leads');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('leads');
      expect(data.leads).toHaveLength(2);
    });

    it('should support filtering by date range', async () => {
      vi.mocked(db.prepare).mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
      } as any);

      const response = await app.request(
        '/api/v1/leads?start_date=2024-01-01&end_date=2024-12-31'
      );

      expect(response.status).toBe(200);
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('created_at BETWEEN')
      );
    });
  });
});