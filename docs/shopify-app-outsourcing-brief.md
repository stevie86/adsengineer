# Shopify App Development Brief

**Project:** Shopify App with OAuth & Webhook Integration  
**Type:** Backend Integration App  
**Duration:** 1 week  
**Budget:** [To be discussed]

---

## Project Overview

We need a Shopify App that connects Shopify stores to our existing backend API. The app should handle OAuth installation and automatically configure webhooks to send order data to our server.

**This is a technical integration project, not a feature-rich app.**

---

## Scope of Work

### 1. OAuth Installation Flow

Build standard Shopify OAuth 2.0 flow:

- `GET /auth/shopify?shop={shop}` - Initiates OAuth, redirects to Shopify
- `GET /auth/shopify/callback` - Handles OAuth callback, exchanges code for token

**Requirements:**
- Store access token securely
- Associate shop with account ID (passed in state parameter)
- Handle errors gracefully

**Scopes needed:**
- `read_orders`
- `read_customers`

### 2. Automatic Webhook Registration

After successful OAuth, register webhooks via Shopify Admin API:

| Topic | Address |
|-------|---------|
| `orders/create` | `https://[our-api]/api/v1/shopify/webhook` |
| `orders/paid` | `https://[our-api]/api/v1/shopify/webhook` |
| `app/uninstalled` | `https://[our-api]/api/v1/shopify/webhook` |

**Requirements:**
- Register webhooks automatically on install
- Retry on failure (max 3 attempts)
- Log registration success/failure

### 3. Basic Embedded Admin UI

Simple status page that loads in Shopify admin:

**Must show:**
- Connection status (green/red indicator)
- Shop domain
- "Connected since" timestamp
- Link to external dashboard (URL provided)

**Technical requirements:**
- Use Shopify App Bridge 3.x
- Use Polaris components
- Session token authentication
- Minimal UI (single page)

### 4. Uninstall Handler

Handle `app/uninstalled` webhook:
- Mark shop as inactive in our system
- Do NOT delete any data
- Log the event

---

## Technical Requirements

### Stack (Flexible)
- **Backend:** Node.js preferred (can discuss alternatives)
- **Hosting:** We will host (provide deployment artifacts)
- **Database:** We provide the database connection

### Must Use
- Shopify API version 2024-01 or later
- App Bridge 3.x (not legacy)
- Session token auth (not cookies)
- HMAC webhook verification

### Deliverables

1. **Source code** - Clean, documented code
2. **Environment variables list** - What config is needed
3. **Deployment instructions** - How to deploy
4. **Test store verification** - Demo on Shopify dev store

---

## What We Provide

- Shopify Partner account access (or you create, we transfer)
- Backend API endpoint for webhooks (already built)
- Database schema and connection
- Test Shopify development store

---

## What We Handle

- Webhook processing logic (already built)
- Data storage and processing
- Business logic after data received
- Production deployment
- App Store submission (later)

---

## Out of Scope

- Webhook processing logic
- Any data analytics or reporting
- Billing integration
- Theme modifications
- Shopify POS
- Multi-currency handling
- App Store listing (we handle later)

---

## Timeline

| Milestone | Duration | Deliverable |
|-----------|----------|-------------|
| OAuth Flow | 2 days | Install/callback working |
| Webhook Registration | 1 day | Auto-registers on install |
| Embedded UI | 2 days | Status page in admin |
| Testing | 1 day | Works on dev store |
| Handoff | 1 day | Documentation + code |

**Total: 7 days**

---

## Acceptance Criteria

- [ ] OAuth install flow works end-to-end
- [ ] Access token stored securely
- [ ] Webhooks auto-registered on install
- [ ] Webhooks hit our endpoint (we verify)
- [ ] Embedded UI shows in Shopify admin
- [ ] Connection status displays correctly
- [ ] Uninstall webhook received
- [ ] Code is clean and documented
- [ ] Works on Shopify development store

---

## Communication

- Daily async updates (Slack/Email)
- Questions answered within 4 hours during business hours
- Screen share for handoff

---

## To Apply

Please provide:
1. Examples of Shopify apps you've built
2. Estimated timeline and rate
3. Any questions about the scope

---

## Notes

- This is the first phase of a larger integration
- Quality and clean code more important than speed
- We may extend for additional features if this goes well
