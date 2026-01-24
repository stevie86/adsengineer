# SHOPIFY PLUGIN KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** Shopify Webhook Proxy (Express.js)

## OVERVIEW
Minimal Express app bridging Shopify webhooks → AdsEngineer API. Stateless proxy.

## STRUCTURE
```
shopify-plugin/
├── index.js          # Main Express app
├── package.json      # Dependencies
└── public/           # Static status page
```

## DATA FLOW
`Shopify (Webhook) -> Plugin (Express) -> AdsEngineer API (Worker)`

## CONVENTIONS
- **Passthrough:** Does NOT process orders, just forwards.
- **Stateless:** No database.
- **Deployment:** Railway/Vercel/Heroku.

## ANTI-PATTERNS
- Adding business logic here (put in serverless API instead).
- Storing data locally.
