# Testing Patterns

**Analysis Date:** 2026-01-27

## Test Framework

**Runner:**
- Vitest 4.0.16
- Config: `serverless/vitest.config.ts`

**Setup (minimal):**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts'],
    },
  },
});
```

**Run Commands:**
```bash
cd serverless
pnpm test                    # Run unit tests
pnpm test:coverage           # Generate coverage report
pnpm test:integration        # Run integration tests
pnpm test:all                # Run all unit + integration
pnpm test:watch              # Watch mode
pnpm test:ui                 # UI mode (coverage + visual)
```

**Coverage:**
- Framework: Vitest Coverage (v8)
- Reporters: text, JSON, HTML
- Exclusion: node_modules/, tests/, *.d.ts
- Target: Aim for >80% on Services

## Test File Organization

**Location:**
```
serverless/tests/
├── unit/               # Service/utility tests (fast, full mocking)
├── integration/        # API endpoint tests (slower, Miniflare/D1)
└── e2e/                # End-to-end flows (slowest, real/local envs)
```

**Naming:**
- All: `{module}.test.ts` (`tracking.test.ts`, `encryption.test.ts`)
- Integration: `tests/integration/{suite}.test.ts`
- E2E: `tests/e2e/{scenario}-e2e.test.ts`

**Structure by Type:**

**Unit Tests:**
- Test single functions/classes in isolation
- Full mocking (no DB, no network)
- Located: `tests/unit/*.test.ts`
- Examples: `tests/unit/tracking.test.ts`, `tests/unit/encryption.test.ts`

**Integration Tests:**
- Test API contracts (endpoints, request/response)
- Use Vitest environment with Miniflare
- Mock external APIs, real D1/local DB
- Located: `tests/integration/*.test.ts`
- Examples: `tests/integration/api-integration.test.ts`, `tests/integration/webhook-workflow.test.ts`

**E2E Tests:**
- Test complete user flows (signup → dashboard → payment)
- Playwright for browser automation
- Full system testing
- Located: `tests/e2e/*.test.ts`
- Examples: `tests/e2e/user-journey-e2e.test.ts`

## Test Structure

**Suite Organization:**
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { myFunction, myClass } from '../../src/services/my-service';

describe('My Service Tests', () => {
  let service: MyClass;

  beforeEach(() => {
    // Setup before each test
    service = new MyClass();
    vi.clearAllMocks();
  });

  describe('Feature X', () => {
    it('should do something when condition is met', async () => {
      // Arrange
      const input = { value: 42 };

      // Act
      const result = await myFunction(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle error case', async () => {
      // Arrange
      vi.mock('../../src/services/dependency', () => ({
        dependencyFunction: vi.fn().mockRejectedValue(new Error('Failed')),
      }));

      // Act & Assert
      await expect(myFunction()).rejects.toThrow('Failed');
    });
  });
});
```

**Setup/Teardown Patterns:**
- `beforeEach`: Reset mocks, create fresh instances
- `afterEach`: Clean up (if needed)
- `vi.clearAllMocks()`: Standard after each test
- `vi.resetAllMocks()`: Full reset when needed

**Assertion Patterns:**
```typescript
// Success
expect(response.status).toBe(200);
expect(result.success).toBe(true);

// Error expected
await expect(asyncOperation()).rejects.toThrow('Expected error');

// Nested properties
expect(data).toHaveProperty('error');
expect(data.error).toContain('required');

// Array length/content
expect(responses).toHaveLength(10);
responses.forEach((r) => expect(r).toBeDefined());

// Async timeout
await expect(page.waitForSelector('text=Some Text', { timeout: 10000 })).resolves.toBeVisible();
```

## Mocking

**Framework:** Vitest's built-in `vi` mock functions

**Patterns:**

**Mock external dependencies:**
```typescript
// Service import replacement
vi.mock('../../src/services/tracking', () => ({
  generateTrackingSnippet: vi.fn().mockReturnValue('mock snippet'),
}));

// Fetch global mock
global.fetch = vi.fn();

// Mock implementation
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});
```

**Mock Web Crypto API (encryption tests):**
```typescript
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
  getRandomValues: vi.fn(),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Setup default mock behaviors
mockCrypto.subtle.importKey.mockResolvedValue(mockCryptoKey);
mockCrypto.subtle.encrypt.mockResolvedValue(encryptedData);
```

**What to Mock:**
- External API calls (Google Ads, Stripe, etc.)
- Database in unit tests
- File system operations
- Network requests
- Date/time for deterministic tests (`vi.useFakeTimers()`)

**What NOT to Mock:**
- Your own business logic unless testing integration
- Simple utility functions
- Pure functions (test them instead)

**Test Exports (Accessing internals):**
```typescript
// In service file
export const __test__ = {
  someInternalHelper,
};

// In test file
import { __test__ } from '../../src/services/my-service';
```

## Fixtures and Factories

**Test Data Pattern:**
```typescript
// Inline for simplicity (small fixtures)
const mockResponse = {
  status: 'healthy',
  version: '1.0.0',
  timestamp: '2024-01-01T12:00:00Z',
  environment: 'test',
};
```

**Location:**
- Inline in test files (current pattern)
- No dedicated fixtures directory (as of analysis)

**Generator Data:**
```typescript
import { faker } from '@faker-js/faker';

// Use for varied test data
const mockLead = {
  email: faker.internet.email(),
  name: faker.person.fullName(),
  phone: faker.phone.number(),
};
```

## Coverage

**Requirements:** Aim for >80% on Services. Not strictly enforced but encouraged.

**View Coverage:**
```bash
pnpm test:coverage

# Reports generated in:
# - coverage/ (HTML)
# - coverage/lcov-report/index.html (Visual browser report)
```

**Coverage Exclusions:**
```typescript
// In vitest.config.ts
coverage: {
  exclude: ['node_modules/', 'tests/', '**/*.d.ts'],
}
```

## Test Types

**Unit Tests:**
- Scope: Single functions/class methods in isolation
- Approach: Mock all dependencies
- Speed: Fast (<100ms per test)
- Examples: `tests/unit/encryption.test.ts`, `tests/unit/tracking.test.ts`

**Integration Tests:**
- Scope: API endpoints (routes → services → response)
- Approach: Real route handling, mocked DB/external APIs
- Speed: Medium (500ms-2s per test)
- Examples: `tests/integration/api-integration.test.ts`

**E2E Tests:**
- Scope: Complete user flows (signup → payment → dashboard)
- Approach: Playwright browser automation
- Speed: Slow (5-30s per test)
- Examples: `tests/e2e/user-journey-e2e.test.ts`

## Common Patterns

**Async Testing:**
```typescript
// Await async functions
const result = await myAsyncFunction();

// Promise rejection testing
await expect(asyncOperation()).rejects.toThrow('Error message');

// Async timeout
await expect(promise).resolves.toBe(value);
```

**Error Testing:**
```typescript
// Service throws error
const error = new Error('Test error');
vi.mock('../../src/service', () => ({
  myFunction: vi.fn().mockRejectedValue(error),
}));

await expect(myFunction()).rejects.toThrow('Test error');

// Route returns error response
const response = await app.request('/endpoint', {
  method: 'POST',
  body: JSON.stringify({ invalid: 'data' }),
});

expect(response.status).toBe(400);
expect(await response.json()).toHaveProperty('error');
```

**Test Data Validation:**
```typescript
// Zod schema validation
import { z } from 'zod';

const Schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const validData = { email: 'test@example.com', name: 'Test' };
expect(() => Schema.parse(validData)).not.toThrow();

const invalidData = { email: 'not-an-email' };
expect(() => Schema.parse(invalidData)).toThrow();
```

**Mock Reset Pattern:**
```typescript
beforeEach(() => {
  vi.clearAllMocks();  // Clears all mock calls
  vi.restoreAllMocks(); // Restores original implementations

  // Reset mocks to return values
  myFunction.mockReturnValue('default');
});

// If tests rely on fresh instances (singletons)
EncryptionService.resetForTesting();
```

## Test Database

**Local D1 for Integration Tests:**
```bash
# Setup local D1
wrangler d1 migrations apply adsengineer-db --local

# Tests reference local DB via environment variable
USE_LOCAL=true pnpm test:integration
```

**Seeding Pattern:**
```typescript
beforeAll(async () => {
  // Seed test data once for suite
  await seedTestData(testDb);
});

afterAll(async () => {
  // Clean up after suite
  await cleanupTestData(testDb);
});
```

## Performance Testing

**Load Testing in Tests:**
```typescript
test('handles concurrent request simulation', async () => {
  const concurrentRequests = 10;
  const promises = [];

  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(Promise.resolve({ status: 200 }));
  }

  const responses = await Promise.all(promises);
  expect(responses).toHaveLength(10);
  responses.forEach((res) => expect(res.status).toBe(200));
});

test('maintains response times under load', async () => {
  const startTime = Date.now();
  await performOperation();
  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(5000); // <5 seconds
});
```

## Playwright E2E

**Setup Files:**
- `tests/setup/e2e-setup.ts` (E2E configuration)
- Browser: Chrome (default), can configure others

**Patterns:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should complete signup', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Submit")');
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## Anti-Patterns to Avoid

- Testing implementation details (test public behaviors instead)
- Shared state between tests (use `beforeEach` cleanup)
- Network calls in unit tests (always mock external APIs)
- Ignoring types in tests (avoid `as any` abuse)
- Time-dependent tests without fake timers
- Overspecified tests (test one thing at a time)
- Hard-to-read tests (use descriptive names: `should do X when Y`)

---

*Testing analysis: 2026-01-27*