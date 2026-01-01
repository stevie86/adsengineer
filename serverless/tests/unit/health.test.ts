import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../src/middleware/auth';
import { healthRoutes } from '../src/routes/status';

describe('Health Check Endpoint', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/health', healthRoutes);
  });

  it('should return 200 OK status', async () => {
    const response = await app.request('/health');
    expect(response.status).toBe(200);
  });

  it('should return proper response structure', async () => {
    const response = await app.request('/health');
    const data = await response.json();
    
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('environment', 'development');
  });

  it('should respond quickly (< 100ms)', async () => {
    const start = Date.now();
    await app.request('/health');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});