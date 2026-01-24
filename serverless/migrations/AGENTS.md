# MIGRATIONS KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** Database Schema (Cloudflare D1)

## OVERVIEW
SQL schema definitions for D1. Numbered sequentially.

## STRUCTURE
```
migrations/
├── 0001_initial.sql
├── 0002_add_agencies.sql
└── ...
```

## WORKFLOW
1. Create new file: `00XX_description.sql`
2. Write raw SQL (`CREATE TABLE`, `ALTER TABLE`)
3. Apply locally: `wrangler d1 migrations apply adsengineer-db --local`
4. Commit
5. CI/CD applies to remote

## CONVENTIONS
- **Naming:** `0000_name.sql`
- **Idempotency:** Use `IF NOT EXISTS` where possible, though D1 tracks applied migrations.
- **Indices:** Always add indices for foreign keys and query filters.

## ANTI-PATTERNS
- Modifying existing/applied migration files (creates drift)
- Putting data seeding in migrations (use separate seed script)
