import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import type { AppEnv } from '../types';
import { tiktokRouter } from './routes/tiktok';

const app = new OpenAPIHono();

app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://adsengineer.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature'],
  })
);

app.doc('/docs', swaggerUI({ url: '/openapi.json' }));

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
app.route('/api/v1/tiktok', tiktokRouter);
app.route('/api/v1/leads', leadsRouter);
app.route('/api/v1/oauth', oauthRouter);
app.route('/api/v1/onboarding', onboardingRouter);
app.route('/api/v1/waitlist', waitlistRouter);
app.route('/api/v1/status', statusRouter);
app.route('/api/v1/billing', billingRouter);
app.route('/api/v1/gdpr', gdprRouter);
app.route('/api/v1/ghl', ghlRouter);
app.route('/api/v1/analytics', analyticsRouter);
app.route('/api/v1/custom-event-definitions', customEventDefinitionsRouter);
app.route('/api/v1/custom-events', customEventsRouter);
app.route('/api/v1/shopify', shopifyRouter);
app.route('/api/v1/tracking', trackingRouter);
