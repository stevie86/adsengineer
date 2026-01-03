# Contributing

Contributing to AdsEngineer - development setup and guidelines.

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ads-engineer.git`
3. Add upstream: `git remote add upstream https://github.com/adsengineer/ads-engineer.git`
4. Setup development environment (see below)
5. Create feature branch: `git checkout -b feature/your-feature`
6. Make changes and test
7. Submit pull request

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Docker (for local testing)
- Doppler CLI

### Environment Setup

```bash
# Clone repository
git clone https://github.com/adsengineer/ads-engineer.git
cd ads-engineer

# Install dependencies
cd serverless
pnpm install

# Setup Doppler
./setup-doppler.sh

# Add your development secrets
doppler secrets set CLOUDFLARE_API_TOKEN <dev_token>
doppler secrets set CLOUDFLARE_ACCOUNT_ID <dev_account_id>
doppler secrets set JWT_SECRET <dev_jwt_secret>
```

### Local Development

```bash
# Start development server
cd serverless
doppler run -- pnpm dev

# Run tests in another terminal
pnpm test

# Run with coverage
pnpm test:coverage
```

## Project Structure

```
serverless/
├── src/                    # Source code
│   ├── routes/            # API endpoints (one per domain)
│   ├── services/           # Business logic
│   ├── middleware/         # Request processing
│   ├── database/           # Data access layer
│   ├── workers/            # Background jobs
│   ├── types.ts            # Shared interfaces
│   ├── index.ts            # App entry point
│   └── openapi.ts          # API documentation
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── migrations/               # Database migrations
└── scripts/                  # Utility scripts
```

## Development Guidelines

### Code Style

- **TypeScript Strict Mode:** All TypeScript features enabled
- **Function Naming:** camelCase for functions, PascalCase for classes
- **File Naming:** kebab-case for files, PascalCase for components
- **Constants:** UPPER_SNAKE_CASE for constants
- **Comments:** JSDoc for public functions

### Patterns

#### Route Handlers
```typescript
// routes/example.ts
export const exampleRoutes = new Hono<AppEnv>();

exampleRoutes.get('/health', (c) => {
  return c.json({ status: 'ok' });
});
```

#### Services
```typescript
// services/example.ts
export class ExampleService {
  static async process(data: ExampleData): Promise<Result> {
    // Business logic here
  }
}
```

#### Database Access
```typescript
// database/example.ts
export const getExampleById = async (
  db: D1Database,
  id: string
): Promise<Example | null> => {
  const result = await db
    .prepare('SELECT * FROM examples WHERE id = ?')
    .bind(id)
    .first();
  return result as Example || null;
};
```

### Testing

#### Unit Tests
```typescript
// tests/unit/example.test.ts
import { describe, it, expect } from 'vitest';
import { ExampleService } from '../src/services/example';

describe('ExampleService', () => {
  it('should process data correctly', async () => {
    const data = { /* test data */ };
    const result = await ExampleService.process(data);
    expect(result.success).toBe(true);
  });
});
```

#### Integration Tests
```typescript
// tests/integration/api.test.ts
import { app } from '../src/index';
import { testClient } from './utils/test-helpers';

describe('API Integration', () => {
  it('should handle webhook correctly', async () => {
    const response = await testClient
      .post('/api/v1/webhook')
      .send({ /* test payload */ });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Database Migrations

### Creating Migrations
```bash
cd serverless
wrangler d1 migrations create add_new_table
```

### Migration Template
```sql
-- migrations/001_add_new_table.sql
CREATE TABLE IF NOT EXISTS new_table (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### Applying Migrations
```bash
# Local
wrangler d1 migrations apply advocate-db

# Remote
wrangler d1 migrations apply advocate-db --remote
```

## Testing Guidelines

### Test Coverage

- Aim for >80% code coverage
- Test all public APIs
- Test error conditions
- Test authentication flows
- Test rate limiting

### Test Categories

1. **Unit Tests:** Individual function/component tests
2. **Integration Tests:** API endpoint tests
3. **E2E Tests:** Complete user journey tests
4. **Performance Tests:** Load and stress tests

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## Pull Request Process

### Before Submitting

- [ ] All tests pass: `pnpm test`
- [ ] Code formatted: `pnpm format`
- [ ] No lint errors: `pnpm lint`
- [ ] Types check: `pnpm types:check`
- [ ] Documentation updated if needed
- [ ] Tests added for new features

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Documentation updated
```

## Code Review Guidelines

### Review Focus Areas

1. **Correctness:** Does the code work as intended?
2. **Security:** Are there any security vulnerabilities?
3. **Performance:** Is the code efficient?
4. **Maintainability:** Is the code readable and maintainable?
5. **Testing:** Are tests comprehensive?

### Review Process

1. Automated checks run automatically (tests, lint, format)
2. Human review focuses on architectural decisions
3. All PRs require at least one approval
4. Maintain backward compatibility for API changes

## Issue Reporting

### Bug Reports

Include:
- Environment details
- Steps to reproduce
- Expected vs actual behavior
- Error logs if available
- Browser/platform information

### Feature Requests

Include:
- Use case description
- Proposed solution
- Acceptance criteria
- Priority level

## Release Process

### Version Bumping

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.2.3`
4. Push tag: `git push origin v1.2.3`
5. Create GitHub release

### Deployment

Development → Staging → Production

Each environment requires:
- Successful automated tests
- Manual approval for production
- Feature flag controlled rollout

## Getting Help

- **Documentation:** Check this wiki first
- **Issues:** Search existing GitHub issues
- **Discussions:** Use GitHub Discussions for questions
- **Maintainers:** Tag maintainers for urgent issues

---

**Next:** Read [Troubleshooting](Troubleshooting.md) for common issues.