import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { devGuardMiddleware, devLoggingMiddleware } from './middleware/dev-guard';
import { adminRoutes } from './routes/admin';
import { billingRoutes } from './routes/billing';
import { ghlRoutes } from './routes/ghl';
import { shopifyRoutes } from './routes/shopify';
// Temporarily commented out evaluation router during development
// import { evaluationRouter } from './routes/evaluate';
import { tiktokRouter } from './routes/tiktok';
import { woocommerceRoutes } from './routes/woocommerce';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://172.104.241.225:3000',
      'http://100.111.164.18:3000',
      'https://adsengineer.com',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature'],
  })
);

app.use('*', devLoggingMiddleware());
app.use('*', devGuardMiddleware());

// app.doc('/docs', swaggerUI({ url: '/openapi.json' })); // Temporarily disabled

// app.route('/api/v1/evaluate', evaluationRouter); // Temporarily disabled

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.route('/api/v1/admin', adminRoutes);
app.route('/api/v1/billing', billingRoutes);
app.route('/api/v1/tiktok', tiktokRouter);
app.route('/api/v1/shopify', shopifyRoutes);
app.route('/api/v1/woocommerce', woocommerceRoutes);
app.route('/api/v1/ghl', ghlRoutes);

export default app;
