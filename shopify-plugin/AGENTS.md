# SHOPIFY PLUGIN KNOWLEDGE BASE

**Generated:** 2026-01-17
**Domain:** Shopify Webhook Proxy (Express.js)

## OVERVIEW
Minimal Express app that bridges Shopify webhooks → AdsEngineer API. Deployed standalone (Railway/Vercel/Heroku).

## STRUCTURE
```
shopify-plugin/
├── index.js          # Main Express app (~150 lines)
├── package.json      # Dependencies (express, dotenv)
├── public/           # Static status page assets
└── README.md         # Deployment guide
```

## DATA FLOW
```
Shopify Store                 This Plugin                    AdsEngineer API
┌─────────────┐              ┌─────────────┐              ┌─────────────────────────┐
│ Order       │──webhook────▶│ /webhooks/  │──POST───────▶│ /api/v1/shopify/webhook │
│ Created     │              │ orders-create│              │ (Cloudflare Workers)    │
└─────────────┘              └─────────────┘              └─────────────────────────┘
```

## ENDPOINTS
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Status page (HTML) |
| `/api/status` | GET | Connection health JSON |
| `/webhooks/orders-create` | POST | Shopify order webhook handler |

## ENV VARS
```bash
SHOPIFY_API_KEY=shpka_xxx      # From Shopify Partner Dashboard
SHOPIFY_API_SECRET=xxx         # From Shopify Partner Dashboard
SHOPIFY_SCOPES=read_orders,write_orders,read_customers
ADSENGINEER_API_KEY=xxx        # For future auth (currently unused)
PORT=3000
```

## DEPLOYMENT
```bash
# Railway (recommended)
railway login && railway init && railway up

# Vercel
vercel --prod

# Heroku
heroku create && git push heroku main
```

## CONVENTIONS
- **Passthrough design:** Plugin does NOT process orders - just forwards to serverless API
- **Health checks:** `/api/status` pings AdsEngineer `/health` endpoint
- **No database:** Stateless proxy only

## WHAT THIS PLUGIN DOES
1. Receives Shopify `orders/create` webhook
2. Logs order info (order_id, total, email)
3. Forwards entire order JSON to `adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook`
4. Returns 200 OK to Shopify

## WHAT THIS PLUGIN DOES NOT DO
- GCLID extraction (handled by serverless API)
- Conversion tracking (handled by serverless API)
- OAuth flows (manual Shopify Partner setup)
- Data storage

## ANTI-PATTERNS
- Adding business logic (belongs in serverless/)
- Storing order data locally
- Hardcoding API endpoints
- Skipping error logging
