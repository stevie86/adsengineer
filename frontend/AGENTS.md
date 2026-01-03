# FRONTEND COMPONENT

React/Vue frontend for AdsEngineer dashboard.

## STRUCTURE
```
frontend/
├── src/
│   ├── components/      # UI Components
│   └── index.js        # Entry point
├── public/             # Static assets
└── build/              # Output
```

## CONVENTIONS
- **Architecture:** Component-based
- **Styling:** Tailwind CSS
- **State:** React Hooks / Context

## ANTI-PATTERNS
- Inline styles (Use Tailwind)
- Direct API calls (Use service layer)
