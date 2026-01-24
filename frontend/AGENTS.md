# FRONTEND KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** Agency Dashboard UI (React/TypeScript)
**Purpose:** User-facing interface for AdsEngineer SaaS - signup, dashboard, admin

## OVERVIEW
React-based dashboard for AdsEngineer SaaS. Built with TypeScript, Tailwind CSS, and Stripe integration.

## STRUCTURE
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route-based page components
│   ├── services/       # API service layer
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── index.html          # Entry point
└── dist/              # Build output
```

## CONVENTIONS
- **Architecture:** Component-based React with TypeScript
- **Styling:** Tailwind CSS utility classes only.
- **State:** React Hooks + Context API.
- **API:** Axios with centralized service layer.
- **Routing:** React Router v6.
- **Forms:** React Hook Form.
- **Linting:** ESLint + Prettier (Legacy). *Note: Unlike backend which uses Biome.*

## ANTI-PATTERNS (THIS PROJECT)
- Inline styles (Use Tailwind).
- Direct API calls in components (Use service layer).
- Global CSS files (Use Tailwind).
- Class components (Use functional).

## AI-AGENT OPTIMIZATION
- **ALLOWED:** Suggest component improvements and styling changes.
- **FORBIDDEN:** Change routing without consulting backend alignment.
- **MUST:** Test UI changes across responsive breakpoints.
