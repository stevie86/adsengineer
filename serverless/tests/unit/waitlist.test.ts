import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { waitlist } from '../../src/routes/waitlist';

describe('Waitlist Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/v1/waitlist', waitlist);
    vi.clearAllMocks();
  });

  describe('POST /api/v1/waitlist', () => {
    it('should add email to waitlist with valid data', async () => {
      const waitlistData = {
        email: 'user@example.com',
        name: 'John Doe',
        company: 'Test Company',
        phone: '+1234567890',
        useCase: 'e-commerce attribution',
        source: 'landing-page'
      };

      vi.mock('../../src/services/waitlist', () => ({
        addToWaitlist: vi.fn().mockResolvedValue({
          id: 'waitlist-123',
          ...waitlistData,
          status: 'pending',
          addedAt: '2026-01-12T15:30:00Z'
        })
      }));

      vi.mock('../../src/services/email', () => ({
        sendWaitlistConfirmation: vi.fn().mockResolvedValue(true)
      }));

      const response = await app.request('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waitlistData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id', 'waitlist-123');
      expect(data.data.email).toBe('user@example.com');
      expect(data.data.status).toBe('pending');
    });

    it('should validate email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'John Doe'
      };

      const response = await app.request('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid email format');
    });

    it('should require email field', async () => {
      const invalidData = {
        name: 'John Doe'
      };

      const response = await app.request('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('email is required');
    });

    it('should check for existing email', async () => {
      const waitlistData = {
        email: 'existing@example.com',
        name: 'John Doe'
      };

      vi.mock('../../src/services/waitlist', () => ({
        addToWaitlist: vi.fn().mockRejectedValue(new Error('Email already exists'))
      }));

      const response = await app.request('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waitlistData)
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('already exists');
    });

    it('should sanitize input data', async () => {
      const waitlistData = {
        email: 'user@example.com',
        name: '<script>alert("xss")</script>',
        company: 'Test Company'
      };

      vi.mock('../../src/services/waitlist', () => ({
        addToWaitlist: vi.fn().mockResolvedValue({
          id: 'waitlist-123',
          email: 'user@example.com',
          name: 'alert("xss")',
          company: 'Test Company',
          status: 'pending'
        })
      }));

      const response = await app.request('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waitlistData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.data.name).not.toContain('<script>');
      expect(data.data.name).not.toContain('</script>');
    });
  });

  describe('GET /api/v1/waitlist/status/:email', () => {
    it('should return waitlist status for email', async () => {
      const email = 'user@example.com';

      vi.mock('../../src/services/waitlist', () => ({
        getWaitlistStatus: vi.fn().mockResolvedValue({
          id: 'waitlist-123',
          email: email,
          status: 'pending',
          position: 45,
          estimatedAccess: '2026-02-15',
          addedAt: '2026-01-12T15:30:00Z'
        })
      }));

      const response = await app.request(`/api/v1/waitlist/status/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('status', 'pending');
      expect(data.data).toHaveProperty('position', 45);
      expect(data.data).toHaveProperty('estimatedAccess', '2026-02-15');
    });

    it('should handle non-existent email', async () => {
      const email = 'nonexistent@example.com';

      vi.mock('../../src/services/waitlist', () => ({
        getWaitlistStatus: vi.fn().mockResolvedValue(null)
      }));

      const response = await app.request(`/api/v1/waitlist/status/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('not found');
    });

    it('should validate email format in status endpoint', async () => {
      const invalidEmail = 'invalid-email';

      const response = await app.request(`/api/v1/waitlist/status/${invalidEmail}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid email format');
    });
  });

  describe('DELETE /api/v1/waitlist/:email', () => {
    it('should remove email from waitlist', async () => {
      const email = 'user@example.com';
      const mockToken = 'valid.jwt.token';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        }
      }));

      vi.mock('../../src/services/waitlist', () => ({
        removeFromWaitlist: vi.fn().mockResolvedValue({
          id: 'waitlist-123',
          email: email,
          removedAt: '2026-01-12T15:30:00Z'
        })
      }));

      const response = await app.request(`/api/v1/waitlist/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
    });

    it('should require authentication for deletion', async () => {
      const email = 'user@example.com';

      const response = await app.request(`/api/v1/waitlist/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });

    it('should verify email ownership for deletion', async () => {
      const email = 'user@example.com';
      const mockToken = 'valid.jwt.token';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'different-user-456', role: 'user' });
          await next();
        }
      }));

      vi.mock('../../src/services/waitlist', () => ({
        removeFromWaitlist: vi.fn().mockRejectedValue(new Error('Email does not belong to user'))
      }));

      const response = await app.request(`/api/v1/waitlist/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('does not belong to user');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limits to waitlist endpoint', async () => {
      const requests = Array.from({ length: 11 }, (_, i) =>
        app.request('/api/v1/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `user${i}@example.com`,
            name: `User ${i}`
          })
        })
      );

      vi.mock('../../src/services/rate-limit', () => ({
        checkRateLimit: vi.fn().mockImplementation(function() {
          const attempts = this.mock.calls.length;
          return Promise.resolve({
            allowed: attempts <= 10,
            limit: 10,
            resetTime: '2026-01-12T16:00:00Z'
          });
        })
      }));

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});