# AdsEngineer

## What This Is

Enterprise conversion tracking SaaS platform that provides server-side attribution for e-commerce businesses. The platform handles multi-platform webhooks (Shopify, WooCommerce, custom sites), Google Ads conversion upload, custom event tracking, and real-time monitoring through a unified API.

## Core Value

CTOs own their data infrastructure with a self-hosted control plane while leveraging global edge deployment for optimal performance and reliability.

## Requirements

### Validated

- ✓ Multi-platform webhook processing (Shopify, WooCommerce, custom sites) — v0.1
- ✓ Google Ads conversion upload with proper attribution — v0.2  
- ✓ Stripe billing integration with subscription management — v0.3
- ✓ Real-time API health monitoring and status endpoints — v0.4
- ✓ Comprehensive test coverage with unit, integration, and E2E tests — v0.5
- ✓ Infrastructure as Code with OpenTofu for Cloudflare deployment — v0.6
- ✓ Agency dashboard with React frontend and Stripe integration — v0.7
- ✓ Shopify plugin for webhook proxy and app management — v0.8

### Active

- [ ] Hybrid Architecture: Central Brain (self-hosted) + Global Edge (Cloudflare Workers)
- [ ] Clawdbot orchestrator skill for VPS deployment
- [ ] Architecture page showcasing decentralised infrastructure
- [ ] VPS setup script for easy deployment

### Out of Scope

- Full mobile app development — Web-first approach with responsive design
- Direct database access for customers — All access through API only
- Real-time chat support — Focus on async communication via notifications

## Context

AdsEngineer is a mature enterprise SaaS platform with established architecture patterns:

**Technical Environment:**
- Runtime: Cloudflare Workers (edge computing)
- Database: Cloudflare D1 (SQLite-compatible)
- API Framework: Hono with TypeScript
- Infrastructure as Code: OpenTofu
- Secret Management: Doppler

**Current Capabilities:**
- Handles unlimited stores with webhook-based data ingestion
- Processes Google Ads conversions with attribution windows
- Manages Stripe subscriptions and billing cycles
- Provides real-time analytics and monitoring
- Supports custom event definitions for flexible tracking
- Enterprise-grade security with HMAC webhook validation

**Architecture Decisions:**
- Serverless-first approach for scalability and cost efficiency
- Separation of concerns: API layer, services layer, database layer
- Type safety throughout with comprehensive TypeScript usage
- Comprehensive testing strategy with multiple test types

## Constraints

- **Tech Stack**: TypeScript, Hono, Cloudflare Workers/D1, React, Stripe - established ecosystem with existing patterns
- **Security**: Enterprise requirements demand HMAC webhook validation and encrypted credential storage
- **Performance**: Global edge distribution requires efficient data processing and minimal cold starts
- **Integration**: Must support existing webhook formats (Shopify, GHL, custom) without breaking changes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudflare Workers + D1 | Serverless scalability, global edge distribution, cost efficiency | ✓ Good |
| Hono Framework | Lightweight, TypeScript-first, excellent OpenAPI support | ✓ Good |
| TypeScript Strict Mode | Type safety across entire codebase, better developer experience | ✓ Good |
| Doppler for Secrets | Centralized secret management, environment-specific configurations | ✓ Good |
| Stripe Integration | Established payment provider with webhook-based billing | ✓ Good |
| React + Tailwind | Proven frontend stack with rapid development | ✓ Good |

---
*Last updated: 2025-01-26 after milestone v0.8 completion*