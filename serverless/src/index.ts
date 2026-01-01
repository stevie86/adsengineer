import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { leadsRoutes } from './routes/leads';
import { statusRoutes } from './routes/status';
import { ghlRoutes } from './routes/ghl';
import { waitlistRoutes } from './routes/waitlist';
import { adminRoutes } from './routes/admin';
import { onboardingRoutes } from './routes/onboarding';
import { authMiddleware } from './middleware/auth';
import { createDb } from './database';
import { setupDocs } from './openapi';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.use('*', cors({
  origin: ['https://app.advocate.com', 'http://localhost:3000', 'http://localhost:8090'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use('*', logger());

app.use('*', async (c, next) => {
  const db = createDb(c.env.DB);
  c.set('db', db);
  return next();
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development'
  });
});

setupDocs(app);

// Public routes (no auth)
app.route('/api/v1/ghl', ghlRoutes);
app.route('/api/v1/waitlist', waitlistRoutes);

// Admin routes (admin token auth - handled in adminRoutes)
app.route('/api/v1/admin', adminRoutes);

// Protected routes (JWT auth)
const api = new Hono<AppEnv>();
api.use('*', authMiddleware());
api.route('/leads', leadsRoutes);
api.route('/status', statusRoutes);

app.route('/api/v1', api);

app.notFound((c) => {
  return c.json({
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist',
    available: { health: '/health', api: '/api/v1' }
  }, 404);
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

export default app;
