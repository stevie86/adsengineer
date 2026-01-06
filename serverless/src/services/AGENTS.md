# SERVICES KNOWLEDGE BASE

**Generated:** 2026-01-05
**Domain:** Business Logic Layer

## OVERVIEW
Core business logic implementations with singleton patterns for external API integrations.

## STRUCTURE
```
services/
├── encryption.ts       # AES-256-GCM
├── google-ads.ts       # API integration
├── api-monitor.ts      # Health checks
└── logging.ts          # Structured logs
```

## CONVENTIONS
- **Pattern:** Singleton services
- **Error Handling:** Retry logic for external APIs

## ANTI-PATTERNS
- Synchronous network calls
- Unencrypted credential storage
- Silent failures
