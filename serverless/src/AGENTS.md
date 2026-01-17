# SOURCE CODE KNOWLEDGE BASE

**Generated:** 2026-01-13
**Domain:** Core API Logic (TypeScript/Hono)

## OVERVIEW
Main TypeScript implementation. Routes call services, services call database.

## STRUCTURE
```
src/
├── index.ts           # Hono app, route registration, CORS config
├── types.ts           # Bindings (D1, KV, secrets), shared interfaces
├── openapi.ts         # Generated OpenAPI spec (DO NOT EDIT)
├── snippet.ts         # Client-side tracking snippet generator
├── routes/            # API endpoints - SEE routes/AGENTS.md
├── services/          # Business logic - SEE services/AGENTS.md
├── middleware/        # Request processing - SEE middleware/AGENTS.md
├── database/          # D1 query functions
└── workers/           # Background processing (offline conversions)
```

## CONVENTIONS
- **Route files:** One domain per file. Export Hono router.
- **Service files:** Pure functions. Import in routes.
- **Types:** Define in route file or `types.ts` if shared.
- **Imports:** Relative paths within src/

## PATTERNS
```typescript
// Route pattern
const app = new Hono<{ Bindings: Bindings }>();
app.post('/endpoint', zValidator('json', Schema), async (c) => {
  const data = c.req.valid('json');
  const result = await myService(c.env.DB, data);
  return c.json({ success: true, data: result });
});

// Service pattern
export async function myService(db: D1Database, data: Input): Promise<Output> {
  const stmt = db.prepare('SELECT * FROM table WHERE id = ?').bind(data.id);
  return stmt.first();
}
```

## ANTI-PATTERNS
- Logic in index.ts (routes only)
- DB queries in routes (services layer)
- Editing openapi.ts (auto-generated)