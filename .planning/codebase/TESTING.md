# Testing Strategy

**Generated:** 2026-01-27
**Project:** AdsEngineer - Enterprise Conversion Tracking SaaS

## Framework

- **Vitest** - Primary test framework
- **@vitest/ui** - Visual test runner
- **@vitest/coverage-v8** - Coverage reporting
- **Playwright** - E2E browser testing (available)

## Test Structure

```
serverless/tests/
├── unit/               # 24 test files - Isolated logic tests
│   ├── billing-system.test.ts
│   ├── encryption.test.ts
│   ├── auth-middleware.test.ts
│   └── ...
├── integration/        # 8 test files - API endpoint tests
│   ├── api-integration.test.ts
│   ├── webhook-workflow.test.ts
│   ├── onboarding.test.ts
│   └── ...
├── e2e/                # 2 test files - Full user journeys
│   ├── onboarding.test.ts
│   └── user-journey-e2e.test.ts
└── utils/              # Test helpers and fixtures
```

## Test Types

### Unit Tests (`tests/unit/`)
- Test individual functions/services in isolation
- Mock external dependencies (Stripe, DB, etc.)
- Fast execution, no network calls

```typescript
import { describe, expect, test, vi } from 'vitest';

describe('Encryption Service', () => {
  test('encrypts and decrypts credentials correctly', async () => {
    const original = { apiKey: 'secret123' };
    const encrypted = await encrypt(original, masterKey);
    const decrypted = await decrypt(encrypted, masterKey);
    expect(decrypted).toEqual(original);
  });
});
```

### Integration Tests (`tests/integration/`)
- Test API endpoints with mocked DB
- Verify request/response contracts
- Test middleware chains

```typescript
describe('Webhook Workflow', () => {
  test('processes Shopify order webhook', async () => {
    const response = await app.request('/api/v1/shopify/webhook', {
      method: 'POST',
      headers: { 'X-Shopify-Hmac-Sha256': validSignature },
      body: JSON.stringify(orderPayload),
    });
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests (`tests/e2e/`)
- Full user journey tests
- Test against real (local) database
- Verify complete workflows

## Commands

```bash
# Run all unit tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run with UI
pnpm test:ui

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run with coverage
pnpm test:coverage

# Run all checks (lint + test)
pnpm test:all
```

## Mocking Patterns

### External Services
```typescript
// Mock Stripe SDK
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_123' }),
      retrieve: vi.fn(),
    },
    subscriptions: {
      create: vi.fn(),
      update: vi.fn(),
    },
  })),
}));
```

### Database
```typescript
// Mock D1 database
const mockDb = {
  prepare: vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  }),
};
```

### Environment Variables
```typescript
// Mock environment bindings
const mockEnv = {
  DB: mockDb,
  JWT_SECRET: 'test-secret',
  STRIPE_SECRET_KEY: 'sk_test_123',
  RATE_LIMIT_KV: mockKV,
};
```

## Test Data Fixtures

```typescript
// tests/utils/fixtures.ts
export const testAgency = {
  id: 'agency_test123',
  name: 'Test Agency',
  email: 'test@agency.com',
  subscription_tier: 'professional',
};

export const testWebhookPayload = {
  order_id: 12345,
  email: 'customer@example.com',
  total: 150.00,
  currency: 'USD',
};
```

## Coverage Requirements

- Target: 80% coverage minimum
- Focus on business logic in `services/`
- Ensure all error paths tested
- Don't chase 100% - focus on critical paths

### Coverage Report
```bash
pnpm test:coverage
# Opens coverage report in browser
```

## Configuration Files

### `vitest.config.ts` (Unit)
```typescript
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

### `vitest.integration.config.ts`
```typescript
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/setup-integration.ts'],
  },
});
```

### `vitest.e2e.config.ts`
```typescript
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 30000,
  },
});
```

## Best Practices

### Do
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Arrange-Act-Assert pattern
- ✅ One assertion per test (when possible)
- ✅ Test error cases and edge cases
- ✅ Mock external dependencies

### Don't
- ❌ Test private methods directly
- ❌ Share state between tests
- ❌ Use real external services in unit tests
- ❌ Write brittle tests tied to implementation
- ❌ Delete failing tests to "fix" them

## Existing Test Coverage

| Area | Files | Focus |
|------|-------|-------|
| Billing | `billing-system.test.ts` | Stripe integration, tier logic |
| Auth | `auth-middleware.test.ts` | JWT, HMAC validation |
| Encryption | `encryption.test.ts`, `credential-encryption.test.ts` | Crypto operations |
| Webhooks | `shopify-gclid.test.ts`, `webhook-workflow.test.ts` | Event processing |
| GDPR | `gdpr.test.ts` | Privacy compliance |
| Onboarding | `onboarding.test.ts`, `onboarding-validation.test.ts` | Agency setup |
| Custom Events | `custom-events.test.ts` | Event tracking |
