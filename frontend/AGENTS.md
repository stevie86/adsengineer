# FRONTEND KNOWLEDGE BASE

**Generated:** 2026-01-12
**Domain:** Agency Dashboard UI (React/TypeScript)
**Purpose:** User-facing interface for AdsEngineer SaaS - signup, dashboard, admin

## OVERVIEW
React-based dashboard for AdsEngineer SaaS with agency signup, analytics, and management interfaces. Built with TypeScript, Tailwind CSS, and Stripe integration.

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

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Component Library | src/components/ | Reusable UI elements |
| Page Components | src/pages/ | Route-specific views |
| API Integration | src/services/ | Axios-based API calls |
| Type Definitions | src/types/ | TypeScript interfaces |
| Entry Point | src/main.tsx | App initialization |
| Styling | tailwind.config.js | Tailwind configuration |
| Build Output | dist/ | Production assets |

## CONVENTIONS
- **Architecture:** Component-based React with TypeScript
- **Styling:** Tailwind CSS utility classes only - no custom CSS
- **State:** React Hooks + Context API for global state
- **API:** Axios with centralized service layer
- **Routing:** React Router v6 with protected routes
- **Forms:** React Hook Form for validation
- **Build:** Vite for development, optimized production builds
- **Deployment:** Static files deployable to Vercel/Netlify/CF Pages

## ANTI-PATTERNS (THIS PROJECT)
- Inline styles (Use Tailwind utility classes)
- Direct API calls in components (Use service layer)
- Global CSS files (Use Tailwind utilities)
- Class components (Use functional components with hooks)
- Manual DOM manipulation (Use React state)

## AI-AGENT OPTIMIZATION
- **ALLOWED:** Read all frontend code for UI/UX context
- **ALLOWED:** Suggest component improvements and styling changes
- **ALLOWED:** Add new components following existing patterns
- **FORBIDDEN:** Change routing without consulting backend alignment
- **FORBIDDEN:** Modify Stripe integration without testing payment flows
- **MUST DO:** Maintain responsive design standards
- **MUST NOT DO:** Break existing component APIs

## ENFORCEMENT SEMANTICS
- **MUST:** Use TypeScript strictly - no any types
- **MUST NOT:** Import unused dependencies
- **MUST:** Follow Tailwind utility-first approach
- **MUST NOT:** Add custom CSS without approval
- **MUST:** Test UI changes across responsive breakpoints
- **MUST NOT:** Deploy without successful build and lint checks