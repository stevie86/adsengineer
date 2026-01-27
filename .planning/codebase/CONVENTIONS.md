# Coding Conventions

**Analysis Date:** 2026-01-27

## Naming Patterns

**Files:**
- kebab-case for filenames: `google-ads.ts`, `tracking.test.ts`, `encryption.test.ts`
- Test files: `{module}.test.ts` (Vitest convention)
- Migration files: Numbered prefix: `0001_`, `0002_`

**Functions/Methods:**
- camelCase: `uploadConversion()`, `getAccessToken()`, `initializeEncryption()`
- Async functions suffix with `Async` when explicit clarity needed: `readUserAsync()`

**Variables:**
- camelCase: `accessToken`, `conversionData`, `encryptionService`
- Constants: UPPER_SNAKE_CASE at module level: `const GCLID_REGEX = ...`
- Private class properties: prefixed with underscore: `private masterKey: CryptoKey`

**Types/Interfaces:**
- PascalCase for all types: `GoogleAdsCredentials`, `ConversionData`, `UploadResult`
- Discriminated unions variant: `const status: 'granted' | 'denied' | 'pending'`

**Classes:**
- PascalCase: `EncryptionService`, `Logger`, `GoogleAdsError`
- Singleton pattern for services: `static getInstance()` method

## Code Style

**Formatting (Backend - serverless):**
- Tool: BiomeJS (strict)
- Indent: 2 spaces
- Quotes: Single quotes for strings, double for JSX
- Semicolons: Always
- Trailing commas: es5 (trailing comma in objects/arrays)
- Line width: 100 characters
- Line ending: LF

**Formatting (Frontend - frontend):**
- Tool: Prettier
- Indent: 2 spaces
- Quotes: Single quotes with `jsxSingleQuote: true`
- Semicolons: Always (`semi: true`)
- Trailing commas: es5
- Line width: 100 characters
- Tabs: Always spaces (`useTabs: false`)

**Linting:**
- Backend: BiomeJS with strict rules
- Frontend: ESLint + Prettier (legacy setup)
- TypeScript: Strict mode enabled
- Type safety: `noExplicitAny` set to `warn`, `noVar` set to `error`
- No console statements in production code (debugger keyword flagged as error)

**Run commands:**
```bash
# Backend
cd serverless && pnpm check           # Comprehensive check (lint + format)
pnpm lint:fix                         # Auto-fix lint issues
pnpm format                           # Format with Biome

# Frontend
cd frontend && npm run lint -- --fix  # Auto-fix ESLint issues
npm run format                        # Format with Prettier
```

## Import Organization

**Order:**
1. External library imports (third-party npm packages)
2. Internal imports (relative paths within src/)
3. Type imports grouped together

**Examples:**
```typescript
// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Internal
import { uploadConversion } from '../services/google-ads';
import { EncryptionService } from './encryption';

// Type imports
import type { Context, Next } from 'hono';
import type { AppEnv } from '../types';
```

**Path Aliases:** Not used (relative paths preferred: `../services/x`)

**Import style:** Named exports preferred over default exports

## Error Handling

**Patterns:**
- Service layer: Throw typed errors for service-level failures
  ```typescript
  throw new GoogleAdsError('Failed to get access token', 'AUTH_ERROR', errorData);
  ```

- Route layer: Catch errors and return structured responses
  ```typescript
  try {
    const result = await myService(db, data);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
  ```

- Web layer: Validate with Zod, return early on error
  ```typescript
  router.post('/endpoint', zValidator('json', InputSchema), async (c) => {
    const data = c.req.valid('json');
    // ...proceed with validated data
  });
  ```

**Custom error types:**
- `GoogleAdsError`: Google Ads API failures
- Service-specific errors extend Error with additional context (`code`, `details`)

**Never:**
- Swallow errors silently
- Return empty arrays/objects on failure without logging
- Use `// @ts-ignore` or `as any` (use proper types)

## Logging

**Framework:** Custom `Logger` singleton class (`serverless/src/services/logging.ts`)

**Usage:**
```typescript
import { Logger } from '../services/logging';

const logger = Logger.getInstance();

// General log
logger.log('INFO', 'User created', { userId, email });

// Security event
logger.security({
  eventType: 'webhook_signature_failure',
  severity: 'HIGH',
  source: 'webhook',
  message: 'Invalid HMAC signature for Shopify webhook',
  details: { attemptedValue: signature, shopDomain: domain },
});
```

**Structured logging:** Always use structured context objects, not interpolated strings

**Security events:** Always use `logger.security()` with required eventType and severity

**Console usage:** Allowed in development, but Biome flags `console.log` in production builds

## Comments

**When to Comment:**
- Public API methods: Always include JSDoc/TSDoc
- Complex algorithms or business logic
- Non-obvious decisions or workarounds
- Security-sensitive operations (HMAC, encryption)

**JSDoc/TSDoc:**
```typescript
/**
 * Upload offline conversion to Google Ads
 * @param credentials Google Ads API credentials
 * @param conversionData Conversion details
 * @returns Promise<UploadResult>
 */
export async function uploadConversion(
  credentials: GoogleAdsCredentials,
  conversionData: ConversionData
): Promise<UploadResult>
```

**Inline comments:** Use sparingly. Prefer self-documenting code:

```typescript
// Good
const isAuthorized = isAuthenticated && hasPermission('admin');

// Avoid (comment redundant)
// Check if user is authenticated and has admin permission
const isAuthorized = isAuthenticated && hasPermission('admin');
```

**TODO/FIXME:** Use sparingly. Prefer proper issue tracking

## Function Design

**Size:** Aim for functions under 50 lines. Break larger functions into smaller helpers

**Parameters:**
- Prefer named parameters via objects for calls with >3 args
- Destructure for clarity:
  ```typescript
  async function uploadConversion(
    credentials: GoogleAdsCredentials,
    { gclid, conversionValue, currencyCode }: ConversionData
  ): Promise<UploadResult>
  ```

**Return Values:**
- Always return typed values (not `void` unless no return)
- Structured responses via interfaces:
  ```typescript
  interface UploadResult {
    success: boolean;
    conversionAction?: string;
    uploadDateTime?: string;
    errors?: string[];
  }
  ```

**Async functions:** Always return Promise with typed result

## Module Design

**Exports:**
- Named exports preferred: `export { router as myRouter }`
- Classes as named exports: `export class EncryptionService { }`
- Default exports avoided (except for entry points)

**Barrel files:** Not extensively used; prefer direct imports

**Cyclical dependencies:** Avoid through careful layering (Routes → Services → Database)

**Testing imports:**
```typescript
// Use vi.mock() for external dependencies
vi.mock('../../src/services/tracking', () => ({
  generateTrackingSnippet: vi.fn().mockReturnValue('mock snippet'),
}));

// Access internals for testing via test exports (noted in code)
export const __test__ = {
  someInternalHelper,
};
```

## Authentication & Security

**JWT Authentication:**
- Middleware: `serverless/src/middleware/auth.ts` provides `jwtAuth()`
- Usage in routes: `app.use('/api/v1/*', jwtAuth())`
- Access user context: `const auth = c.get('auth')` (returns `AuthContext` with `user_id`, `org_id`, `role`)

**HMAC Webhooks:**
- Middleware: HMAC validation in `serverless/src/middleware/auth.ts`
- Platforms: Shopify, GoHighLevel, TikTok (each has secret env var)
- Usage: `app.post('/webhook', hmacAuth('X-Signature'), handler)`

**Rate Limiting:**
- Middleware: `serverless/src/middleware/rate-limit.ts`
- Stores limits in Cloudflare KV
- Tiers: standard, premium, enterprise (configurable)

**Dev Guard:**
- Middleware: `serverless/src/middleware/dev-guard.ts`
- Blocks unauthenticated requests in dev/staging env
- Production passes-through (route-level auth handles it)

## Database Access

**Pattern:** Never query DB from routes. Always use services layer.

**Prepared statements:** Required. Never interpolate raw SQL.

```typescript
// Good
const stmt = db.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId);
const lead = await stmt.first();

// Never
const lead = await db.prepare(`SELECT * FROM leads WHERE id = '${id}'`).first();
```

**Service layer API:**
```typescript
export async function myService(
  db: D1Database,
  data: Input
): Promise<Output> {
  const stmt = db.prepare('...').bind(...);
  return stmt.first();
}
```

**D1 binding:** Access via `c.env.DB` in routes, passed to services

---

*Convention analysis: 2026-01-27*