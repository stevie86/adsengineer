# Cloud Run API Integration Architecture

**Date:** 2026-01-17
**Conclusion:** We interface with Cloud Run API to provision/manage sGTM, handle everything from our Workers

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AdsEngineer                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 Cloudflare Workers (Our API)                        │   │
│  │                                                                     │   │
│  │  • Receives webhooks from WooCommerce/Shopify                       │   │
│  │  • Manages customer accounts & credentials                          │   │
│  │  • Provisions sGTM via Cloud Run API                                │   │
│  │  • Forwards events to customer's sGTM instance                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              │ Cloud Run Admin API                          │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Google Cloud Run                                  │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ Customer A   │  │ Customer B   │  │ Customer C   │               │   │
│  │  │ sGTM         │  │ sGTM         │  │ sGTM         │               │   │
│  │  │ Instance     │  │ Instance     │  │ Instance     │               │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │   │
│  │         │                 │                 │                        │   │
│  └─────────┼─────────────────┼─────────────────┼────────────────────────┘   │
│            │                 │                 │                            │
└────────────┼─────────────────┼─────────────────┼────────────────────────────┘
             │                 │                 │
             ▼                 ▼                 ▼
       ┌──────────┐      ┌──────────┐      ┌──────────┐
       │   GA4    │      │   GA4    │      │   GA4    │
       │Google Ads│      │Google Ads│      │Google Ads│
       │   Meta   │      │   Meta   │      │   Meta   │
       └──────────┘      └──────────┘      └──────────┘
```

---

## What We Do

### 1. Customer Onboards → We Provision sGTM

When customer signs up:

```typescript
// Our Workers API
POST /api/v1/customers/:id/provision-sgtm

// We call Cloud Run API to create their sGTM instance
await cloudRunAPI.createService({
  project: 'adsengineer-sgtm',
  location: 'us-central1',
  serviceId: `sgtm-${customerId}`,
  image: 'gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable',
  env: {
    CONTAINER_CONFIG: customerContainerConfig,
  }
});
```

### 2. Events Come In → We Forward to Customer's sGTM

```typescript
// Webhook from WooCommerce
POST /api/v1/webhooks/woocommerce

// We forward to customer's sGTM instance
await fetch(`https://sgtm-${customerId}.run.app/g/collect`, {
  method: 'POST',
  body: measurementProtocolPayload
});
```

### 3. We Manage Everything

| Action | We Handle |
|--------|-----------|
| Provisioning | Create Cloud Run service via API |
| Scaling | Configure auto-scaling rules |
| Updates | Update Docker image when Google releases new versions |
| Monitoring | Check health, restart if needed |
| Billing | Track usage, charge customer |

---

## Cloud Run Admin API

### REST Endpoint

```
POST https://run.googleapis.com/v2/projects/{project}/locations/{location}/services
```

### Create Service Example

```typescript
const response = await fetch(
  `https://run.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/services?serviceId=sgtm-${customerId}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template: {
        containers: [{
          image: 'gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable',
          env: [
            { name: 'CONTAINER_CONFIG', value: containerConfig },
            { name: 'PREVIEW_SERVER_URL', value: previewServerUrl },
          ],
          resources: {
            limits: { cpu: '1', memory: '512Mi' }
          }
        }],
        scaling: {
          minInstanceCount: 0,
          maxInstanceCount: 10
        }
      }
    })
  }
);
```

### Terraform Alternative

Google provides official Terraform module:
- https://registry.terraform.io/modules/GoogleCloudPlatform/cloud-run/google/latest
- https://github.com/google-marketing-solutions/sgtm-autodeployer

We could use Terraform from Workers via:
1. Terraform Cloud API
2. Or direct Cloud Run API calls (simpler)

---

## Authentication

### Service Account

We need a GCP Service Account with roles:
- `roles/run.admin` - Create/manage Cloud Run services
- `roles/iam.serviceAccountUser` - Use service accounts

### From Workers

```typescript
// Store service account key in Workers secrets
const serviceAccountKey = JSON.parse(env.GCP_SERVICE_ACCOUNT_KEY);

// Get access token
const accessToken = await getGoogleAccessToken(serviceAccountKey);

// Call Cloud Run API
const response = await fetch(`https://run.googleapis.com/...`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

---

## Implementation Plan

### Phase 1: GCP Setup

1. Create GCP Project: `adsengineer-sgtm`
2. Enable APIs:
   - Cloud Run Admin API
   - Container Registry API
3. Create Service Account with `run.admin` role
4. Store credentials in Workers secrets

### Phase 2: Workers API

New endpoints:

```
POST /api/v1/sgtm/provision
  - Creates Cloud Run service for customer
  - Creates GTM Server container (via GTM API)
  - Returns sGTM URL

GET /api/v1/sgtm/status/:customerId
  - Returns Cloud Run service status

DELETE /api/v1/sgtm/deprovision/:customerId
  - Deletes Cloud Run service

POST /api/v1/sgtm/update/:customerId
  - Updates to latest Docker image
```

### Phase 3: Event Forwarding

Update existing forwarder to route to customer's sGTM:

```typescript
// Get customer's sGTM URL
const sgtmUrl = await db.getCustomerSGTMUrl(customerId);

// Forward event
await fetch(`${sgtmUrl}/g/collect`, {
  method: 'POST',
  body: buildMeasurementProtocolPayload(event)
});
```

---

## Cost Model

| Component | Cost | Who Pays |
|-----------|------|----------|
| Cloud Run (per customer) | ~$10-50/mo depending on traffic | Pass to customer |
| Our GCP Project overhead | ~$10/mo | Us |
| Workers | Minimal | Us |

**Business Model:**
- Include base sGTM in subscription
- Or: Usage-based pricing per 1000 events

---

## Files to Create

```
serverless/src/services/
├── cloud-run-api.ts       # Cloud Run Admin API wrapper
├── sgtm-provisioner.ts    # Provision/manage sGTM instances
└── event-forwarder.ts     # Forward events to customer sGTM

serverless/src/routes/
└── sgtm.ts                # API endpoints for sGTM management
```

---

## Summary

| Question | Answer |
|----------|--------|
| Can we avoid Cloud Run? | No - Google requires it for sGTM |
| Who manages Cloud Run? | **We do** - via Cloud Run API |
| Where does our code run? | Cloudflare Workers |
| What do we interface with? | Cloud Run Admin API |
| Customer setup needed? | Zero - we provision everything |

**We become a managed sGTM provider** - customer just signs up, we handle the rest.

---

## Next Steps

1. Create GCP project & service account
2. Build `cloud-run-api.ts` wrapper
3. Build `sgtm-provisioner.ts` service
4. Add `/api/v1/sgtm/*` routes
5. Test end-to-end provisioning

Want me to start building the Cloud Run API integration?
