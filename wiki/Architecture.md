# Architecture

High-level system architecture for AdsEngineer.

## System Overview

AdsEngineer is a serverless conversion tracking platform that bridges the gap between ad clicks and actual revenue.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ad Platforms  │    │   Websites      │    │   Ad Platforms  │
│  (Google/Meta)  │    │  (WordPress)   │    │ (Google/Meta)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ GCLID/FBCLID        │ Form submissions      │ Conversions
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Workers                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                AdsEngineer API                │   │
│  │  ┌─────────────┐  ┌─────────────────────┐   │   │
│  │  │ Webhooks     │  │   API Endpoints    │   │   │
│  │  │ Receiver     │  │   (Authenticated) │   │   │
│  │  └───────┬─────┘  └─────────┬─────────┘   │   │
│  │          │                    │             │   │
│  │          ▼                    ▼             │   │
│  │  ┌────────────────────────────────────────┐    │   │
│  │  │        Business Logic              │    │   │
│  │  │  - Lead Processing              │    │   │
│  │  │  - Conversion Validation        │    │   │
│  │  │  - Value Scoring              │    │   │
│  │  └────────────────┬───────────────────┘    │   │
│  │                 │                        │   │
│  │                 ▼                        │   │
│  │  ┌────────────────────────────────────────┐    │   │
│  │  │      Data Layer                   │    │   │
│  │  │  - D1 Database (SQLite)         │    │   │
│  │  │  - Encrypted Credentials         │    │   │
│  │  │  - Audit Logs                   │    │   │
│  │  └────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌─────────────────────────┐
                  │   Ad Platforms APIs  │
                  │ (Google Ads Upload)  │
                  └─────────────────────────┘
```

## Core Components

### 1. Webhook Receiver
- **Purpose:** Ingest lead data from multiple sources
- **Sources:** GoHighLevel, Shopify, custom forms
- **Security:** HMAC signature verification
- **Processing:** GCLID/FBCLID extraction and persistence

### 2. Lead Processing Engine
- **Validation:** Email, phone, GCLID format validation
- **Deduplication:** Prevent duplicate lead submissions
- **Scoring:** Assign value based on business rules
- **Routing:** Route to appropriate conversion handler

### 3. Conversion Tracker
- **Attribution:** Match leads to conversions
- **Upload:** Send verified conversions to ad platforms
- **Batching:** Efficient bulk upload processing
- **Retry Logic:** Handle temporary API failures

### 4. Data Storage
- **D1 Database:** SQLite-based serverless database
- **Encryption:** AES-256-GCM for sensitive data
- **Schema:** Optimized for conversion tracking queries
- **Retention:** Configurable data retention policies

## Data Flow

### Lead Capture Flow
```
1. User clicks ad → GCLID assigned
2. User lands on website → GCLID stored in cookie
3. User fills form → GCLID submitted with lead data
4. Webhook received → Lead stored with GCLID
5. Validation → Lead scored and queued for conversion
```

### Conversion Attribution Flow
```
1. Conversion occurs (sale/signup) → Conversion event captured
2. Attribution lookup → Match conversion to original GCLID
3. Value assignment → Apply business rules for lead value
4. Platform upload → Send conversion to Google/Meta Ads
5. Confirmation → Store conversion success/failure
```

## Security Model

### Authentication
- **JWT Tokens:** For API access and admin operations
- **Webhook Signatures:** HMAC verification for all webhooks
- **Rate Limiting:** Multi-tier protection against abuse
- **IP Whitelisting:** Optional for sensitive endpoints

### Data Protection
- **Encryption:** All sensitive credentials encrypted at rest
- **Audit Logging:** Complete audit trail of all operations
- **GDPR Compliance:** Data access, deletion, and portability
- **Minimization:** Only collect necessary data

## Scalability Design

### Horizontal Scaling
- **Serverless:** Auto-scaling with Cloudflare Workers
- **Edge Computing:** Global distribution for low latency
- **Queue Processing:** Asynchronous conversion uploads
- **Load Balancing:** Built-in Cloudflare load balancing

### Performance Optimization
- **Caching:** Frequently accessed data in Workers KV
- **Batch Operations:** Minimize API calls to ad platforms
- **Connection Pooling:** Reuse connections where possible
- **Async Processing:** Non-blocking operations throughout

## Reliability Features

### Error Handling
- **Retry Logic:** Exponential backoff for external APIs
- **Circuit Breaker:** Fail fast for repeated failures
- **Fallback Mechanisms:** Graceful degradation
- **Dead Letter Queue:** Failed conversions for manual review

### Monitoring
- **Health Checks:** Automated system health verification
- **Performance Metrics:** Response times, error rates
- **Alerting:** Proactive issue notification
- **Logging:** Structured logs for troubleshooting

## Technology Stack

### Runtime
- **Cloudflare Workers:** Serverless compute platform
- **V8 Isolates:** Secure JavaScript runtime
- **Edge Network:** Global distribution points

### Storage
- **D1 Database:** Serverless SQLite database
- **Workers KV:** Key-value storage for caching
- **Encrypted Fields:** AES-256-GCM encryption

### APIs
- **Google Ads API:** Conversion upload and reporting
- **Meta Ads API:** Facebook conversion tracking
- **Shopify API:** E-commerce platform integration

### Development
- **TypeScript:** Type-safe development
- **Hono Framework:** Lightweight web framework
- **Vitest:** Fast testing framework
- **OpenTofu:** Infrastructure as code

## Deployment Architecture

### Environments
- **Development:** Local testing with mocked data
- **Staging:** Pre-production with real data
- **Production:** Live customer-facing deployment

### CI/CD Pipeline
- **GitHub Actions:** Automated testing and deployment
- **Doppler Integration:** Secure secrets management
- **Infrastructure as Code:** Reproducible deployments

---

**Next:** Read [Contributing](Contributing.md) for development setup.