import type { AuthContext } from './middleware/auth';
import type { Database } from './database';

export type Bindings = {
  ENVIRONMENT: string;
  JWT_SECRET: string;
  ADMIN_SECRET: string;
  BACKUP_ENCRYPTION_KEY: string;
  DB: D1Database;
};

export type Variables = {
  auth: AuthContext;
  db: Database;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
