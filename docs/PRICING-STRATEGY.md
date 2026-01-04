# Hybrid Business Model: Self-Service SaaS + White-Label Platform

**Updated:** January 2026
**Status:** Strategy Ready for Implementation

---

## Executive Summary

AdsEngineer is positioned as a **hybrid offering** combining:
- **Self-Service SaaS** (90% of go-to-market): Direct businesses, small agencies, solo practitioners
- **White-Label Platform** (10% of go-to-market): Mid-to-large agencies, high-touch partnerships

Our value proposition centers on **eliminating 20-30% conversion data loss** through server-side tracking. Pricing reflects the high ROI agencies achieve with proper attribution.

---

## Pricing Philosophy

### Value-Based Pricing
- Agencies lose 20-30% of conversion data with client-side tracking
- Average agency processes 1,000-10,000 leads/month
- Cost per lead: $50-500 depending on service
- **Data loss = $10,000-50,000/month revenue impact**

**Our Solution:**
- Restores full conversion visibility
- Enables data-driven optimization
- Reduces customer acquisition cost by 20-50%
- Price point: 5-10% of data loss value = clear ROI

---

## Pricing Tiers

### 🎯 Standard - $99/month
**Target:** Self-service for direct businesses & small agencies (1-5 employees, <1K leads/month)

**Includes:**
- Basic conversion tracking setup
- Google Ads integration
- GCLID preservation
- 1 website connection
- Email support
- Standard analytics dashboard
- Unlimited conversions

**Value:** Prevents $5,000-25,000/month in lost revenue

**Use Cases:**
- Dental practices
- Legal firms
- HVAC contractors
- Solo agency owners
- Technical founders managing their own ads

---

### 🚀 Premium - $249/month
**Target:** Growing businesses & agencies (5-20 employees, 1K-10K leads/month)

**Includes:**
- Advanced conversion tracking
- Multi-platform integration (Google, Facebook, TikTok)
- Priority email/phone support
- Advanced analytics dashboard
- Custom analytics dashboard
- API access
- 5 website connections
- Lead quality scoring
- White-label option

**Value:** Prevents $25,000-100,000/month in lost revenue

**Use Cases:**
- Growing local businesses
- Agencies managing multiple small clients
- E-commerce stores with multiple locations
- Lead generation teams

---

### 🏆 Agency - $499/month
**Target:** Agencies (20+ employees, 10K+ leads/month)

**Includes:**
- Unlimited conversion tracking
- All platform integrations
- Dedicated success manager
- Custom integrations and workflows
- Unlimited API access
- Advanced API access
- Unlimited website connections
- White-label dashboard
- Multi-site dashboards
- Agency billing (sub-accounts for clients)
- Custom reporting and dashboards
- SLA guarantee (99.9% uptime)
- Priority onboarding and training

**Value:** Prevents $100,000-500,000/month in lost revenue

**Use Cases:**
- Mid-to-large agencies
- Agencies wanting to resell under own brand
- White-label deployment
- Custom integration requirements

---

## White-Label Options

### Per-Site Licensing
**Structure:**
- €50-100/site/month
- Minimum 10 sites for enterprise pricing
- Volume discounts available

**Billing Models:**

| Model | Pricing | Best For | Margin |
|--------|----------|-----------|---------|
| **Fixed Per Site** | €100/site | Predictable revenue | 65% |
| **Volume Tiered** | 50+ @ €50/site, 100+ @ €40/site | Large agencies | 70-75% |
| **Revenue Share** | 15-20% of recovered spend | Partnerships | 60-80% |

**White-Label Features:**
- Branded login portal (*.agency.adsengineer.cloud)
- Custom CSS/logo injection
- Agency manages billing to their clients
- Agency handles onboarding
- Agency provides support
- We provide infrastructure

---

## Customer Login System

### Authentication Flow

```
[User] → Login Page → Choose Account Type → [Direct] or [Agency]

[Direct Account]
├── Single-brand dashboard
├── Connect their own data sources
├── Manage their integrations
└── Pay subscription

[Agency Account]
├── Multi-client dashboard
├── White-label under agency brand
├── Sub-account management
├── Client billing (agency bills us, we bill clients)
└── Agency manages support
```

### Login Experience

**Direct Business Login:**
- Email/password authentication
- SSO options (Google, Microsoft)
- 2FA for security
- Single-brand dashboard (`app.adsengineer.cloud`)

**Agency Login:**
- Agency credential authentication
- Sub-domain access (`agency-name.adsengineer.cloud`)
- Switch between agency view and client views
- Client impersonation (for support)
- White-label theming control

### Account Tiers

| Account Type | Login Domain | Dashboard | Features |
|--------------|---------------|-----------|-----------|
| **Direct** | `app.adsengineer.cloud` | Single-brand | Full self-service control |
| **Agency** | `*.adsengineer.cloud` | Multi-client, white-label | Resell rights, client billing |
| **Enterprise** | `partner.adsengineer.cloud` | Dedicated subdomain | Custom integrations, priority support |

---

## Multitenancy Architecture

### Subdomain Structure

```
adsengineer.cloud (main domain)
├── app.adsengineer.cloud          [Direct businesses]
├── api.adsengineer.cloud           [API endpoints]
├── docs.adsengineer.cloud          [Documentation]
├── *.adsengineer.cloud              [Agency subdomains]
│   ├── agency-name-1.adsengineer.cloud
│   ├── agency-name-2.adsengineer.cloud
│   └── ...
└── partner.adsengineer.cloud        [Enterprise partners]
```

### Tenant Isolation

**Database Schema:**
- `tenants` table: `id`, `subdomain`, `brand_config`, `billing_plan`, `created_at`
- Each tenant isolated database
- Row-level security (tenant_id on all queries)
- Rate limiting per tenant
- Storage quotas per plan

**White-Label Configuration:**
```typescript
interface TenantBrandConfig {
  logo_url: string;
  primary_color: string;
  custom_css?: string;
  custom_domain?: string;
  hide_adsengineer_branding: boolean;
  support_email: string;
  billing_contact: string;
}
```

---

## Hybrid Go-to-Market Strategy

### Entry Points

| Customer Type | Primary CTA | Secondary CTA | Onboarding Friction |
|---------------|---------------|-----------------|---------------------|
| **SMB Direct** | "Get Started in 5 Minutes" | View Demo Video | Low |
| **Small Agency** | "Book Agency Demo" | "Resell Under Your Brand" | Medium |
| **Enterprise** | "Contact Sales Team" | "Read Partnership Case Study" | High |

### Hero Messaging

**For Direct/Small:**
```
"When Tracking Breaks, Performance Dies

AdsEngineer connects your forms, Shopify and GoHighLevel to Google & Meta, sending real customer value back as offline conversions—so your ads optimize for revenue, not just clicks."

[Get Started - $99/mo] [See How It Works]
```

**For Agencies:**
```
"Scale Client Performance Without the Manual Work

Deploy under your brand. Manage all your clients from one dashboard. We provide the attribution infrastructure; you provide the strategy."

[View Agency Plans - $499/mo] [Book Partnership Demo]
```

### "Who It's For" Cards

All 3 cards retained with updated CTAs:

**Marketing Agencies Card:**
```
Stop reporting clicks, start reporting revenue

• Scale client performance
• Automated optimization
• White-label solution
• Real-time dashboards

[View Agency Plans →]
```

**Dental/Legal/HVAC Cards:**
```
[Same features]

[View Self-Service Plans →]
```

---

## Billing Model

### Subscription Details

**Billing Cycle:** Monthly or Annual (20% discount)
**Free Trial:** 14 days (no credit card required)
**Contract:** Month-to-month, cancel anytime
**Payment Methods:** Credit card, ACH, Wire transfer (annual)

### Usage-Based Elements

| Metric | Standard | Premium | Agency |
|--------|----------|----------|---------|
| **Lead Volume** | Monitored, not limited | Monitored, not limited | Monitored, not limited |
| **Websites** | 1 | 5 | Unlimited |
| **Overage** | $0.10/lead over 10K | Included | Included |
| **API Calls** | 10K/month | 100K/month | Unlimited |
| **Storage** | 1GB | 10GB | Unlimited |

### Agency-Specific Billing

**Sub-Account Structure:**
- Agency pays AdsEngineer for their plan (e.g., $499/mo for 25 sites)
- Agency sets pricing for their clients (resell margin)
- Client billing can be:
  - Through AdsEngineer (agency acts as reseller)
  - Direct to client (agency bills separately)
  - Revenue share model

**Revenue Share Model:**
- Setup fee: $999 one-time (optional)
- Ongoing: 15-20% of recovered ad spend
- Only applies if attribution generates additional revenue
- Agency pays AdsEngineer from recovered value

---

## Competitive Positioning

### Our Differentiators

| Aspect | Competitors | AdsEngineer |
|---------|-------------|--------------|
| **Focus** | Agency optimization services | Data infrastructure platform |
| **Scope** | Campaign management | Attribution + offline conversion upload |
| **Pricing** | Performance-based (expensive) | Fixed subscription (predictable) |
| **Integration** | Manual or generic GHL | Deep GHL + Shopify + WordPress |
| **Control** | We manage your campaigns | We give you data, you decide optimization |
| **Scalability** | Limited by human capacity | Unlimited (software) |

### Why Agencies Choose Us

**1. White-Label Ready**
- Full reseller rights
- Custom domain options
- Agency-managed billing
- Client data ownership

**2. Revenue Share Option**
- Pay only if attribution delivers value
- Aligned incentives
- Lower upfront cost

**3. Multi-Tier Support**
- Start small, scale up
- Upgrade path: Standard → Premium → Agency
- White-label available at any tier

---

## Updated Roadmap

### Phase 1: Core Foundation (Current)
- ✅ WordPress plugin
- ✅ GCLID preservation
- ✅ Basic offline conversion upload
- ✅ Google Ads integration
- ✅ Customer login system
- ✅ Self-service onboarding

### Phase 2: Agency Features (Q2 2025)
- 🔄 Multi-tenant subdomain system
- 🔄 White-label dashboard
- 🔄 Agency billing (sub-accounts)
- 🔄 Advanced analytics
- 🔄 API for custom integrations

### Phase 3: Enterprise (Q3 2025)
- 📋 Custom integrations
- 📋 Dedicated infrastructure
- 📋 SLA guarantees
- 📋 Enterprise support channels
- 📋 Revenue share model

### Phase 4: Advanced Optimization (Q4 2025)
- 📋 Rule-based bid management
- 📋 AI-powered recommendations
- 📋 Cross-platform attribution (Google + Meta + TikTok)
- 📋 Real-time alerts and notifications

---

## Implementation Priorities

### Immediate (Month 1)

1. **Customer Authentication System**
   - Login page with email/password
   - SSO integration (Google, Microsoft)
   - Role-based access (admin, user, viewer)
   - 2FA implementation

2. **Multitenancy Foundation**
   - Tenant database schema
   - Subdomain routing
   - Tenant isolation middleware
   - White-label configuration storage

3. **White-Label Toggle**
   - Admin controls in agency dashboards
   - Brand override (logo, colors, CSS)
   - Custom domain option
   - Hide AdsEngineer branding switch

### Short-Term (Months 2-3)

4. **Agency Billing System**
   - Master account billing
   - Sub-account management
   - Billing transfer options
   - Revenue share tracking
   - Invoice generation

5. **Multi-Site Management**
   - Add/remove sites per tenant
   - Site-level permissions
   - Bulk operations (update all client sites)
   - Site-specific analytics

### Medium-Term (Months 4-6)

6. **Agency Onboarding**
   - Agency setup wizard
   - Migration tools (import clients)
   - White-label configuration guide
   - Agency support documentation
   - Training materials

7. **Advanced Analytics**
   - Multi-client reporting
   - Cross-client comparison
   - Aggregate agency metrics
   - Export capabilities
   - Custom report builder

---

## Success Metrics

### Acquisition Goals (Year 1)

| Metric | Target | Timeline |
|---------|---------|-----------|
| **Direct Customers** | 200 | Q4 2026 |
| **Agency Partners** | 20 | Q4 2026 |
| **White-Label Deployments** | 50 | Q2 2026 |
| **Average Revenue/Customer** | $150/mo | Q4 2026 |

### Retention Goals

- **Direct Churn Rate:** <5% monthly
- **Agency Churn Rate:** <8% monthly (agencies are stickier)
- **Net Revenue Retention:** >100% after 3 months
- **Expansion Revenue:** 30% of customers upgrade tiers annually

---

## Summary

**Bottom Line:**

We're not choosing between self-service OR white-label—we're offering **BOTH paths** into a single product platform.

- **Direct customers** get simplicity, speed, and predictable pricing
- **Agencies** get white-label flexibility, reseller margins, and enterprise features
- **We get** market coverage (80% SMBs via self-service, 20% agencies via partners)

**The dream of high ticket MRR is real—but achieved through platform scalability, not consulting masquerading as SaaS.**
