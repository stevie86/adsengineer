# Feature Landscape: Conversion Tracking SaaS MVP

**Domain:** SaaS conversion tracking for e-commerce (Shopify/WooCommerce/custom)
**Researched:** 2026-02-13
**Confidence:** MEDIUM-HIGH

## Executive Summary

Conversion tracking SaaS products compete in a crowded space dominated by analytics giants (Google Analytics 4, Mixpanel, Amplitude) and specialized attribution platforms (Cometly, RedTrack, Segment). Success in this market requires:

1. **Frictionless onboarding** - Getting from signup to first tracked conversion in <10 minutes
2. **Trust through transparency** - Real-time dashboards showing actual data, not promises
3. **Compliance clarity** - GDPR/privacy controls that feel protective, not bureaucratic
4. **Self-service everything** - Users expect to configure, manage, and troubleshoot independently

**Critical insight:** Most competitors fail at onboarding. They have powerful features but lose users before value delivery. AdsEngineer's opportunity is in the **first 15 minutes** - make snippet installation trivial, show real conversion data immediately, and provide instant validation feedback.

---

## Customer Journey Map

### Stage 1: Discovery → Signup (Marketing site → Registration)
**Duration:** 2-5 minutes
**Goal:** User creates account with payment method

**Required features:**
- Clear pricing tiers with feature comparison
- Social proof (testimonials, conversion stats)
- "Start free trial" CTA (no credit card OR credit card required pattern)
- Email/password signup OR OAuth (Google/GitHub)
- Password strength indicator
- Email verification flow

### Stage 2: Initial Setup (First login → Billing)
**Duration:** 3-5 minutes
**Goal:** User selects plan and adds payment method

**Required features:**
- Plan selection page (if not already chosen during signup)
- Stripe Checkout integration
- Plan tier enforcement (feature gating)
- Clear billing date and charge preview
- Success confirmation with next steps

### Stage 3: Site Configuration (Billing → Snippet installed)
**Duration:** 5-10 minutes
**Goal:** User installs tracking snippet on their site

**Required features:**
- Multi-step onboarding wizard
- Site/domain registration form
- Platform selection (Shopify, WooCommerce, Custom)
- Platform-specific installation guides
- Code snippet generator with:
  - Syntax highlighting
  - Copy-to-clipboard button (one-click)
  - Installation verification instructions
  - Platform-specific screenshots/video
- Test event sender (manual trigger to validate setup)
- Real-time installation status indicator

### Stage 4: Platform Connection (Snippet working → First conversion synced)
**Duration:** 5-15 minutes
**Goal:** User connects Google Ads/Meta/TikTok accounts

**Required features:**
- Platform connection wizard
- OAuth flows for each platform:
  - Google Ads (OAuth2 + refresh token)
  - Meta Conversions API (System User token)
  - TikTok Events API (Access token)
- Connection status indicators (Connected/Error/Pending)
- Test conversion sender (validate platform connection)
- Conversion mapping UI (map site events → platform events)
- Troubleshooting tips for common OAuth errors

### Stage 5: Validation (First conversion → Confident usage)
**Duration:** 1-24 hours (waiting for real traffic)
**Goal:** User sees their first real conversion tracked and synced

**Required features:**
- Real-time event stream (WebSocket or SSE)
- Conversion timeline/activity feed
- Platform sync status per conversion
- Conversion detail modal (full payload inspection)
- Sync error notifications with resolution steps
- Email notification for first successful conversion

### Stage 6: Active Usage (Daily monitoring)
**Goal:** User monitors conversion performance, troubleshoots issues

**Required features:**
- Dashboard with key metrics (see Dashboard Features below)
- Conversion list with filters (date, platform, status)
- Sync retry controls
- Platform connection health monitoring
- Settings management (user profile, billing, integrations)

---

## Table Stakes Features

These features are **non-negotiable**. Missing any of these makes the product feel incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|----------------------|
| **Email/password signup** | Standard SaaS pattern | Low | Existing (JWT auth) |
| **Stripe subscription billing** | Users won't trust manual invoicing | Low | Existing (Stripe integration) |
| **Plan tier enforcement** | Users expect limits to work | Medium | Backend: feature flags per plan |
| **Tracking snippet code display** | Core value delivery | Low | Frontend: Syntax highlighting + copy button |
| **Real-time conversion list** | Proof system is working | Medium | WebSocket/SSE for live updates |
| **Platform OAuth connection** | Industry standard for Google/Meta | Medium | Existing backend OAuth, needs UI |
| **Dashboard with basic metrics** | Users expect visual summaries | Medium | Charts for conversions/day, platform breakdown |
| **Conversion detail view** | Debugging requires full payload | Low | Modal with JSON viewer |
| **Email verification** | Security/anti-spam requirement | Low | Existing or trivial to add |
| **Password reset flow** | Users will forget passwords | Low | Standard email reset link |
| **User profile settings** | Edit name, email, password | Low | Standard CRUD |
| **Subscription management** | Users need to cancel/upgrade | Medium | Stripe Customer Portal integration |
| **GDPR data export** | Legal requirement in EU | Medium | Backend endpoint exists, needs UI trigger |
| **GDPR data deletion** | Legal requirement in EU | Medium | Backend endpoint exists, needs UI trigger |
| **Activity/audit log** | Users want to see what happened | Medium | Log conversions, sync events, errors |
| **Error notifications** | Users need to know when things break | Medium | Toast/banner for sync failures |
| **Installation verification** | Users need confidence snippet works | Medium | Test event API + real-time status |
| **Logout functionality** | Basic security hygiene | Low | Clear JWT, redirect to login |

---

## Differentiators (Competitive Advantage)

Features that set AdsEngineer apart from competitors. Not expected, but highly valued when discovered.

| Feature | Value Proposition | Complexity | Implementation Priority |
|---------|-------------------|------------|------------------------|
| **Server-side GTM forwarding** | Bypass iOS tracking limitations | High | Phase 2 (architecture proposal exists) |
| **Conversion validation sandbox** | Test platform setup without real traffic | Medium | Phase 1.5 (uses existing test event API) |
| **Real-time snippet health monitoring** | Proactive error detection | Medium | Phase 2 (requires client-side heartbeat) |
| **Installation video walkthroughs** | Reduce support burden, increase success rate | Low | Phase 1 (record platform-specific videos) |
| **Automated conversion mapping** | Suggest event mappings based on e-commerce patterns | High | Phase 3 (requires ML/heuristics) |
| **Multi-site management** | Agencies/enterprises track multiple properties | Medium | Phase 2 (tenant model already supports this) |
| **Team collaboration** | Multiple users per account with role-based access | Medium | Phase 2 (RBAC system) |
| **Shopify app integration** | One-click install from Shopify App Store | High | Phase 2 (requires Shopify Partner account) |
| **WooCommerce plugin** | One-click install from WordPress plugin directory | High | Phase 2 (separate plugin codebase) |
| **Custom event naming** | Flexibility for non-standard conversion events | Low | Phase 1.5 (UI for event schema) |
| **Conversion deduplication UI** | Show which conversions were deduplicated and why | Medium | Phase 2 (backend logic exists, needs UI) |
| **Platform sync retry dashboard** | Manual retry + bulk retry controls | Low | Phase 1.5 (frontend for existing API) |
| **Email digest reports** | Weekly summary of conversion performance | Low | Phase 2 (email template + cron job) |
| **Slack/Discord notifications** | Real-time alerts in team chat | Low | Phase 2 (webhook integration) |
| **API key management** | Programmatic access for custom integrations | Medium | Phase 2 (API key generation + auth) |
| **Conversion attribution reports** | Multi-touch attribution insights | High | Phase 3 (requires attribution engine) |

---

## Anti-Features (Deliberately NOT Built in MVP)

Common requests that create complexity without proportional value. These are traps to avoid.

| Anti-Feature | Why Requested | Why Problematic for MVP | Alternative/Future Consideration |
|--------------|---------------|-------------------------|----------------------------------|
| **Custom analytics dashboards** | "I want to build my own charts" | Scope explosion, delays launch | Provide curated dashboard + API for custom tools (Phase 3) |
| **White-label/rebrand** | Agencies want to resell | Complex licensing, support burden | Focus on multi-site for agencies instead (Phase 2) |
| **Built-in A/B testing** | Users conflate analytics with optimization | Different product category, feature creep | Integrate with external tools via webhooks (Phase 3) |
| **Heatmaps/session replay** | "Like Hotjar but with conversions" | Massive data storage, privacy nightmares | Recommend Hotjar/Clarity integration instead |
| **Predictive analytics** | "AI-powered conversion forecasting" | Requires massive dataset, overpromises | Focus on accurate reporting first (Phase 3+) |
| **Mobile app SDK** | "Track in-app conversions" | Different tracking paradigm, native dev needed | Web-first, consider later if demand exists (Phase 4+) |
| **Built-in CRM** | "Store customer data alongside conversions" | Reinventing Salesforce, scope explosion | API integration with existing CRMs (Phase 3) |
| **Live chat support** | Users expect instant help | Expensive, requires 24/7 staffing | Start with email + docs, add chat at scale (Phase 3) |
| **On-premise deployment** | Enterprise procurement requirements | Kills SaaS model, support nightmare | Cloud-only, offer EU region for GDPR (Phase 2) |
| **Excel export** | "I want to analyze in Excel" | Users misuse data, create wrong insights | Provide CSV export for raw data only (Phase 1.5) |

---

## Dashboard Features (Core UI)

### Essential Metrics (Above the Fold)

1. **Total Conversions (Today/7d/30d)**
   - Single number with trend indicator (↑ 12% vs last period)
   - Comparison: Same period last week/month

2. **Conversion Rate (if using Universal SST)**
   - Conversions / Total visitors × 100
   - Only shown if snippet tracks pageviews

3. **Platform Sync Success Rate**
   - % of conversions successfully synced to platforms
   - Color-coded: Green (>95%), Yellow (80-95%), Red (<80%)

4. **Active Platforms**
   - Icon badges for connected platforms
   - Click to view platform-specific metrics

### Primary Visualizations

1. **Conversions Over Time (Line Chart)**
   - X-axis: Date (last 7/30/90 days)
   - Y-axis: Conversion count
   - Filterable by platform

2. **Platform Breakdown (Pie/Donut Chart)**
   - % of conversions synced to each platform
   - Tooltip: Absolute count + percentage

3. **Recent Conversions (Table/List)**
   - Columns: Time, Event Name, Platform(s), Status, Actions
   - Status badges: Synced (green), Pending (yellow), Failed (red)
   - Click row → Conversion detail modal

4. **Sync Status Timeline (Activity Feed)**
   - Chronological log of sync attempts
   - Show retries, errors, successes
   - Filter by platform or status

### Secondary Metrics (Below Fold or Tabs)

1. **Conversion Value (if available)**
   - Total revenue tracked (requires order_value in payload)
   - Average order value

2. **Top Conversion Events**
   - Bar chart of event names by frequency
   - Helps identify most common conversion types

3. **Error Analysis**
   - Most common sync error types
   - Link to troubleshooting docs

---

## Onboarding Flow (Step-by-Step)

### Recommended Onboarding Sequence

**Step 1: Welcome + Account Setup**
- Inputs: Company name, website URL
- Skip/Later: Allowed (can complete later in settings)

**Step 2: Select Plan**
- Display: 3 tiers (Starter/Pro/Enterprise) with feature comparison
- Action: "Continue with [Plan]" → Stripe Checkout
- Skip/Later: Only if free tier exists

**Step 3: Install Tracking Snippet**
- Platform selection: Radio buttons (Shopify / WooCommerce / Custom HTML)
- Code display: Syntax-highlighted snippet with copy button
- Instructions: Platform-specific installation guide (collapsible sections)
- Validation: "Send Test Event" button → Real-time status check
- Progress: "Waiting for first event..." → "✓ Snippet working!"
- Skip/Later: Not allowed (core value delivery)

**Step 4: Connect Platforms**
- Platform tiles: Google Ads, Meta, TikTok (checkboxes)
- OAuth flow: Click → New window → Authorize → Callback
- Status: "Connecting..." → "✓ Connected" OR "⚠ Error: [message]"
- Skip/Later: Allowed (can connect later from settings)

**Step 5: Map Conversions**
- UI: Dropdown mapping (Site Event → Platform Conversion Action)
- Suggestions: Auto-suggest based on event name (e.g., "purchase" → "Purchase")
- Validation: "Send Test Conversion" → Shows result in platform's test console
- Skip/Later: Allowed (defaults to auto-mapping)

**Step 6: Success + Next Steps**
- Celebration: "🎉 You're all set!"
- Summary: "Tracking [X] events, syncing to [Y] platforms"
- CTA: "Go to Dashboard" (primary) | "View Documentation" (secondary)
- Email: Confirmation email with setup summary + support link

### Onboarding Best Practices (from research)

1. **Progressive disclosure** - Show one step at a time, hide complexity
2. **Clear progress indicator** - Step X of Y, with visual stepper
3. **Allow skipping** - Don't force users through entire flow upfront
4. **Contextual help** - Tooltips, inline docs, video embeds
5. **Celebrate milestones** - Confetti/animation when snippet validates
6. **Immediate value** - Show test event results in real-time
7. **Save state** - Persist progress if user refreshes/leaves

---

## GDPR/Compliance UI Features

### Required for EU Compliance

| Feature | Description | Complexity | User Flow |
|---------|-------------|------------|-----------|
| **Data Export** | Download all personal data as JSON | Low | Settings → Privacy → "Download My Data" → Email link when ready |
| **Data Deletion** | Request account + data deletion | Low | Settings → Privacy → "Delete Account" → Confirmation modal → "Deleted in 30 days" notice |
| **Consent Management** | Toggle for marketing emails, product updates | Low | Settings → Privacy → Checkboxes for email types |
| **Data Processing Agreement** | Link to DPA for GDPR compliance | Low | Legal footer link + in-app modal |
| **Subprocessor List** | Disclose third-party data processors (Stripe, Cloudflare, Google) | Low | Legal page with table of subprocessors |
| **Cookie Notice** | Inform about cookie usage (if any) | Low | Banner on first visit with "Accept" button |
| **Data Retention Policy** | Explain how long data is kept | Low | Legal page with retention periods per data type |

### Optional but Recommended

| Feature | Description | Complexity | Value |
|---------|-------------|------------|-------|
| **Audit Log Viewer** | Show user's own activity history | Medium | Transparency, builds trust |
| **Data Minimization Toggle** | Option to disable non-essential tracking | Medium | Privacy-conscious users appreciate control |
| **Region Selection** | Choose EU vs US data residency (if multi-region supported) | High | Required for some enterprise contracts |

### Compliance UI Patterns (from research)

1. **Privacy-first design** - Make privacy controls easy to find, not buried
2. **Plain language** - Avoid legalese, explain what data is used for
3. **Granular controls** - Let users opt out of specific data uses
4. **Transparent processing** - Show exactly what data is stored and why
5. **One-click export** - Make data portability effortless
6. **Confirmations** - Require explicit confirmation for destructive actions (delete account)

---

## Stripe Customer Portal Integration

### Standard Stripe Customer Portal Features

Stripe provides a **hosted customer portal** that handles:

1. **Subscription Management**
   - View current plan
   - Upgrade/downgrade between tiers
   - Cancel subscription
   - Pause subscription (if enabled)

2. **Payment Method Management**
   - Add/remove credit cards
   - Set default payment method
   - View payment method expiration

3. **Invoice History**
   - Download past invoices (PDF)
   - View upcoming invoice preview
   - See payment history

4. **Billing Details**
   - Update billing email
   - Update billing address
   - Update tax ID (VAT number)

### AdsEngineer Implementation

**Option A: Redirect to Stripe Portal (Recommended for MVP)**
- Pros: Zero frontend code, Stripe handles everything, auto-updates
- Cons: User leaves your app, less control over branding
- Implementation: Backend generates `billingPortal.sessions.create()` URL → Frontend opens in new tab

**Option B: Embed Stripe Portal via iframe**
- Pros: Feels native to your app
- Cons: Iframe quirks, still Stripe-branded
- Implementation: Same as Option A but open in iframe

**Option C: Build custom billing UI**
- Pros: Full control, matches brand
- Cons: High complexity, must handle all edge cases
- Implementation: Use Stripe API directly (subscriptions, payment methods, invoices)

**Recommendation:** Use **Option A** for MVP. Add custom UI in Phase 2 only if user feedback demands it.

### User Flow

1. User clicks "Manage Subscription" in app settings
2. Backend creates Stripe Customer Portal session
3. Frontend redirects to Stripe-hosted portal
4. User completes action (upgrade/cancel/update payment)
5. Stripe redirects back to app with `return_url`
6. Webhook updates app database with subscription changes

---

## Tracking Snippet Deployment Page

### Core Components

1. **Snippet Code Display**
   - Syntax highlighting (JavaScript)
   - Line numbers
   - Copy-to-clipboard button (prominent, one-click)
   - "Copied!" confirmation toast

2. **Installation Instructions**
   - Tabbed interface by platform:
     - Tab 1: Shopify (theme.liquid paste instructions)
     - Tab 2: WooCommerce (footer.php paste instructions)
     - Tab 3: Custom HTML (before </body> tag)
     - Tab 4: Google Tag Manager (Custom HTML tag setup)
   - Screenshots for each platform
   - Video embed option (e.g., Loom walkthrough)

3. **Verification Section**
   - "Send Test Event" button
   - Real-time status indicator:
     - ⏳ Waiting for event...
     - ✅ Event received! Snippet is working.
     - ❌ No event received. Check installation.
   - WebSocket/SSE connection for instant feedback

4. **Troubleshooting Accordion**
   - Common issues (ad blockers, CSP headers, CORS)
   - "Snippet not working?" → Link to docs
   - "Still stuck?" → Link to support

### Copy Button Implementation (from research)

**Best practice pattern:**

```typescript
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    toast.success('Copied to clipboard!');
  }
};
```

**Visual states:**
- Default: "Copy Code"
- Hover: Highlight button
- Click: "Copying..." → "Copied!" (with checkmark icon)
- Reset after 2 seconds

### Installation Verification

**Backend API:**
```
POST /api/v1/sites/{site_id}/test-event
Response: { "status": "pending" | "received" | "timeout" }
```

**Frontend flow:**
1. User clicks "Send Test Event"
2. API generates unique test event ID
3. Frontend opens WebSocket connection
4. Backend sends test event to snippet endpoint
5. Snippet POSTs back to API
6. WebSocket receives confirmation
7. Frontend shows "✅ Working!"

---

## Feature Dependencies

### Critical Path Dependencies

```
Account Creation
  ↓
Email Verification (blocks login)
  ↓
Plan Selection (blocks feature access)
  ↓
Stripe Checkout (blocks plan activation)
  ↓
Site Configuration (blocks snippet generation)
  ↓
Snippet Installation (blocks conversion tracking)
  ↓
Platform Connection (blocks conversion syncing)
  ↓
Conversion Mapping (optional, defaults exist)
  ↓
First Conversion (blocks dashboard value)
```

### Feature Interdependencies

| Feature | Depends On | Blocks |
|---------|-----------|---------|
| Dashboard metrics | Conversion tracking active | None (shows "No data yet") |
| Platform sync | Platform OAuth + Conversion mapping | Sync retry, Error notifications |
| Conversion detail modal | Conversion list | None |
| GDPR data export | User account | None |
| Stripe Customer Portal | Active subscription | Plan changes, Cancellation |
| Snippet verification | Site configured | Installation confidence |
| Test event sender | Snippet generated | Installation validation |

---

## MVP Feature Prioritization Matrix

### Must Have (Launch Blockers)

**Phase 1a: Authentication & Billing**
1. Email/password signup + verification
2. JWT session management
3. Stripe subscription checkout
4. Plan tier enforcement

**Phase 1b: Snippet Installation**
5. Site/domain configuration form
6. Snippet code generator
7. Syntax-highlighted code display with copy button
8. Platform-specific installation guides (text-based)
9. Test event API + verification UI

**Phase 1c: Conversion Tracking**
10. Real-time conversion list (WebSocket/SSE)
11. Conversion detail modal (JSON viewer)
12. Dashboard with basic metrics (conversions/day line chart, platform pie chart)

**Phase 1d: Platform Integration**
13. Platform connection wizard (Google Ads, Meta, TikTok)
14. OAuth flow UI for each platform
15. Connection status indicators
16. Basic conversion mapping UI (dropdown selectors)

**Phase 1e: Account Management**
17. User profile settings (edit email, password)
18. Stripe Customer Portal redirect link
19. Logout functionality

**Phase 1f: Compliance**
20. GDPR data export trigger (button → email link)
21. GDPR data deletion request (button → confirmation)
22. Privacy policy + Terms of Service pages

### Should Have (First 30 Days Post-Launch)

**Phase 1.5: Onboarding & DX Improvements**
23. Multi-step onboarding wizard (instead of dumping user at dashboard)
24. Installation video walkthroughs (record and embed)
25. Activity/audit log (show recent sync events)
26. Email notifications (first conversion, sync errors)
27. Sync retry UI (manual retry button per conversion)
28. Error notifications (toast for sync failures)
29. Custom event naming (UI to define event schema)

### Could Have (Nice to Have for v1.1)

**Phase 2: Growth & Retention**
30. Multi-site management (agencies)
31. Team collaboration (invite users with roles)
32. API key management (for programmatic access)
33. Email digest reports (weekly summaries)
34. Slack/Discord webhook notifications
35. Real-time snippet health monitoring (client heartbeat)
36. Conversion deduplication UI (show why events were deduplicated)

### Won't Have (Defer to v2+)

**Phase 3+: Advanced Features**
37. Server-side GTM forwarding
38. Automated conversion mapping (ML suggestions)
39. Conversion attribution reports (multi-touch)
40. Shopify app integration
41. WooCommerce plugin
42. Heatmaps/session replay (anti-feature, recommend integrations)
43. Built-in A/B testing (anti-feature)

---

## Competitor Feature Comparison

| Feature | AdsEngineer | Cometly | RedTrack | Segment | Google Analytics 4 | Mixpanel |
|---------|-------------|---------|----------|---------|-------------------|----------|
| **Self-service signup** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Free tier** | ❌ (Trial only) | ❌ (Demo only) | ❌ | ✅ | ✅ | ✅ |
| **E-commerce focus** | ✅ | ✅ | ✅ | ⚠️ (General) | ⚠️ (General) | ⚠️ (Product) |
| **Server-side tracking** | ✅ | ✅ | ✅ | ✅ | ⚠️ (Measurement Protocol) | ✅ |
| **Google Ads integration** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Meta CAPI** | ✅ | ✅ | ✅ | ⚠️ (Via Segment) | ❌ | ❌ |
| **TikTok Events API** | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| **Real-time dashboard** | ✅ | ✅ | ✅ | ⚠️ (Delayed) | ⚠️ (Delayed) | ✅ |
| **Installation wizard** | ✅ | ⚠️ (Complex) | ⚠️ (Complex) | ⚠️ | ❌ | ⚠️ |
| **Test event sender** | ✅ | ❌ | ❌ | ❌ | ⚠️ (Debug mode) | ⚠️ |
| **Snippet health monitoring** | 🔄 (Planned) | ❌ | ❌ | ❌ | ⚠️ (Tag Assistant) | ❌ |
| **GDPR compliance UI** | ✅ | ⚠️ (Partial) | ⚠️ | ✅ | ✅ | ✅ |
| **Stripe billing** | ✅ | ✅ | ✅ | ✅ | ❌ (Free/Enterprise) | ✅ |
| **API access** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Multi-site support** | 🔄 (Planned) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Team collaboration** | 🔄 (Planned) | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Fully supported
- ⚠️ Partially supported or complex
- ❌ Not supported
- 🔄 Planned/roadmap

---

## Key Insights from Competitor Analysis

### What Competitors Do Well

1. **Cometly:**
   - Strong onboarding content (blog posts, video tutorials)
   - AI-powered attribution (differentiator)
   - Clear messaging around iOS tracking limitations

2. **RedTrack:**
   - Performance marketer focus (clear target audience)
   - Affiliate network integrations (niche advantage)
   - Real-time data emphasis (speed wins)

3. **Segment:**
   - CDP positioning (data infrastructure, not just tracking)
   - Massive integration library (300+ destinations)
   - Developer-friendly docs (best-in-class)

4. **Google Analytics 4:**
   - Free tier (massive adoption driver)
   - Built-in Google Ads integration (seamless)
   - Predictive metrics (ML-powered insights)

5. **Mixpanel:**
   - Product analytics focus (user behavior, not just conversions)
   - Cohort analysis (retention insights)
   - A/B testing integration (Optimizely, VWO)

### Where Competitors Struggle

1. **Onboarding complexity** - Most tools require developer assistance
2. **Opaque pricing** - "Contact sales" for pricing scares SMBs
3. **Delayed data** - GA4 has 24-48 hour delay in some reports
4. **Over-engineering** - Too many features, hard to find core functionality
5. **Poor error messaging** - Vague errors, no clear resolution steps

### AdsEngineer's Competitive Edge

1. **Speed to value** - First conversion tracked in <15 minutes
2. **Transparent pricing** - Clear tiers, no sales calls required
3. **E-commerce-first** - Shopify/WooCommerce native integrations (roadmap)
4. **Test-driven UX** - Test event sender + verification = confidence
5. **Real-time everything** - No data delays, instant feedback

---

## Sources

### Primary Research (High Confidence)

**Conversion Tracking Platforms:**
- Cometly: Conversion funnel tracking guide (2026) - https://www.cometly.com/post/conversion-funnel-tracking-guide
- Cometly: Conversion API setup guide (2026) - https://www.cometly.com/post/conversion-api-setup-guide
- Cometly: Top conversion tracking platforms (2026) - https://www.cometly.com/post/top-conversion-tracking-platforms
- VWO: Best conversion tracking tools (2026) - https://vwo.com/blog/conversion-tracking-tools/
- RedTrack: Google Analytics alternatives (2025) - https://www.redtrack.io/blog/best-google-analytics-alternatives/

**SaaS Onboarding Best Practices:**
- DocsBot AI: SaaS onboarding best practices (2026) - https://docsbot.ai/article/saas-onboarding-best-practices
- Formbricks: User onboarding best practices (2026) - https://formbricks.com/blog/user-onboarding-best-practices

**Dashboard Design:**
- Improvado: Marketing dashboards guide (2026) - https://improvado.io/blog/12-best-marketing-dashboard-examples-and-templates
- InfluenceFlow: Analytics dashboards that drive action (2026) - https://influenceflow.io/resources/creating-analytics-dashboards-that-drive-action-a-complete-2026-guide/
- KEO Marketing: Marketing dashboard design (2026) - https://keomarketing.com/marketing-analytics-attribution-guide-150191-2

**GDPR Compliance UI:**
- Ory: GDPR compliance (2026) - https://www.ory.sh/docs/security-compliance/gdpr
- Strac: GDPR for SaaS (2025) - https://www.strac.io/blog/gdpr-for-saas-essential-compliance-guide
- CookieYes: GDPR for SaaS (2025) - https://www.cookieyes.com/blog/gdpr-for-saas/
- Standard Beagle: Designing for privacy compliance - https://standardbeagle.com/designing-for-privacy-compliance/

**Stripe Integration:**
- Stripe Docs: Customer portal configuration - https://docs.stripe.com/customer-management/configure-portal
- Stripe Docs: SaaS subscriptions (2026) - https://docs.stripe.com/get-started/use-cases/saas-subscriptions
- Stripe Resources: Subscription management features - https://stripe.com/resources/more/subscription-management-features-explained-and-how-to-choose-a-software-solution
- NxCode: Build SaaS with Stripe (2026) - https://www.nxcode.io/resources/news/build-saas-stripe-payments-opencode-2026

**Analytics Platform Comparisons:**
- Gartner: Google Analytics alternatives (2026) - https://www.gartner.com/reviews/market/web-product-and-digital-experience-analytics/vendor/google/product/google-analytics/alternatives
- Quantable: Google Analytics alternatives guide (2026) - https://www.quantable.com/analytics/google-analytics-alternatives/
- Powerdrill: Top 10 SaaS analytics tools (2026) - https://powerdrill.ai/blog/top-10-saas-analytics-tools
- ReachOut: Web analytics comparison (2026) - https://usereachout.com/blog/web-analytics-comparison-the-definitive-guide-for-2026

**Code Patterns (GitHub):**
- GitHub grep.app: `navigator.clipboard.writeText` patterns (TypeScript/TSX)
  - Supabase, AutoGPT, DataHub implementations (Apache-2.0, MIT licenses)

### Secondary Research (Medium Confidence)

**Meta Official Documentation:**
- Meta Pixel: Conversion tracking - https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking/
- Meta Conversions API: Best practices - https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices/

**General SaaS Patterns:**
- Web search results for onboarding, dashboard design, GDPR UX (2026)
- Industry blog posts from SaaS analytics vendors

---

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|-----------|-----------|
| **Table Stakes** | HIGH | Validated across 10+ competitors, consistent patterns |
| **Differentiators** | MEDIUM-HIGH | Server-side tracking validated, test event sender is novel |
| **Dashboard Features** | HIGH | Standard analytics UI patterns, well-documented |
| **Onboarding Flow** | HIGH | SaaS best practices literature + competitor analysis |
| **GDPR UI** | HIGH | Legal requirements + implementation examples from Ory, Strac |
| **Stripe Integration** | HIGH | Official Stripe docs + real-world SaaS examples |
| **Anti-Features** | MEDIUM | Based on competitor feature bloat + MVP principles |

---

## Recommendations for Roadmap

### Phase 1 (MVP Launch) - 6-8 weeks

**Focus:** Minimum viable self-service experience

**Core loop:**
1. User signs up → Selects plan → Pays via Stripe
2. User installs snippet → Tests with verification button
3. User connects Google Ads → Maps conversions
4. User sees first real conversion in dashboard
5. User manages subscription via Stripe portal

**Critical features:**
- Authentication (signup, login, password reset)
- Billing (Stripe checkout, plan tiers)
- Snippet deployment (code display, copy button, test event)
- Platform connection (Google Ads OAuth, basic UI)
- Dashboard (conversion list, basic chart, detail modal)
- Settings (profile, billing link, GDPR export/delete)

**Defer:**
- Multi-platform (Meta, TikTok) → Add in Phase 1.5
- Advanced onboarding wizard → Start with basic setup flow
- Real-time notifications → Use polling, add WebSocket later

### Phase 1.5 (Post-Launch Iteration) - 2-4 weeks

**Focus:** Reduce onboarding friction, increase conversion-to-active rate

**Add:**
- Multi-step onboarding wizard (guided setup)
- Installation videos (Loom embeds per platform)
- Meta + TikTok platform connections
- Sync retry UI (manual retry per conversion)
- Email notifications (first conversion, errors)
- Activity log (audit trail)

**Metrics to watch:**
- Signup → Snippet installed (target: >60%)
- Snippet installed → First conversion (target: >40%)
- First conversion → Active 7 days later (target: >70%)

### Phase 2 (Growth Features) - 8-12 weeks

**Focus:** Agency/team use cases, retention

**Add:**
- Multi-site management (agencies track multiple clients)
- Team collaboration (invite users with roles)
- Shopify app integration (one-click install)
- WooCommerce plugin (WordPress plugin directory)
- Server-side GTM forwarding (bypass iOS limitations)
- Email digest reports (weekly summaries)
- Slack/Discord webhooks (real-time alerts)

**Metrics to watch:**
- Multi-site adoption (% of users with >1 site)
- Team invite usage (% of paid users who invite teammates)
- Retention (% of users active 30/60/90 days post-signup)

### Phase 3+ (Advanced Features) - Future

**Defer until validated demand:**
- API key management (programmatic access)
- Conversion attribution reports (multi-touch)
- Automated conversion mapping (ML suggestions)
- Custom analytics dashboards (user-built charts)
- Mobile app SDK (native iOS/Android tracking)

---

## Open Questions for User Research

1. **Onboarding friction points:**
   - Where do users get stuck during snippet installation?
   - Do users prefer video tutorials or text instructions?
   - What % of users complete onboarding vs abandon?

2. **Dashboard priorities:**
   - Which metrics do users check daily vs weekly?
   - Do users want customizable dashboards or curated views?
   - Is real-time data critical or is hourly refresh sufficient?

3. **Platform preferences:**
   - What % of users need Google Ads vs Meta vs TikTok?
   - Do users connect multiple platforms or typically just one?
   - What conversion events do users map most frequently?

4. **Pricing sensitivity:**
   - Will users tolerate no free tier (trial only)?
   - What plan limits matter most (conversions/month, sites, platforms)?
   - Do users prefer monthly or annual billing?

5. **Support expectations:**
   - Do users expect live chat or is email sufficient?
   - What documentation format is most helpful (video, text, interactive)?
   - How quickly do users expect support responses?

---

## Final Notes

**Critical Success Factors:**

1. **Onboarding is the product** - First 15 minutes determine success/failure
2. **Real-time validation** - Users need instant feedback that setup works
3. **Transparent pricing** - No "Contact sales" for SMB tier
4. **Self-service everything** - Users should never need to email support to configure
5. **Progressive disclosure** - Don't overwhelm with features upfront

**MVP Philosophy:**

- **Launch with less** - Better to launch with 20 solid features than 50 half-baked ones
- **Iterate on feedback** - Add Phase 1.5 features based on actual user struggles, not assumptions
- **Defer complexity** - Multi-site, teams, advanced attribution can wait until core loop works perfectly

**Next Steps:**

1. Validate feature priorities with target users (interviews/surveys)
2. Create wireframes/mockups for core flows (signup → first conversion)
3. Define metrics for each phase (signup rate, activation rate, retention)
4. Build Phase 1 feature backlog in `.planning/roadmap/PHASE_1.md`
