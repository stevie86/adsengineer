import { describe, it, expect, beforeEach, vi } from 'vitest';
import app from '../src/index';

describe('MVP Integration Tests', () => {
  beforeEach(() => {
    vi.stubEnv('DB', 'mock-database');
    vi.stubEnv('JWT_SECRET', 'test-jwt-secret');
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await app.request('/health');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version', '1.0.0');
    });
  });

  describe('Lead Management API', () => {
    it('should create a lead with valid data', async () => {
      const leadData = {
        email: 'test@example.com',
        phone: '+1234567890',
        gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
        value_cents: 15000,
        vertical: 'dental',
      };

      const siteResponse = await app.request('/api/v1/admin/sites', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Site',
          domain: 'test.example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const siteData = await siteResponse.json();
      const token = siteData.token;

      const response = await app.request('/api/v1/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('leadId');
    });

    it('should reject lead creation without auth', async () => {
      const leadData = {
        email: 'test@example.com',
        value_cents: 15000,
      };

      const response = await app.request('/api/v1/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    it('should retrieve leads with valid auth', async () => {
      const siteResponse = await app.request('/api/v1/admin/sites', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Site',
          domain: 'test.example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const siteData = await siteResponse.json();
      const token = siteData.token;

      const response = await app.request('/api/v1/leads', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('leads');
      expect(Array.isArray(data.leads)).toBe(true);
    });
  });

  describe('Waitlist API', () => {
    it('should add email to waitlist', async () => {
      const waitlistData = {
        email: 'waitlist@example.com',
        company: 'Test Company',
        monthly_spend: 5000,
      };

      const response = await app.request('/api/v1/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('waitlistId');
    });

    it('should reject invalid email', async () => {
      const waitlistData = {
        email: 'invalid-email',
        company: 'Test Company',
      };

      const response = await app.request('/api/v1/waitlist', {
        method: 'POST',
        body: JSON.stringify(waitlistData),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Admin API', () => {
    it('should create a new site', async () => {
      const siteData = {
        name: 'Test Site',
        domain: 'test.example.com',
        vertical: 'dental',
        target_audience: 'local_customers',
      };

      const response = await app.request('/api/v1/admin/sites', {
        method: 'POST',
        body: JSON.stringify(siteData),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('site');
      expect(data).toHaveProperty('token');
      expect(data.site).toHaveProperty('id');
      expect(data.site).toHaveProperty('name', 'Test Site');
    });

    it('should retrieve site list', async () => {
      const response = await app.request('/api/v1/admin/sites');
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('sites');
      expect(Array.isArray(data.sites)).toBe(true);
    });
  });

  describe('API Documentation', () => {
    it('should serve OpenAPI docs', async () => {
      const response = await app.request('/docs');
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    it('should serve OpenAPI JSON', async () => {
      const response = await app.request('/openapi.json');
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('openapi');
      expect(data).toHaveProperty('info');
      expect(data).toHaveProperty('paths');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await app.request('/api/v1/unknown');
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('available');
    });

    it('should handle JSON parsing errors', async () => {
      const response = await app.request('/api/v1/waitlist', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});