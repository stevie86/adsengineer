# Research Findings: Marketing Launch Pack

## 1. Form Handling Strategy
**Decision**: Use Cloudflare Pages Functions (Server-side) to proxy requests to an external email provider (e.g., Mailchimp/ConvertKit) or Google Sheets.
**Rationale**:
- Keeps the frontend static and fast.
- Hides API keys (unlike client-side embeds).
- Zero cost (included in Cloudflare Free tier).
- "Serverless First" alignment.

## 2. DNS & Routing Strategy
**Decision**:
- `adsengineer.cloud` (Root) -> Points to Cloudflare Pages (Landing Page).
- `app.adsengineer.cloud` (Subdomain) -> Points to existing Cloudflare Worker/Frontend.
**Rationale**: Standard SaaS pattern. Keeps marketing site isolated from app performance/security concerns.

## 3. LinkedIn Outreach Tooling
**Decision**: Manual outreach tracked in a simple spreadsheet/Notion initially.
**Rationale**: "Zero-cost organic strategy" constraint prevents paid automation tools. Keeps founder account safe from automation flags.
