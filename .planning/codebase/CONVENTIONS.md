# Coding Conventions

**Analysis Date:** 2026-01-24

## Naming Patterns

**Files:**
- Kebab-case for all files: `auth-middleware.ts`, `conversion-router.ts`, `custom-events.ts`
- Test files: `{name}.test.ts` (unit), same pattern for integration/e2e
- Config files: kebab-case or camelCase depending on tool (`.prettierrc`, `biome.json`)

**Functions:**
- camelCase for functions: `encryptCredential()`, `decryptCredential()`, `validateEncryptedData()`
- Async functions prefixed with `async`: `async function encrypt()`
- Handler functions: descriptive names `onboardingRoutes.get()`, `shopifyRoutes.post()`

**Variables:**
- camelCase: `masterKeySecret`, `encryptedData`, `attributionMode`
- Constants: UPPER_SNAKE_CASE for static values: `AGREEMENT_VERSIONS`, `AGREEMENT_TEXTS`
- Interface names: PascalCase with descriptive suffixes: `EncryptionConfig`, `EncryptedData`, `EncryptionKey`

**Types:**
- Interface PascalCase: `JWTPayload`, `AppEnv`, `ConversionData`
- Type aliases PascalCase: `ConversionResult`, `AuthContext`
- Generic types: `<T>` suffix for type parameters

## Code Style

**Formatting:**
- **Serverless:** BiomeJS with 2 spaces, 100 char line width, single quotes, trailing commas (es5)
- **Frontend:** ESLint + Prettier with same settings (2 spaces, 100 char width, single quotes)
- **Semicolons:** Always required
- **Line endings:** LF only

**Linting:**
- **Serverless:** BiomeJS with strict rules - noVar: error, useConst: error, noExplicitAny: warn
- **Frontend:** ESLint with TypeScript plugin - same rules as serverless
- **Global ignore:** node_modules/, .wrangler/, dist/

## Import Organization

**Order:**
1. External libraries (hono, zod, stripe, etc.)
2. Internal imports (relative paths starting with `../`)
3. Type imports (import type)

**Path Aliases:**
- No path aliases configured - use relative imports
- Serverless: `import type { AppEnv } from '../types'`
- Frontend: `import { Signup } from '../pages/Signup'`

**Examples:**
```typescript
// External first
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Internal types
import type { AppEnv } from '../types';

// Internal modules
import { encryptCredential } from '../services/encryption';
```

## Error Handling

**Patterns:**
- Always validate inputs with Zod schemas
- Return consistent error responses: `{ success: false, error: "message" }`
- Throw typed errors from services, catch in routes
- Use try-catch blocks for external API calls

**Service Layer:**
```typescript
export async function myService(db: D1Database, data: Input): Promise<Output> {
  try {
    const result = await db.prepare('SELECT * FROM table WHERE id = ?').bind(data.id).first();
    if (!result) {
      throw new Error('Record not found');
    }
    return result;
  } catch (error) {
    console.error('Service error:', error);
    throw error; // Let route handler format response
  }
}
```

**Route Layer:**
```typescript
router.post('/endpoint', zValidator('json', InputSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await myService(c.env.DB, data);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Route error:', error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      500
    );
  }
});
```

## Logging

**Framework:** Console logging with structured messages

**Patterns:**
- Success logs with emojis: `console.log('✅ Encryption service initialized successfully');`
- Error logs with emojis: `console.error('❌ Failed to initialize encryption service:', error);`
- Warning logs with emojis: `console.warn('⚠️ ENCRYPTION_MASTER_KEY not found - encryption disabled');`
- Context-aware logging: `console.log('🔐 Encrypted data with context:', context || 'unknown');`

**Levels:**
- `console.log()`: Success/info messages
- `console.error()`: Error conditions
- `console.warn()`: Warning conditions

## Comments

**When to Comment:**
- Complex business logic explanation
- Security-critical operations
- Public API documentation
- TODO/FIXME for temporary workarounds

**JSDoc/TSDoc:**
- Required for exported functions and classes
- Include parameter types and return types
- Document complex algorithms

**Example:**
```typescript
/**
 * Enterprise-grade encryption service for API credentials
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  /**
   * Encrypt sensitive data using authenticated encryption
   * @param plainText - Data to encrypt
   * @param context - Optional context for logging
   * @returns Encrypted data with IV and authentication tag
   */
  async encrypt(plainText: string, context?: string): Promise<EncryptedData> {
    // Implementation
  }
}
```

## Function Design

**Size:** Keep functions under 50 lines when possible
**Parameters:** Maximum 5 parameters, use objects for complex parameter sets
**Return Values:** Always return typed values, avoid `any` type

**Parameter Pattern:**
```typescript
// Good: Object parameters for complex data
interface SiteSetupInput {
  customer_id: string;
  website: string;
  attribution_mode?: 'sgtm' | 'direct';
  sgtm_container_url?: string;
}

async function setupSite(input: SiteSetupInput): Promise<SetupResult> {
  // Implementation
}

// Avoid: Too many parameters
async function setupSite(
  customerId: string,
  website: string,
  attributionMode?: string,
  sgtmUrl?: string,
  measurementId?: string
): Promise<SetupResult> {
  // Hard to maintain
}
```

## Module Design

**Exports:**
- Named exports for functions: `export { router as onboardingRoutes };`
- Default exports for classes: `export default class EncryptionService`
- Type exports separate: `export type { AppEnv, JWTPayload };`

**Barrel Files:**
- Routes index: `src/routes/index.ts` imports and re-exports all routers
- No barrel files in services - import directly from service files

**Dependency Direction:**
- Routes → Services → Database (unidirectional)
- Services can import other services
- Routes never import other routes directly

**Example Structure:**
```typescript
// src/routes/onboarding.ts
export { router as onboardingRoutes };

// src/routes/index.ts
import { onboardingRoutes } from './onboarding';
import { shopifyRoutes } from './shopify';

export { onboardingRoutes, shopifyRoutes };

// src/index.ts
import { onboardingRoutes } from './routes';
app.route('/api/v1/onboarding', onboardingRoutes);
```

---

*Convention analysis: 2026-01-24*