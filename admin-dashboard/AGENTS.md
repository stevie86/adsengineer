# ADMIN DASHBOARD KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** Internal Tools
**Status:** WORK IN PROGRESS (WIP)

## OVERVIEW
Internal administrative interface for managing agencies, customers, and system health.
Built with Vite + React.

## STRUCTURE
```
admin-dashboard/
├── src/
│   ├── App.tsx        # Main component
│   └── main.tsx       # Entry point
├── vite.config.js     # Build config
└── package.json       # Dependencies
```

## CONVENTIONS
- **Auth:** Admin Token / specialized JWT
- **UI:** Minimalist, functional over form
- **State:** Local state or simple context

## ANTI-PATTERNS
- Exposing this dashboard to public internet without strict auth firewall
- Hardcoding admin tokens in source
