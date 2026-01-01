# Strategy Session Summary
**Date:** December 30, 2025

## Current State

### What's Built
| Component | Status | Notes |
|-----------|--------|-------|
| Cloudflare Worker | ✅ Live | https://advocate-cloud.adsengineer.workers.dev |
| GHL Webhook endpoint | ✅ Code exists | Not wired into router yet |
| Waitlist endpoint | ✅ Code exists | Not wired into router yet |
| D1 Database | ✅ Configured | Missing waitlist table |
| GCLID capture script | ❌ Not built | Customer must DIY |
| Google Ads upload | ❌ Not built | The actual value delivery |
| Dashboard | ❌ Not built | No visibility for customers |

### The Gap
We built a **storage layer** but not the **value layer**:
- We receive and store leads with GCLID
- We don't help capture GCLID on landing pages
- We don't upload conversions to Google Ads
- Customer can't see if it's working

---

## Market Reality

### The Value Proposition (When It Works)

| Metric | Without Offline Conversions | With Offline Conversions |
|--------|----------------------------|-------------------------|
| Monthly ad spend | $10,000 | $10,000 |
| Leads generated | 100 | 100 |
| Close rate | 5% (Google optimizes for form fills) | 8-10% (Google optimizes for sales) |
| Customers acquired | 5 | 8-10 |
| Cost per acquisition | $2,000 | $1,000-1,250 |
| **ROAS improvement** | - | **37-50%** |

Source: [Google's own data](https://support.google.com/google-ads/answer/2998031) shows offline conversion imports improve Smart Bidding performance by 20-50% when sufficient volume exists.

### Volume Requirements
Google's Smart Bidding needs **minimum 30 conversions per month** to optimize effectively. Below that threshold, the data is too sparse.

| Agency Size | Monthly Leads | Viable? |
|-------------|---------------|---------|
| Small (1-2 clients) | 20-50 | ⚠️ Marginal |
| Medium (5-10 clients) | 100-300 | ✅ Yes |
| Large (20+ clients) | 500+ | ✅ Definitely |

### Competitive Landscape

| Solution | Price | Complexity |
|----------|-------|------------|
| Zapier + Google Sheets | $50-100/mo | Medium (DIY) |
| LeadsBridge | $29-99/mo | Low |
| HubSpot | $800+/mo | Low (but overkill) |
| WhatConverts | $30-100/mo | Low |
| **Us (current)** | Free? | High (incomplete) |

**Problem:** We're entering a commoditized market with an incomplete product.

---

## Pivot: Hunter + Service Model

### New Approach
Instead of building a SaaS and waiting for customers:

```
n8n Hunter Agent → Scrape GHL agencies → Detect tracking gaps → Cold outreach → Pitch fix
```

### Detectable Signals (From Outside)

| Signal | Detection Method | Indicates |
|--------|------------------|-----------|
| No GCLID persistence | Visit funnel with ?gclid=test, submit form, check if captured | Broken tracking |
| Missing conversion linker | View page source, search for gtag/conversion | No cross-domain tracking |
| No conversion pixel | Check network tab on form submit | Can't track conversions |
| Basic thank you page | No redirect, no events firing | Missed optimization opportunity |
| High ad spend + basic landing | SpyFu/SEMrush data | Money being wasted |

### Outreach Strategy

**What doesn't work:**
> "You're missing tracking data" 
> → Defensive response, ignored

**What works:**
> "I ran your funnel and found your Google Ads can't see which leads become sales. Takes 10 minutes to fix. Free setup, you pay $X per lead I help you track."
> → Specific, actionable, low-risk

### Proposed Deal Structure

| Phase | What Happens | Cost to Customer |
|-------|--------------|------------------|
| **Audit** | Automated funnel check, send report | Free |
| **Setup** | 10-30 min GHL workflow + our webhook | Free |
| **Trial** | 30 days of tracking | Free |
| **Payment** | Per-lead or flat monthly | $1-2/lead or $99-199/mo |

### Revenue Math

| Scenario | Customers | Leads/mo each | Total leads | Revenue (@ $1.50/lead) |
|----------|-----------|---------------|-------------|------------------------|
| Starting | 10 | 100 | 1,000 | $1,500/mo |
| Growth | 50 | 100 | 5,000 | $7,500/mo |
| Scale | 200 | 100 | 20,000 | $30,000/mo |

Alternative flat-fee model:
| Customers | Monthly fee | Revenue |
|-----------|-------------|---------|
| 50 | $99 | $4,950/mo |
| 100 | $149 | $14,900/mo |
| 200 | $149 | $29,800/mo |

---

## What Actually Needs Building

### Priority 1: Hunter Agent (n8n)
The lead gen is more valuable than the product right now.

- [ ] Scrape GHL agency directories
- [ ] Visit their funnels automatically
- [ ] Detect tracking gaps
- [ ] Generate audit reports
- [ ] Queue for outreach

### Priority 2: Dead-Simple Setup
Reduce friction to near-zero.

- [ ] One webhook URL (already have this)
- [ ] 5-minute GHL workflow template
- [ ] Copy-paste GCLID capture script

### Priority 3: Proof of Value
Show customers it's working.

- [ ] Simple stats endpoint: "47 leads tracked, 31 with GCLID"
- [ ] Weekly email summary
- [ ] NOT a full dashboard (yet)

### Priority 4 (Later): Full Automation
Only after proving the model.

- [ ] Google Ads OAuth
- [ ] Automatic conversion upload
- [ ] Dashboard

---

## Key Decisions

1. **Product → Service pivot**: The n8n hunter + manual outreach is the business, the tracking tool is the deliverable.

2. **Free-first model**: Audit free, setup free, trial free. Pay only after value proven.

3. **Per-lead vs flat fee**: Per-lead aligns incentives but requires trust. Flat fee is simpler. Test both.

4. **Build the hunter first**: The tracking webhook already works. The bottleneck is finding customers who need it.

---

## Next Steps

1. Finish wiring the webhook routes (30 min)
2. Create GCLID capture snippet (1 hour)
3. Build n8n hunter workflow (primary focus)
4. Create audit report template
5. Start outreach, learn from responses, iterate
