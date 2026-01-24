# TESTS KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** Testing Suite (Vitest)
**Purpose:** Unit, Integration, and E2E testing for Serverless API

## OVERVIEW
Comprehensive testing strategy using Vitest. Splits tests by scope: unit (logic), integration (endpoints), E2E (user flows).

## STRUCTURE
```
tests/
├── unit/               # Service & utility tests (Fast, mocked DB)
├── integration/        # API endpoint tests (Slower, real/local D1)
├── e2e/                # Full system flows (Slowest, multiple systems)
├── run-tests.sh        # Test runner script
└── README.md          # Testing guide
```

## WHERE TO LOOK
| Type | Path | Purpose | Mocks |
|------|------|---------|-------|
| Unit | `tests/unit/*.test.ts` | Logic verification | Full mocking |
| Integration | `tests/integration/*.test.ts` | API contract check | Miniflare/D1 |
| E2E | `tests/e2e/*.test.ts` | Critical path check | Real/Local Envs |

## CONVENTIONS
- **Framework:** Vitest (Jest-compatible)
- **Assertion:** `expect()` style
- **Setup:** `beforeAll`/`afterAll` for DB seeding
- **Teardown:** Clean up DB state after integration tests
- **Coverage:** Aim for >80% on Services

## COMMANDS
```bash
pnpm test               # Run unit tests
pnpm test:integration   # Run integration tests
pnpm test:all          # Run all (Unit + Integration)
pnpm test:coverage     # Generate coverage report
```

## ANTI-PATTERNS
- Testing implementation details (test public API instead)
- Shared state between tests (use `beforeEach` cleanup)
- Network calls in Unit tests (always mock external APIs)
- Ignoring types in tests (`as any` abuse)
