# sGTM Customer Setup Flow Analysis

**Date:** 2026-01-17
**Source:** https://developers.google.com/tag-platform/tag-manager/server-side/manual-setup-guide

---

## Summary

Yes, you're correct. Each customer must:

1. Go to `tagmanager.google.com`
2. Create a **Server container** (not a web container)
3. Get the **Container Config** string
4. Deploy the Docker image to their infrastructure (Cloud Run, App Engine, or self-hosted)
5. Provide us with their **Server Container URL**

---

## Customer Setup Steps

### Step 1: Create Server Container in GTM

```
tagmanager.google.com → Create Account → Create Container → Choose "Server" type
```

### Step 2: Get Container Config

```
In GTM → Click container ID (top-right) → "Manually provision tagging server"
→ Copy the CONTAINER_CONFIG string
```

This is a long encoded string that contains their container configuration.

### Step 3: Deploy Infrastructure

Customer must deploy **TWO** components:

| Component | Purpose | Scaling |
|-----------|---------|---------|
| **Preview Server** | For debugging/preview mode | Exactly 1 instance (no autoscaling) |
| **SST Cluster** | Handles actual tagging requests | Autoscale as needed |

#### Docker Commands

**Preview Server:**
```bash
docker run -p 8080:8080 \
  -e CONTAINER_CONFIG='<config string>' \
  -e RUN_AS_PREVIEW_SERVER=true \
  gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable
```

**Tagging Server (SST Cluster):**
```bash
docker run -p 8080:8080 \
  -e CONTAINER_CONFIG='<config string>' \
  -e PREVIEW_SERVER_URL='https://preview.customer.com' \
  gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable
```

### Step 4: Configure Custom Domain

Customer sets up HTTPS URL pointing to their SST cluster:
- Best practice: Same origin as website (e.g., `example.com/analytics`)
- Alternative: Subdomain (e.g., `gtm.example.com`)

### Step 5: Provide URL to AdsEngineer

Customer gives us:
- **Server Container URL** (e.g., `https://gtm.customer.com`)
- **Measurement ID** (e.g., `G-XXXXXXX`) - from their GA4 property

---

## What We Store (per customer)

```json
{
  "sgtm_config": {
    "container_url": "https://gtm.customer.com",
    "measurement_id": "G-XXXXXXX",
    "api_secret": "optional-for-enhanced-measurement"
  }
}
```

---

## What We Send (to customer's sGTM)

```http
POST https://gtm.customer.com/g/collect
Content-Type: application/x-www-form-urlencoded

v=2&tid=G-XXXXXXX&cid=123.456&en=purchase&ep.transaction_id=ORD-123&epn.value=99.99&ep.currency=USD
```

---

## Customer's Responsibility (in GTM)

After deployment, customer configures in their GTM Server Container:

1. **Add Measurement Protocol Client** - Receives our server-to-server requests
2. **Create Triggers** - Fire on event names (`purchase`, `add_to_cart`, etc.)
3. **Add Tags** - One per destination:
   - GA4 Tag → Google Analytics
   - Google Ads Conversion Tag → Google Ads
   - Meta CAPI Tag → Facebook
   - TikTok Events API Tag → TikTok

---

## Deployment Options for Customer

| Option | Cost | Complexity | Recommendation |
|--------|------|------------|----------------|
| **Cloud Run** | ~$45/mo | Low (auto-provisioned) | ✅ Recommended |
| **App Engine** | ~$50/mo | Medium | Alternative |
| **Self-hosted Docker** | Variable | High | For enterprise |

Cloud Run setup is nearly automated via GTM UI.

---

## Friction Points for Customers

1. **Technical knowledge required** - Docker, Cloud Run, DNS configuration
2. **Cost** - ~$45/month for Cloud Run
3. **Two deployments** - Preview server + SST cluster
4. **Custom domain setup** - SSL certificate, DNS records
5. **GTM configuration** - Must add clients, triggers, tags manually

---

## Alternative: Reduce Friction

### Option A: We Provide Setup Guide + Support
- Detailed docs with screenshots
- Video walkthrough
- Support during onboarding

### Option B: We Host Shared sGTM (Multi-tenant)
- We run the infrastructure
- Customers just provide GA4/Ads credentials
- We configure tags programmatically via GTM API
- **Downside:** We bear infrastructure cost, complex multi-tenant isolation

### Option C: Direct GA4 Measurement Protocol (No sGTM)
- Skip sGTM entirely for simple use cases
- Send directly to `google-analytics.com/mp/collect`
- **Downside:** Only GA4, no Google Ads/Meta/TikTok without separate integrations

---

## Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| `sgtm-forwarder.ts` | ✅ Done | Sends to customer's sGTM |
| DB schema (`sgtm_config`) | ✅ Done | Migration 0020 |
| Site setup endpoint | ✅ Done | Returns setup instructions |
| Customer-facing docs | ❌ Missing | Need step-by-step guide |
| GTM API integration | ❌ Missing | Could automate tag setup |

---

## Recommended Next Step

Create customer-facing documentation with:
1. Step-by-step Cloud Run deployment guide (with screenshots)
2. GTM Server Container configuration guide
3. How to add Measurement Protocol Client
4. How to configure triggers and tags
5. Testing/validation checklist
