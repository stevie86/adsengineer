import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
// Temporarily commented out evaluation router during development
// import { evaluationRouter } from './routes/evaluate';
import { tiktokRouter } from './routes/tiktok';
import { adminRoutes } from './routes/admin';
import { billingRoutes } from './routes/billing';

const app = new Hono();

// Basic API documentation removed for now to fix startup issues

app.use('*', cors({
  origin: ['http://localhost:3000', 'http://172.104.241.225:3000', 'http://100.111.164.18:3000', 'https://adsengineer.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature'],
}));

// app.doc('/docs', swaggerUI({ url: '/openapi.json' })); // Temporarily disabled

// app.route('/api/v1/evaluate', evaluationRouter); // Temporarily disabled

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.route('/api/v1/admin', adminRoutes);
app.route('/api/v1/billing', billingRoutes);
app.route('/api/v1/tiktok', tiktokRouter);

export default app;