# Coding Conventions

**Analysis Date:** 2026-02-03

## Overview

This codebase uses **dual linting strategies**: BiomeJS for backend (`serverless/`) and ESLint + Prettier for frontend (`frontend/`). Both follow the same underlying style rules (2-space indent, single quotes, semicolons, trailing commas).

## Naming Patterns

**Files:**
- Routes: `kebab-case.ts` (e.g., `custom-events.ts`, `shopify.ts`)
- Services: `kebab-case.ts` (e.g., `encryption.ts`, `google-ads.ts`)
- Tests: `{filename}.test.ts` co-located with source or in `tests/{unit,integration,e2e}/`

**Functions:**
- camelCase for all functions (e.g., `encryptCredential`, `getHealthStatus`)
- Async functions prefix with verb (e.g., `initializeEncryption`, `validateEncryptedData`)
- Private methods in classes use regular camelCase (TypeScript private keyword)

**Variables:**
- camelCase for variables (e.g., `masterKey`, `keyCache`)
- PascalCase for classes and types (e.g., `EncryptionService`, `EncryptedData`)
- UPPER_SNAKE_CASE for constants and env var names in bindings

**Types:**
- Interfaces use PascalCase (e.g., `EncryptionConfig`, `AppEnv`)
- Type imports use `import type` (e.g., `import type { Context } from 'hono'`)
- Prefer explicit return types on exported functions

## Code Style

### Backend (`serverless/`)

**Tool:** BiomeJS 2.3.10 (Strict Configuration)
- Config file: `serverless/biome.json`

**Key Settings:**
```json
{
  "indentStyle": "space",
  "indentWidth": 2,
  "lineWidth": 100,
  "quoteStyle": "single",
  "semicolons": "always",
  "trailingCommas": "es5",
  "arrowParentheses": "always"
}
```

**Lint Rules (Error level):**
- `noUnusedVariables` - All variables must be used
- `useConst` - Prefer `const` over `let`
- `noVar` - Never use `var`
- `noExplicitAny` - Warns on `any` type (allowed in test utilities)
- `noEmptyBlockStatements` - No empty code blocks

**Commands:**
```bash
cd serverless
pnpm lint          # Check linting
pnpm lint:fix      # Fix linting issues
pnpm format        # Format code
pnpm format:check  # Check formatting
```

### Frontend (`frontend/`)

**Tools:** ESLint + Prettier (Legacy)
- Config files: `frontend/.eslintrc.json`, `frontend/.prettierrc`

**Key Settings:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "jsxSingleQuote": true
}
```

**ESLint Rules:**
- `@typescript-eslint/no-unused-vars`: error (args prefixed with `_` allowed)
- `@typescript-eslint/no-explicit-any`: warn
- `prefer-const`: error
- `no-var`: error
- `react-refresh/only-export-components`: warn

**Commands:**
```bash
cd frontend
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix ESLint issues
pnpm format        # Run Prettier
pnpm format:check  # Check Prettier formatting
```

## Import Organization

**Order (enforced by Biome assist):**
1. External dependencies (e.g., `hono`, `zod`, `stripe`)
2. Internal types (`import type { ... }`)
3. Internal modules (relative paths)

**Path Aliases:**
- Backend: Relative imports (e.g., `../services/encryption`)
- Frontend: `@/` alias resolves to `src/` (e.g., `import { Signup } from '@/pages/Signup'`)

**Example Pattern (Backend):**
```typescript
import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../types';
import { authMiddleware } from '../middleware/auth';
import { encryptCredential } from '../services/encryption';
```

**Example Pattern (Frontend):**
```typescript
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';
import Signup from '../pages/Signup';
```

## Error Handling

**Strategy:** Throw typed errors in services, catch in routes

**Patterns:**
- Services throw `Error` with descriptive messages
- Routes return `{ success: false, error: "message" }` on failure
- Always include context in error messages (e.g., `console.error('❌ Encryption failed:', error)`)

**Example (Service):**
```typescript
async encrypt(plainText: string): Promise<EncryptedData> {
  if (!this.masterKey) {
    throw new Error('Encryption service not initialized');
  }
  try {
    // ... encryption logic
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Data encryption failed');
  }
}
```

**Example (Route):**
```typescript
app.post('/endpoint', async (c) => {
  try {
    const result = await someService();
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: 'Operation failed' }, 500);
  }
});
```

## Logging

**Framework:** `console` with emoji prefixes

**Patterns:**
- Success: `console.log('✅ Action completed successfully')`
- Warning: `console.warn('⚠️ Non-critical issue')`
- Error: `console.error('❌ Operation failed:', error)`
- Info: `console.log('🔐 Data encrypted')`

**Common Emojis:**
- ✅ Success/Complete
- ❌ Error/Failed
- ⚠️ Warning
- 🔐 Encryption
- 🔓 Decryption
- 🗝️ Key management
- 📊 Analytics
- 🔍 Detection

## Comments

**When to Comment:**
- JSDoc for public functions and classes
- Inline comments for complex business logic
- TODO/FIXME comments marked for follow-up

**JSDoc Pattern:**
```typescript
/**
 * Enterprise-grade encryption service for API credentials
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  /**
   * Initialize the encryption service with master key
   */
  async initialize(masterKeySecret: string): Promise<void> {
    // Implementation
  }
}
```

## Function Design

**Size:** Prefer small, single-purpose functions under 50 lines

**Parameters:**
- Max 3-4 parameters, use options object for more
- Destructure in function signature when appropriate

**Return Values:**
- Async functions return `Promise<T>`
- Services return objects with `success` boolean when appropriate
- Use explicit return types on exported functions

**Example:**
```typescript
export interface EncryptResult {
  encrypted: string;
  iv: string;
  tag: string;
  algorithm: string;
  timestamp: string;
}

export async function encryptCredential(
  credential: string,
  context?: string
): Promise<EncryptResult> {
  const service = EncryptionService.getInstance();
  return await service.encrypt(credential, context);
}
```

## Module Design

**Exports:**
- Named exports for utilities and services
- Default exports for Hono routers
- Barrel files not used (explicit imports preferred)

**Patterns:**
```typescript
// Service pattern
export class EncryptionService {
  private static instance: EncryptionService;
  static getInstance(): EncryptionService { /* ... */ }
}

export const encryptCredential = async (...): Promise<...> => { ... };

// Route pattern
const billing = new Hono<AppEnv>();
// ... route definitions ...
export const billingRoutes = billing;
```

## TypeScript Configuration

**Strict Settings:**
- `noExplicitAny`: warn (not error, allows gradual migration)
- `noVar`: error (always use `const` or `let`)
- `useConst`: error (prefer const)
- `noUnusedVariables`: error

**Type Patterns:**
```typescript
// Environment bindings type
export interface Bindings {
  DB: D1Database;
  ENCRYPTION_MASTER_KEY: string;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
}

// Hono app type
export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    userId?: string;
    agencyId?: string;
  };
};
```

---

*Convention analysis: 2026-02-03*
