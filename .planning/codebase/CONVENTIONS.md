# Code Conventions

**Generated:** 2026-01-27
**Project:** AdsEngineer - Enterprise Conversion Tracking SaaS

## Code Style

### Formatting (BiomeJS - Backend)
```json
{
  "indentStyle": "space",
  "indentWidth": 2,
  "lineWidth": 100,
  "quoteStyle": "single",
  "semicolons": "always",
  "trailingCommas": "es5"
}
```

### Formatting (ESLint/Prettier - Frontend)
- Same general style as backend
- ESLint for React-specific rules
- Prettier for formatting

## TypeScript Conventions

### Strict Mode
- `noExplicitAny: warn` (avoid, don't forbid)
- `noVar: error` (always use const/let)
- `useConst: error` (prefer const)
- `noNonNullAssertion: warn` (minimize `!` usage)

### Type Definitions
```typescript
// ✅ Preferred: Explicit interfaces
interface LeadData {
  email: string;
  gclid?: string;
  source: 'shopify' | 'woocommerce' | 'ghl';
}

// ✅ Use Zod for runtime validation
const LeadSchema = z.object({
  email: z.string().email(),
  gclid: z.string().optional(),
  source: z.enum(['shopify', 'woocommerce', 'ghl']),
});

// ❌ Avoid: any, unknown without narrowing
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `customer-crm.ts` |
| Classes | PascalCase | `BillingService` |
| Functions | camelCase | `uploadConversion()` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_ATTEMPTS` |
| Types/Interfaces | PascalCase | `AuthContext` |
| Database columns | snake_case | `created_at` |
| Route paths | kebab-case | `/custom-events` |

## API Patterns

### Route Handler Pattern
```typescript
const app = new Hono<{ Bindings: Bindings }>();

app.post(
  '/endpoint',
  zValidator('json', InputSchema),
  async (c) => {
    const data = c.req.valid('json');
    const result = await myService(c.env.DB, data);
    return c.json({ success: true, data: result });
  }
);
```

### Service Function Pattern
```typescript
export async function processLead(
  db: D1Database,
  lead: LeadInput
): Promise<LeadResult> {
  const stmt = db.prepare(`
    INSERT INTO leads (email, gclid, source)
    VALUES (?, ?, ?)
  `).bind(lead.email, lead.gclid, lead.source);
  
  const result = await stmt.run();
  return { id: result.lastRowId, ...lead };
}
```

### Error Response Pattern
```typescript
// ✅ Standardized error format
return c.json({
  success: false,
  error: "Human-readable message",
  code: "MACHINE_CODE"  // optional
}, 400);

// ✅ Success response format
return c.json({
  success: true,
  data: result
});
```

## Error Handling

### Try-Catch Pattern
```typescript
try {
  const result = await externalApiCall();
  return c.json({ success: true, data: result });
} catch (error) {
  console.error('API call failed:', error);
  return c.json({
    success: false,
    error: 'Failed to process request'
  }, 500);
}
```

### NEVER Empty Catch Blocks
```typescript
// ❌ FORBIDDEN
try { ... } catch (e) {}

// ✅ At minimum, log the error
try { ... } catch (e) {
  console.error('Operation failed:', e);
  throw e; // or handle appropriately
}
```

## Database Conventions

### Prepared Statements Only
```typescript
// ✅ ALWAYS use prepared statements
const stmt = db.prepare(
  'SELECT * FROM agencies WHERE id = ?'
).bind(agencyId);

// ❌ NEVER raw string interpolation
const stmt = db.prepare(
  `SELECT * FROM agencies WHERE id = '${agencyId}'`  // SQL INJECTION!
);
```

### Migration Naming
```
NNNN_{description}.sql
0019_billing_system.sql
0020_sgtm_config.sql
```

## Import Organization

```typescript
// 1. External packages
import { Hono } from 'hono';
import { z } from 'zod';

// 2. Internal absolute paths
import type { Bindings } from '../types';

// 3. Relative imports
import { validateSignature } from './utils';
```

## Comments

```typescript
// ✅ Explain WHY, not WHAT
// Use HMAC-SHA256 to prevent timing attacks on signature comparison
function timingSafeEqual(a: string, b: string): boolean { ... }

// ❌ Redundant comment
// This function validates the input
function validateInput(data: unknown) { ... }
```

## Testing Conventions

### Test File Location
- Unit tests: `tests/unit/{module}.test.ts`
- Integration tests: `tests/integration/{feature}.test.ts`
- E2E tests: `tests/e2e/{journey}.test.ts`

### Test Structure
```typescript
import { describe, expect, test, vi } from 'vitest';

describe('Module Name', () => {
  describe('function/feature', () => {
    test('should do expected behavior', () => {
      // Arrange
      const input = { ... };
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Mocking Pattern
```typescript
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    customers: { create: vi.fn() },
  })),
}));
```

## Anti-Patterns (FORBIDDEN)

| Pattern | Why It's Bad |
|---------|--------------|
| `as any` | Bypasses type safety |
| `@ts-ignore` | Hides real type errors |
| `@ts-expect-error` | Same as above |
| Empty catch blocks | Swallows errors silently |
| Raw SQL interpolation | SQL injection risk |
| Logic in `index.ts` | Entry point should only wire routes |
| DB queries in routes | Breaks layered architecture |
| `var` keyword | Use `const` or `let` |

## Git Commit Messages

```
type: short description

- Use imperative mood ("add" not "added")
- Types: feat, fix, docs, refactor, test, chore
- Reference issue numbers when applicable
```

Examples:
```
feat: add TikTok conversion tracking
fix: prevent duplicate webhook processing
docs: update API documentation
refactor: extract billing logic to service
test: add integration tests for onboarding
```
