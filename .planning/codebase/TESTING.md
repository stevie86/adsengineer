# Testing Patterns

**Analysis Date:** 2026-01-24

## Test Framework

**Runner:**
- Vitest 4.0.16 for all packages (serverless, frontend, admin-dashboard)
- Jest-compatible syntax with `expect()` assertions
- Config files: `vitest.config.ts` (unit), `vitest.integration.config.ts`, `vitest.e2e.config.ts`

**Assertion Library:**
- Built-in Vitest assertions (`expect()`)
- Testing Library for React components in frontend

**Run Commands:**
```bash
# Serverless testing
cd serverless
pnpm test                    # Run all tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # Coverage report
pnpm test:integration        # Integration tests only
pnpm test:e2e               # E2E tests only
pnpm test:all               # Biome check + tests

# Frontend testing
cd frontend
pnpm test                    # Run React tests
pnpm test:ui                 # Vitest UI
```

## Test File Organization

**Location:**
- **Serverless:** Separate test directories by scope
  - `tests/unit/` - Service/utility tests (fast, fully mocked)
  - `tests/integration/` - API endpoint tests (slower, real/local D1)
  - `tests/e2e/` - Full system flows (slowest, multiple systems)
- **Frontend:** Co-located with source code
  - `src/tests/` - Component tests
  - `src/tests/unit/` - Unit component tests
  - `src/tests/integration/` - Component integration tests
  - `src/tests/e2e/` - Full app flow tests

**Naming:**
- Test files end with `.test.ts` (serverless) or `.test.tsx` (frontend)
- Integration tests follow same naming pattern in their directories
- No `.spec.*` files used

**Structure:**
```
serverless/
├── tests/
│   ├── unit/                 # Service layer tests (33 files)
│   │   ├── auth-middleware.test.ts
│   │   ├── encryption.test.ts
│   │   └── ...
│   ├── integration/          # API endpoint tests
│   │   ├── api-integration.test.ts
│   │   ├── webhook-workflow.test.ts
│   │   └── ...
│   ├── e2e/                 # End-to-end flows
│   │   ├── onboarding.test.ts
│   │   └── user-journey-e2e.test.ts
│   └── run-tests.sh          # Test runner script

frontend/
├── src/
│   └── tests/
│       ├── unit/
│       │   └── signup-comprehensive.test.tsx
│       ├── integration/
│       │   └── components.test.tsx
│       ├── e2e/
│       │   └── app-flow.test.tsx
│       └── App.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
// Serverless test pattern
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

describe('Auth Middleware', () => {
  let app: Hono;
  const testSecret = 'test-jwt-secret-key';

  beforeEach(() => {
    app = new Hono();
    // Setup test environment
    app.use('*', (c, next) => {
      c.env = { ...c.env, JWT_SECRET: testSecret };
      return next();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid JWT', () => {
    test('allows access with valid token', async () => {
      const token = await createValidJWT();
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user_id).toBe('user123');
    });
  });
});
```

**Frontend Component Pattern:**
```typescript
import { test, expect, describe, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders signup form', () => {
    render(<Signup />);
    expect(screen.getByText('Join AdsEngineer')).toBeInTheDocument();
    expect(screen.getByText('Agency Name')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<Signup />);
    const nextButton = screen.getByText('Next: Platforms & Experience');
    fireEvent.click(nextButton);
    expect(screen.getByText('Agency Name')).toBeInTheDocument();
  });
});
```

**Patterns:**
- **Setup:** `beforeEach()` for test isolation, `beforeAll()` for expensive setup
- **Teardown:** `afterEach()` with `vi.clearAllMocks()` for mock cleanup
- **Assertion:** `expect().toBe()`, `expect().toBeInTheDocument()`, `expect().resolves`
- **Async:** Use `await` for async operations, `waitFor()` for UI updates

## Mocking

**Framework:** Vitest built-in mocking (`vi.fn()`, `vi.mock()`)

**Patterns:**
```typescript
// Mock fetch for API calls
global.fetch = vi.fn();

// Mock external modules
vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock service methods
const mockEncrypt = vi.fn().mockResolvedValue({
  encrypted: 'encrypted-data',
  iv: 'iv-data',
  tag: 'tag-data',
  algorithm: 'AES-GCM',
  timestamp: '2024-01-01T00:00:00Z',
});

// Mock Cloudflare Workers environment
const mockEnv = {
  JWT_SECRET: 'test-secret',
  DB: mockD1Database,
  ENCRYPTION_MASTER_KEY: 'test-key',
};
```

**What to Mock:**
- External API calls (Stripe, Google Ads, Meta)
- Database operations in unit tests
- Cloudflare Workers globals (crypto, fetch)
- React components in isolation tests

**What NOT to Mock:**
- Business logic in integration tests
- Authentication middleware behavior
- Error handling flow
- Data transformation logic

## Fixtures and Factories

**Test Data:**
```typescript
// JWT creation helper for auth tests
async function createValidJWT(payload: Partial<JWTPayload> = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    sub: 'user123',
    iss: 'adsengineer',
    aud: 'adsengineer-api',
    iat: now,
    exp: now + 3600,
    ...payload,
  };
  // ... JWT creation logic
}

// Database state seeding for integration tests
async function seedTestData(db: D1Database) {
  await db.prepare('INSERT INTO customers (id, email, plan) VALUES (?, ?, ?)')
    .bind('cust-123', 'test@example.com', 'free')
    .run();
}
```

**Location:**
- Test helpers defined within test files for specific contexts
- No shared fixture files - keep tests self-contained
- Mock data created inline or via helper functions

## Coverage

**Requirements:**
- No enforced coverage target, but aim for >80% on services
- Coverage reports generated in JSON and HTML formats
- Excludes: `node_modules/`, `tests/`, `**/*.d.ts`

**View Coverage:**
```bash
cd serverless
pnpm test:coverage
# View HTML report at coverage/index.html
```

**Coverage Config:**
```typescript
// vitest.config.ts
coverage: {
  reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'tests/', '**/*.d.ts'],
},
```

## Test Types

**Unit Tests:**
- **Scope:** Individual functions and classes
- **Approach:** Full mocking of external dependencies
- **Speed:** Fast (< 1s per test)
- **Examples:** `encryption.test.ts`, `auth-middleware.test.ts`

**Integration Tests:**
- **Scope:** API endpoints with real database
- **Approach:** Use local D1 database, mock external APIs
- **Speed:** Medium (1-5s per test)
- **Examples:** `api-integration.test.ts`, `webhook-workflow.test.ts`

**E2E Tests:**
- **Scope:** Complete user workflows
- **Approach:** Real services, real database, end-to-end flows
- **Speed:** Slow (5-30s per test)
- **Examples:** `onboarding.test.ts`, `user-journey-e2e.test.ts`

## Common Patterns

**Async Testing:**
```typescript
test('handles async operations', async () => {
  const promise = Promise.resolve({ success: true });
  await expect(promise).resolves.toEqual({ success: true });
  
  const result = await myService(db, testData);
  expect(result).toBeDefined();
});
```

**Error Testing:**
```typescript
test('handles database errors gracefully', async () => {
  const mockDb = {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      }),
    }),
  };
  
  await expect(myService(mockDb, testData)).rejects.toThrow('Database connection failed');
});
```

**Mock API Responses:**
```typescript
test('handles external API failures', async () => {
  (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
  
  const result = await externalApiCall();
  expect(result.error).toBe('Network error');
});

test('handles external API success', async () => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data: 'success' }),
  });
  
  const result = await externalApiCall();
  expect(result.data).toBe('success');
});
```

---

*Testing analysis: 2026-01-24*