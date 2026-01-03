import type { AuthContext } from './middleware/auth';
import type { Database } from './database';

export type Bindings = {
  ENVIRONMENT: string;
  JWT_SECRET: string;
  ADMIN_SECRET: string;
  BACKUP_ENCRYPTION_KEY: string;
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  // Encryption configuration
  ENCRYPTION_MASTER_KEY: string;
  // Stripe configuration
  STRIPE_SECRET_KEY: string;
  STRIPE_STARTER_PRICE_ID?: string;
  STRIPE_PROFESSIONAL_PRICE_ID?: string;
  STRIPE_ENTERPRISE_PRICE_ID?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  // Rate limiting configuration
  WEBHOOK_IP_WINDOW_MS?: string;    // Time window for IP rate limiting (default: 3600000 = 1 hour)
  WEBHOOK_IP_MAX_REQUESTS?: string; // Max requests per window per IP (default: 100)
  WEBHOOK_SHOP_WINDOW_MS?: string;   // Time window for shop rate limiting (default: 3600000 = 1 hour)
  WEBHOOK_SHOP_MAX_REQUESTS?: string; // Max requests per window per shop (default: 1000)
  // Queues require paid plan - using synchronous processing for now
  // GOOGLE_ADS_QUEUE: Queue;
  // META_QUEUE: Queue;
};

export type Variables = {
  auth: AuthContext;
  db: Database;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
