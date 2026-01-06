import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../../src/types';
import { leadsRoutes } from '../../src/routes/leads';

describe('End-to-End Secondary Conversion Routing', () => {
  let app: Hono<AppEnv>;
  let mockDb: any;

  beforeEach(() => {
    app = new Hono<AppEnv>();

    mockDb = {
      insertLead: vi.fn(),
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(() => ({
            id: 'mycannaby-mk059g16',
            name: 'mycannaby',
            google_ads_config: JSON.stringify({
              clientId: 'test-client-id',
              clientSecret: 'test-client-secret',
              developerToken: 'test-developer-token',
              customerId: '123-456-7890',
              conversionActionId: '123456789'
            }),
            secondary_google_ads_config: JSON.stringify({
              customerId: '987-654-3210',
              conversionActionId: '987654321'
            })
          }))
        }))
      }))
    };

    app.use('*', async (c, next) => {
      c.set('db', mockDb);
      // Mock auth context for testing
      c.set('auth', {
        user_id: 'test-user',
        org_id: 'mycannaby-mk059g16',
        tenant_id: 'mycannaby-mk059g16',
        role: 'admin' as const
      });
      // Mock environment
      c.env = {
        DB: mockDb,
        JWT_SECRET: 'test-secret'
      } as any;
      await next();
    });

    app.route('/leads', leadsRoutes);
  });

  it('should route conversions to both Google Ads accounts in parallel mode', async () => {
    mockDb.insertLead.mockResolvedValue({
      id: 'lead-123',
      site_id: 'mycannaby-687f1af9',
      gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
      email: 'test@mycannaby.de',
      created_at: '2026-01-01T12:00:00Z'
    });

    const testLead = {
      site_id: 'mycannaby-687f1af9',
      gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
      email: 'test@mycannaby.de',
      landing_page: 'https://mycannaby.de/product/1',
      adjusted_value_cents: 4500,
      consent_status: 'granted',
      consent_timestamp: '2026-01-01T12:00:00Z'
    };

    const res = await app.request('/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-jwt-token'
      },
      body: JSON.stringify([testLead])
    });

    expect(res.status).toBe(200);

    const response = await res.json();
    expect(response.success).toBe(true);
    expect(response.leads_processed).toBe(1);
    expect(response.conversion_results).toBeDefined();
    expect(response.conversion_results.mode).toBe('parallel');
    expect(response.conversion_results.primary).toBeDefined();
    expect(response.conversion_results.secondary).toBeDefined();
  });

  it('should handle single account routing when secondary config is missing', async () => {
    mockDb.prepare.mockReturnValue({
      bind: vi.fn(() => ({
        first: vi.fn(() => ({
          id: 'mycannaby-mk059g16',
          name: 'mycannaby',
          google_ads_config: JSON.stringify({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            developerToken: 'test-developer-token',
            customerId: '123-456-7890',
            conversionActionId: '123456789'
          }),
          secondary_google_ads_config: null
        }))
      }))
    });

    mockDb.insertLead.mockResolvedValue({
      id: 'lead-456',
      site_id: 'mycannaby-687f1af9',
      gclid: 'EAIaIQv3i3m8e7vOZ-1572532744',
      email: 'test2@mycannaby.de',
      created_at: '2026-01-01T12:05:00Z'
    });

    const testLead = {
      site_id: 'mycannaby-687f1af9',
      gclid: 'EAIaIQv3i3m8e7vOZ-1572532744',
      email: 'test2@mycannaby.de',
      landing_page: 'https://mycannaby.de/product/2',
      adjusted_value_cents: 3500,
      consent_status: 'granted',
      consent_timestamp: '2026-01-01T12:05:00Z'
    };

    const res = await app.request('/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-jwt-token'
      },
      body: JSON.stringify([testLead])
    });

    expect(res.status).toBe(200);

    const response = await res.json();
    expect(response.success).toBe(true);
    expect(response.conversion_results.mode).toBe('single');
    expect(response.conversion_results.primary).toBeDefined();
    expect(response.conversion_results.secondary).toBeNull();
  });

  it('should filter out non-consented leads from conversion processing', async () => {
    mockDb.insertLead.mockResolvedValue({
      id: 'lead-789',
      site_id: 'mycannaby-687f1af9',
      gclid: 'EAIaIQv3i3m8e7vOZ-1572532745',
      email: 'test3@mycannaby.de',
      created_at: '2026-01-01T12:10:00Z'
    });

    const testLead = {
      site_id: 'mycannaby-687f1af9',
      gclid: 'EAIaIQv3i3m8e7vOZ-1572532745',
      email: 'test3@mycannaby.de',
      landing_page: 'https://mycannaby.de/product/3',
      adjusted_value_cents: 4500,
      consent_status: 'denied',
      consent_timestamp: '2026-01-01T12:10:00Z'
    };

    const res = await app.request('/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-jwt-token'
      },
      body: JSON.stringify([testLead])
    });

    expect(res.status).toBe(200);

    const response = await res.json();
    expect(response.success).toBe(true);
    expect(response.consent_summary.consented_leads).toBe(0);
    expect(response.consent_summary.denied_leads).toBe(1);
  });

  it('should handle mixed consented/denied leads correctly', async () => {
    mockDb.insertLead
      .mockResolvedValueOnce({
        id: 'lead-consented',
        site_id: 'mycannaby-687f1af9',
        gclid: 'EAIaIQv3i3m8e7vOZ-1572532746',
        email: 'consented@mycannaby.de',
        created_at: '2026-01-01T12:15:00Z'
      })
      .mockResolvedValueOnce({
        id: 'lead-denied',
        site_id: 'mycannaby-687f1af9',
        email: 'denied@mycannaby.de',
        created_at: '2026-01-01T12:20:00Z'
      });

    const testLeads = [
      {
        site_id: 'mycannaby-687f1af9',
        gclid: 'EAIaIQv3i3m8e7vOZ-1572532746',
        email: 'consented@mycannaby.de',
        landing_page: 'https://mycannaby.de/product/4',
        adjusted_value_cents: 4500,
        consent_status: 'granted'
      },
      {
        site_id: 'mycannaby-687f1af9',
        email: 'denied@mycannaby.de',
        landing_page: 'https://mycannaby.de/product/5',
        adjusted_value_cents: 4500,
        consent_status: 'denied'
      }
    ];

    const res = await app.request('/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testLeads)
    });

    expect(res.status).toBe(200);

    const response = await res.json();
    expect(response.success).toBe(true);
    expect(response.leads_processed).toBe(2);
    expect(response.consent_summary.consented_leads).toBe(1);
    expect(response.consent_summary.denied_leads).toBe(1);
    expect(response.conversion_results).toBeDefined();
  });
});