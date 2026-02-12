import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import type { AppEnv } from '../types';
import { tiktokRouter } from './tiktok';
import { leadsRoutes as leadsRouter } from './leads';
import { oauthRoutes as oauthRouter } from './oauth';
import { onboardingRoutes as onboardingRouter } from './onboarding';
import { waitlistRoutes as waitlistRouter } from './waitlist';
import { statusRoutes as statusRouter } from './status';
import { billingRoutes as billingRouter } from './billing';
import { gdprRoutes as gdprRouter } from './gdpr';
import { ghlRoutes as ghlRouter } from './ghl';
import { analyticsRoutes as analyticsRouter } from './analytics';
import { customEventDefinitionsRoutes as customEventDefinitionsRouter } from './custom-event-definitions';
import { customEventsRoutes as customEventsRouter } from './custom-events';
import { shopifyRoutes as shopifyRouter } from './shopify';
import { trackingRoutes as trackingRouter } from './tracking';

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
