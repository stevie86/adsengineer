# Testing Patterns

**Analysis Date:** 2026-02-03

## Test Framework

**Runner:** Vitest 4.0.16 (All Packages)

**Assertion Library:** Vitest built-in (`expect`)

**Coverage:** `@vitest/coverage-v8` with text, json, and html reporters

**Run Commands:**
```bash
# Serverless (backend)
cd serverless
pnpm test                   # Run all tests (watch mode)
pnpm test --run            # Run once, exit
pnpm test:integration      # Run integration tests
pnpm test:e2e              # Run E2E tests
pnpm test:coverage         # Generate coverage report
pnpm test:all              # Lint + run all tests

# Frontend
cd frontend
pnpm test                  # Run tests (watch mode)
pnpm test:ui               # Run with Vitest UI
```

## Configuration

### Backend (`serverless/vitest.config.ts`)
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

### Frontend (`frontend/vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],  // Note: File may not exist
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/', '**/*.d.ts', 'vite.config.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

## Test File Organization

**Location:**
- Backend: `serverless/tests/{unit,integration,e2e}/`
- Frontend: `frontend/src/tests/{unit,integration,e2e}/`

**Naming:**
- Unit: `{feature}.test.ts` (e.g., `encryption.test.ts`)
- Integration: `{workflow}.test.ts` (e.g., `onboarding.test.ts`)
- E2E: `{journey}.test.ts` (e.g., `user-journey-e2e.test.ts`)

**Structure:**
```
serverless/tests/
├── unit/               # Service & utility tests (Fast, mocked)
│   ├── encryption.test.ts
│   ├── billing-system.test.ts
│   └── rate-limit.test.ts
├── integration/        # API endpoint tests (Slower, real/local D1)
│   ├── onboarding.test.ts
│   └── api-integration.test.ts
├── e2e/                # Full system flows
│   └── onboarding.test.ts
└── README.md
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, test, beforeAll, beforeEach, vi } from 'vitest';
import { EncryptionService } from '../../src/services/encryption';

describe('Encryption Service', () => {
  let service: EncryptionService;

  beforeAll(() => {
    // One-time setup
    EncryptionService.resetForTesting();
    service = EncryptionService.getInstance();
  });

  beforeEach(() => {
    // Reset before each test
    vi.clearAllMocks();
    EncryptionService.resetForTesting();
    service = EncryptionService.getInstance();
  });

  describe('Initialization', () => {
    it('should initialize with valid master key', async () => {
      await expect(service.initialize('validKey')).resolves.not.toThrow();
    });

    test('should reject invalid master key', async () => {
      await expect(service.initialize('invalid')).rejects.toThrow();
    });
  });

  describe('Encryption', () => {
    it('should encrypt data successfully', async () => {
      const result = await service.encrypt('test data');
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('algorithm', 'AES-GCM');
    });
  });
});
```

**Key Patterns:**
- Use `describe` blocks to group related tests
- Mix `it()` and `test()` (both work, use consistently within a file)
- Use `beforeAll` for one-time setup, `beforeEach` for per-test reset
- Use `afterAll` for cleanup (especially in integration tests)

## Mocking

**Framework:** Vitest built-in (`vi`)

### Backend Mocking Pattern
```typescript
// Mock global APIs (Web Crypto)
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
  getRandomValues: vi.fn(),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Setup mock return values
beforeEach(() => {
  vi.clearAllMocks();
  mockCrypto.subtle.importKey.mockResolvedValue(mockCryptoKey);
  mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
});
```

### Frontend Mocking Pattern (React)
```typescript
// Mock external libraries
vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe)),
}));

// Mock modules
vi.mock('../services/api', () => ({
  fetchAgency: vi.fn(() => Promise.resolve(mockAgency)),
}));
```

### Testing Library (Frontend)
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { test, expect, describe } from 'vitest';

test('renders signup form', () => {
  render(<Signup />);
  expect(screen.getByText('Join AdsEngineer')).toBeInTheDocument();
});

test('handles user interaction', async () => {
  render(<Signup />);
  fireEvent.change(screen.getByPlaceholderText('Your Agency Name'), {
    target: { value: 'Test Agency' },
  });
  fireEvent.click(screen.getByText('Next'));
  await waitFor(() => {
    expect(screen.getByText('Your marketing setup')).toBeInTheDocument();
  });
});
```

**What to Mock:**
- External APIs (Stripe, Google Ads, etc.)
- Global APIs (crypto, fetch)
- Database calls in unit tests
- Complex library integrations (React Stripe)

**What NOT to Mock:**
- Pure utility functions (test the real implementation)
- Internal service logic in integration tests
- Database in integration tests (use local D1)

## Fixtures and Factories

**Test Data Pattern:**
```typescript
// Inline test data
test('validates agency data', () => {
  const validAgency = {
    name: 'Test Agency',
    contactName: 'John Doe',
    contactEmail: 'john@test.com',
    primaryPlatforms: ['google-ads'],
    ghlExperience: 'intermediate',
  };
  expect(validAgency.name).toBeDefined();
});

// Using cuid2 for unique IDs
import { createId } from '@paralleldrive/cuid2';

test('generates unique IDs', () => {
  const id1 = createId();
  const id2 = createId();
  expect(id1).not.toBe(id2);
});

// Fixture functions
const createMockAgency = (overrides = {}) => ({
  name: 'Test Agency',
  contactName: 'John Doe',
  contactEmail: 'john@test.com',
  primaryPlatforms: ['google-ads'],
  ghlExperience: 'intermediate' as const,
  ...overrides,
});
```

## Coverage

**Requirements:** No enforced target, but aim for >80% on services

**View Coverage:**
```bash
cd serverless
pnpm test:coverage
# Opens coverage report in browser or view text summary in terminal
```

**Coverage Output:**
- `text` - Terminal summary
- `json` - Machine-readable for CI
- `html` - Visual report in `coverage/` directory

**Excluded from Coverage:**
- `node_modules/`
- `tests/` directories
- `**/*.d.ts` (type definitions)
- `vite.config.ts` (frontend)

## Test Types

### Unit Tests
- **Scope:** Individual functions, classes, utilities
- **Location:** `tests/unit/` or `src/tests/unit/`
- **Approach:** Full mocking of dependencies
- **Speed:** Fast (< 100ms per test)

**Example:**
```typescript
describe('Encryption Service', () => {
  // Test pure logic with mocked crypto
  it('should encrypt data', async () => {
    mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);
    const result = await service.encrypt('data');
    expect(result).toHaveProperty('encrypted');
  });
});
```

### Integration Tests
- **Scope:** API endpoints, database interactions
- **Location:** `tests/integration/`
- **Approach:** Minimal mocking, use local D1 database
- **Speed:** Slower (100ms - 2s per test)

**Example:**
```typescript
describe('POST /onboarding/register', () => {
  test('should create agency with valid data', async () => {
    const agencyData = {
      name: `Test Agency ${createId()}`,
      contactEmail: `john${createId()}@test.com`,
      // ...
    };
    // Makes actual HTTP request to test server
    // const response = await request(app).post('/onboarding/register').send(agencyData);
    expect(agencyData.contactEmail).toMatch(/@/);
  });
});
```

### E2E Tests
- **Scope:** Full user workflows across systems
- **Location:** `tests/e2e/`
- **Approach:** Real integrations, minimal mocking
- **Speed:** Slowest (multiple seconds per test)

**Example:**
```typescript
describe('End-to-End Agency Onboarding', () => {
  test('complete agency registration flow', () => {
    // 1. Register agency
    // 2. Verify email
    // 3. Check setup status
    const expectedSteps = [
      'Verify your email address',
      'Complete your agency profile',
      'Set up your first lead tracking',
    ];
    expectedSteps.forEach(step => expect(typeof step).toBe('string'));
  });
});
```

## Common Patterns

### Async Testing
```typescript
// Testing promises
it('should resolve with data', async () => {
  await expect(asyncOperation()).resolves.toEqual(expectedData);
});

it('should reject with error', async () => {
  await expect(failingOperation()).rejects.toThrow('Error message');
});

// Testing async results
it('should return encrypted data', async () => {
  const result = await service.encrypt('test');
  expect(result).toHaveProperty('encrypted');
  expect(result.algorithm).toBe('AES-GCM');
  expect(typeof result.timestamp).toBe('string');
});
```

### Error Testing
```typescript
// Testing error messages
it('should fail if not initialized', async () => {
  const freshService = new EncryptionService();
  await expect(freshService.encrypt('test')).rejects.toThrow(
    'Encryption service not initialized'
  );
});

// Testing error states
it('should handle invalid encrypted data', async () => {
  const invalidData = { encrypted: 'invalid', algorithm: 'AES-GCM' };
  expect(service.validateEncryptedData(invalidData)).toBe(false);
});
```

### Setup/Teardown
```typescript
describe('Database Operations', () => {
  beforeAll(async () => {
    // Initialize test database
    db = await setupTestDB();
  });

  beforeEach(async () => {
    // Clean and seed before each test
    await db.clean();
    await db.seed(fixtures);
  });

  afterAll(async () => {
    // Close connections
    await db.close();
  });
});
```

### Mock Reset Pattern
```typescript
describe('Mocked Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();  // Reset call history
    // OR
    vi.resetAllMocks();  // Reset implementation to undefined
    // OR
    vi.restoreAllMocks(); // Restore original implementations
  });
});
```

## Security Testing

**Patterns for security-critical code:**
```typescript
describe('Security', () => {
  test('API keys are properly hashed', async () => {
    const apiKey = 'test-key';
    const hash1 = await hashKey(apiKey);
    const hash2 = await hashKey(apiKey);
    expect(hash1).toEqual(hash2); // Same input = same hash
    expect(hash1).not.toEqual(await hashKey('different'));
  });

  test('validates data structure', () => {
    const requiredFields = ['id', 'name', 'email', 'created_at'];
    requiredFields.forEach(field => expect(field).toBeDefined());
  });
});
```

## Running Tests in CI

**CI Command:**
```bash
pnpm test:ci  # Runs with dot reporter and coverage
```

**Pipeline Integration:**
```bash
# Check all
pnpm run lint:check && pnpm run type:check && pnpm run test && pnpm run build:check

# Or shorthand
pnpm run validate
```

---

*Testing analysis: 2026-02-03*
