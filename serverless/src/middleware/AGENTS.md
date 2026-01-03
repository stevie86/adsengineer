# MIDDLEWARE MODULE

Request processing and security.

## STRUCTURE
```
middleware/
├── auth.ts             # JWT validation
└── rate-limit.ts       # Multi-tier limits
```

## CONVENTIONS
- **Pattern:** Higher-order functions
- **State:** Context injection (c.set)
- **Security:** Fail-open for rate limits

## ANTI-PATTERNS
- Auth bypasses
- Hard-coded rate limits
