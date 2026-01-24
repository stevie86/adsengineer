# INSPIRATION KNOWLEDGE BASE

**Generated:** 2026-01-19
**Status:** READ-ONLY / REFERENCE

## OVERVIEW
Contains reference implementations, cloned examples, and "gold standard" patterns. 
**DO NOT MODIFY** or deploy code from this directory directly.

## STRUCTURE
```
inspiration/
├── ads_engineer_planner/  # Reference planner implementation
└── ...
```

## USAGE RULES
- **Read-Only:** Treat as an external library.
- **Copy-Paste:** You may copy patterns, but adapt to current project conventions (Biome, Hono, etc.).
- **No Imports:** Never import code from `inspiration/` into production `serverless/` or `frontend/`.

## ANTI-PATTERNS
- Modifying files here to fix bugs (Fix in actual project instead)
- Deploying from this directory
- Depending on code here at runtime
