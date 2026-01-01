import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { ghlRoutes } from '../src/routes/ghl';
import { db } from '../src/database';
import crypto from 'crypto';

vi.mock('../src/database');

describe('GHL Webhook API', () => {
  let app: Hono;
  const testSecret = 'test-webhook-secret';

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    
    app.use('*', async (c, next) => {
      c.set('ghlWebhookSecret', testSecret);
      c.set('db', db);
      await next();
    });
    
    app.route('/api/v1/ghl', ghlRoutes);
  });

  const createValidPayload = () => ({
    contact: {
      id: 'contact_123',
      email: 'john@example.com',
      phone: '+1234567890',
      customField: {
        gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
        source: 'google_ads',
      },
    },
    locationId: 'loc_456',
  });

  const createSignature = (payload: string, secret: string): string => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  };

  describe('POST /api/v1/ghl/webhook', () => {
    it('should process valid webhook with correct signature', async () => {
      const payload = JSON.stringify(createValidPayload());
      const signature = createSignature(payload, testSecret);

      vi.mocked(db.prepare).mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      } as any);

      const response = await app.request('/api/v1/ghl/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-GHL-Signature': `sha256=${signature}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = JSON.stringify(createValidPayload());
      const invalidSignature = 'invalid-signature';

      const response = await app.request('/api/v1/ghl/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-GHL-Signature': `sha256=${invalidSignature}`,
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should reject webhook without signature header', async () => {
      const payload = JSON.stringify(createValidPayload());

      const response = await app.request('/api/v1/ghl/webhook', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    it('should handle malformed JSON payload', async () => {
      const invalidPayload = '{ invalid json }';
      const signature = createSignature(invalidPayload, testSecret);

      const response = await app.request('/api/v1/ghl/webhook', {
        method: 'POST',
        body: invalidPayload,
        headers: {
          'Content-Type': 'application/json',
          'X-GHL-Signature': `sha256=${signature}`,
        },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should extract GCLID from contact custom fields', async () => {
      const payload = createValidPayload();
      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, testSecret);

      const mockInsert = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(db.prepare).mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: mockInsert,
      } as any);

      await app.request('/api/v1/ghl/webhook', {
        method: 'POST',
        body: payloadString,
        headers: {
          'Content-Type': 'application/json',
          'X-GHL-Signature': `sha256=${signature}`,
        },
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
          email: 'john@example.com',
          source: 'ghl_webhook',
        })
      );
    });
  });
});