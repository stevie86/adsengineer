# AdsEngineer: GoHighLevel Pivot Strategy

## Executive Summary

Pivot from WordPress plugin to GoHighLevel (GHL) integration targeting agencies who need **bulletproof conversion tracking** that survives multi-step funnels, custom landing pages, and human error.

**Reality Check:** GHL has built basic conversion tracking (GCLID capture, offline uploads, workflow actions). But it breaks in common scenarios and lacks lead value scoring.

**Product:** Webhook-based service that makes GHL tracking bulletproof, adds lead value scoring, and eliminates manual workflow setup.

**Target:** 25-40K agencies running ads through GHL (~$45-144M ARR potential)

---

## Competitive Reality

### What GHL Has Already Built ✅

| Feature | Status | How It Works |
|---------|--------|--------------|
| GCLID/GBRAID/WBRAID capture | ✅ Works | Via URL parameters on GHL-hosted pages |
| "Add to Google AdWords" workflow | ✅ Works | Manual workflow action per conversion |
| Offline conversion uploads | ✅ Works | Via workflow action to Google Ads API |
| Facebook CAPI | ✅ Works | Via workflow action |
| Attribution tracking | ✅ Works | First/Latest attribution stored on contacts |

### What's Still Broken ❌

| Gap | GHL Documentation Quote | Impact |
|-----|------------------------|--------|
| **Only works on GHL-hosted pages** | *"This action must be a HighLevel Form, Survey, Calendar... Non-HighLevel events will not capture attribution data"* | Custom landing pages lose tracking |
| **Navigation breaks tracking** | *"If someone clicks a button that moves them to another page to submit a form, no attribution data can be added"* | Multi-step funnels break |
| **Manual workflow per conversion** | Must create workflow for each conversion action | Error-prone, time-consuming |
| **Exact name matching required** | *"The name must match exactly—including capitalization, spacing, and punctuation—or the action will be skipped"* | Silent failures |
| **No lead value scoring** | Not available | Can't tell Google which leads are worth more |
| **Silent failures** | Conversions "skipped" if GCLID missing | Agencies don't know they're losing data |
| **UTM rigidity** | *"Do NOT add any custom UTM parameters"* | Can't customize tracking |

---

## Market Analysis

### GoHighLevel Platform Stats

| Metric | Value |
|--------|-------|
| Paying customers (agencies) | ~70,000 |
| SMB sub-accounts | 2,000,000+ |
| Platform revenue (2024) | $82.7M |
| Growth | Inc 5000 ranked (#516) |

### Refined Pain Points (What GHL HASN'T Fixed)

| Rank | Pain Point | Who Feels It | Evidence |
|------|-----------|--------------|----------|
| 1 | **Multi-step funnels lose GCLID** | Agencies with complex funnels | GHL docs confirm navigation breaks tracking |
| 2 | **Manual workflow setup** | All agencies | Must create workflow per conversion type |
| 3 | **No lead value differentiation** | Performance-focused agencies | $50 lead = $5,000 lead to Google |
| 4 | **Silent tracking failures** | Everyone | "Skipped" conversions with no alerts |
| 5 | **External landing pages unsupported** | Agencies using Unbounce, Webflow, etc. | GHL only tracks GHL-hosted forms |

### Competitor Landscape

| Competitor | What They Do | Price | Why We Win |
|------------|--------------|-------|------------|
| **GHL Native** | Basic tracking (works on simple funnels) | Included | We handle complex funnels + lead scoring |
| **AnyTrack** | Multi-platform tracking | $50-300/mo | We're simpler, GHL-focused, lead scoring |
| **Hyros** | Enterprise attribution | $500+/mo | We're 10x cheaper, faster setup |
| **Wicked Reports** | First-party attribution | $300+/mo | We're GHL-native, not generic |

---

## Refined Product Strategy

### Core Value Proposition (Updated)

> ~~"Fix your GHL conversion tracking"~~ ❌ (GHL already has basic tracking)
>
> **"Bulletproof your GHL tracking. Score your leads. Never lose a conversion."** ✅

### The Three Things GHL Can't Do

1. **Survive navigation** - Track GCLID across multi-step funnels
2. **Score lead value** - Tell Google which leads are worth $5,000 vs $50
3. **Alert on failures** - Know when tracking breaks before you lose data

### MVP Features

| Feature | Description | Why GHL Can't Do This |
|---------|-------------|----------------------|
| **Persistent GCLID tracking** | Survives page navigation, external pages | GHL loses GCLID on navigation |
| **Lead value scoring** | Auto-calculate conversion value from form data | GHL only does pass/fail |
| **Zero-config upload** | No manual workflow setup needed | GHL requires workflow per conversion |
| **Failure alerts** | Know when conversions fail to upload | GHL silently skips |
| **External page support** | Works on Unbounce, Webflow, custom sites | GHL only tracks GHL forms |

### Technical Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   GoHighLevel   │────▶│  AdsEngineer Worker  │────▶│   Google Ads    │
│  (Webhook out)  │     │  (Cloudflare D1)     │     │  (Offline API)  │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                  │
        ┌─────────────────┐       │
        │ External Pages  │───────┤
        │ (JS snippet)    │       │
        └─────────────────┘       ▼
                          ┌─────────────────┐
                          │    Meta CAPI    │
                          └─────────────────┘
```

### Integration Method

**Phase 1: Webhook + JS Snippet (MVP)**
- Webhook receives GHL events
- Optional JS snippet for external pages (persists GCLID)
- Zero OAuth, works immediately

**Phase 2: GHL Marketplace App**
- Official listing for distribution
- OAuth integration
- Built-in billing

---

## Pricing Strategy

### Recommended Model: Per Sub-Account

| Tier | Price | Includes |
|------|-------|----------|
| Starter | $49/mo | 5 sub-accounts, basic tracking |
| Growth | $149/mo | 25 sub-accounts, lead scoring |
| Agency | $299/mo | Unlimited, priority support, custom scoring rules |

### Positioning vs Competitors

| Feature | Us | GHL Native | AnyTrack |
|---------|----|-----------:|----------|
| Price | $49-299/mo | Free | $50-300/mo |
| Setup time | 5 min | 30+ min per conversion | 1-2 hours |
| Multi-step funnel support | ✅ | ❌ | ✅ |
| Lead value scoring | ✅ | ❌ | ❌ |
| Failure alerts | ✅ | ❌ | ✅ |
| External page support | ✅ | ❌ | ✅ |

---

## Go-To-Market Strategy

### Phase 1: Validate (Week 1-2)

1. **Landing page** with waitlist
2. **Post in GHL Facebook group** - Focus on multi-step funnel pain
3. **DM 20 agency owners** - Target those with complex funnels
4. **Goal:** 100 waitlist signups, 10 beta users

### Validation Questions to Answer

- Do agencies actually have multi-step funnels? (or is GHL native enough?)
- How often do conversions get "skipped"? (is this a real problem?)
- Would they pay for lead value scoring? (or is pass/fail enough?)

### Phase 2: Beta (Week 3-6)

1. **Onboard 10 agencies** with white-glove setup
2. **Measure:** How many conversions were they losing before?
3. **Collect testimonials** with specific numbers
4. **Goal:** 3 paying customers, 2 case studies with ROI proof

### Phase 3: Launch (Week 7-8)

1. **Product Hunt launch**
2. **GHL Marketplace submission**
3. **Content:** "Why GHL Native Tracking Isn't Enough" (honest, not FUD)
4. **Goal:** 50 paying customers

---

## Landing Page Strategy (Updated)

### Page Structure

```
SECTION 1: HERO
├── Headline: "GHL Tracks Conversions. We Make Sure They Actually Get There."
├── Subhead: "Bulletproof tracking for multi-step funnels. Lead scoring for better ROAS."
├── CTA: "Get Early Access →"
└── Qualifier: "For agencies running Google/Meta ads through GoHighLevel"

SECTION 2: THE HONEST TRUTH
├── "GHL's built-in tracking works great... until it doesn't"
├── ✅ Works: Simple single-page forms
├── ❌ Breaks: Multi-step funnels, external landing pages, complex workflows
└── "If your funnels are simple, you might not need us. Here's how to tell..."

SECTION 3: THE THREE GAPS
├── Gap 1: "Navigation Kills Your GCLID"
│   └── "Click page 1 → navigate to page 2 → submit form → GCLID gone"
├── Gap 2: "All Leads Look Equal to Google"
│   └── "A $50 lead and a $5,000 lead get the same conversion value"
└── Gap 3: "Silent Failures"
    └── "Conversions 'skip' with no warning. You find out in reporting."

SECTION 4: HOW WE FIX IT
├── "Persistent GCLID tracking across all pages"
├── "Lead value scoring based on form responses"
├── "Real-time alerts when conversions fail"
└── "Works on GHL pages AND external landing pages"

SECTION 5: WHO THIS IS FOR
├── ✅ "You run multi-step funnels (application → call → close)"
├── ✅ "You use external landing pages (Unbounce, Webflow, etc.)"
├── ✅ "You want Google to optimize for lead quality, not just volume"
├── ❌ "You only use simple single-page GHL forms (GHL native is fine)"
└── ❌ "You don't run Google/Meta ads (nothing for us to track)"

SECTION 6: PRICING
├── "Starting at $49/mo"
├── "Free trial for founding agencies"
└── "ROI guarantee: See improvement in 30 days or don't pay"

SECTION 7: FAQ (Honest Answers)
├── "Doesn't GHL already track conversions?"
│   └── "Yes, for simple funnels. We handle the complex cases they can't."
├── "How is this different from AnyTrack?"
│   └── "Simpler setup, GHL-focused, and we add lead value scoring."
├── "What if I only use single-page forms?"
│   └── "GHL native is probably fine. We're for complex funnels."
└── "How long does setup take?"
    └── "5 minutes. One webhook URL. Optional JS snippet for external pages."

SECTION 8: FINAL CTA
├── Headline: "Stop Losing Conversions to Complex Funnels"
├── CTA: "Get Early Access →"
└── Risk reducer: "Free trial. Cancel anytime. ROI guarantee."
```

### Headlines to A/B Test

1. "GHL Tracks Conversions. We Make Sure They Actually Get There."
2. "Bulletproof Your GHL Tracking (For Complex Funnels)"
3. "The Conversions GHL Native Tracking Misses"
4. "Lead Scoring for GoHighLevel Agencies"
5. "Your Multi-Step Funnels Are Leaking Conversions"

---

## Messaging Framework (Updated)

### Primary Message

**Old (too aggressive):** "GHL tracking is broken, we fix it"

**New (honest):** "GHL tracking works for simple funnels. We handle the complex cases and add lead scoring."

### The Honest Pitch

> "Look, GHL has built solid conversion tracking. If you're running simple single-page forms, you probably don't need us.
>
> But if you're running multi-step funnels, using external landing pages, or want Google to know which leads are actually worth money – that's where GHL falls short and we come in.
>
> We're not replacing GHL tracking. We're bulletproofing it for agencies with complex setups."

### Objection Handling (Updated)

| Objection | Honest Response |
|-----------|-----------------|
| "GHL already has conversion tracking" | "It does, and it works great for simple funnels. We're for the complex cases – multi-step funnels, external pages, lead scoring. If your setup is simple, you might not need us." |
| "I've never had tracking issues" | "That's great! You might have simple funnels. Do you use multi-step applications or external landing pages? That's where tracking typically breaks." |
| "AnyTrack does this" | "They do multi-platform. We're GHL-focused and add lead value scoring. Simpler setup if GHL is your main platform." |
| "Why should I pay when GHL is free?" | "GHL native is free and works for simple cases. We charge for: multi-step funnel support, lead scoring, failure alerts. If you need those, we're worth it. If not, stick with native." |

---

## Success Metrics

### Week 1-2 (Validation)

| Metric | Target | What It Proves |
|--------|--------|----------------|
| Waitlist signups | 100 | Interest exists |
| "Multi-step funnel" mentions | 30% | Our use case is real |
| "Lead scoring" interest | 50% | Value-add resonates |

### Week 3-6 (Beta)

| Metric | Target | What It Proves |
|--------|--------|----------------|
| Agencies with complex funnels | 7/10 | We targeted right |
| Conversions previously lost | 10%+ | Problem is real |
| Lead scoring adoption | 5/10 | Feature is valued |

### Week 7-12 (Launch)

| Metric | Target |
|--------|--------|
| Paying customers | 50 |
| MRR | $5,000 |
| Churn rate | <5% |

---

## Risk Assessment

### What Could Kill This

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| GHL fixes multi-step tracking | Medium | Move fast, differentiate on lead scoring |
| Market too small (simple funnels are enough) | Medium | Validate in week 1-2, pivot if needed |
| AnyTrack dominates | Low | They're multi-platform, we're GHL-native |
| Agencies don't value lead scoring | Medium | Test messaging, may need to pivot feature |

### Pivot Options If This Fails

1. **Broader CRM market** - Same product for HubSpot, Salesforce
2. **Lead scoring only** - Drop tracking, focus on value scoring
3. **Agency services** - Done-for-you tracking setup (service, not SaaS)

---

## Next Steps

1. [ ] Build landing page with honest positioning
2. [ ] Add waitlist endpoint to Worker
3. [ ] Create GHL webhook receiver endpoint
4. [ ] Post in GHL Facebook group (focus on multi-step funnel pain)
5. [ ] DM 20 agency owners for beta
6. [ ] **Validate:** Do they actually have complex funnels?
7. [ ] **Validate:** Are they losing conversions?
8. [ ] Decide: Build or pivot based on validation

---

## Resources

### GHL Documentation (Know Your "Competitor")
- [GHL Attribution Docs](https://help.gohighlevel.com/support/solutions/articles/48001219997-understanding-attribution-source)
- [GHL Google Ads Workflow](https://help.gohighlevel.com/support/solutions/articles/155000003368-workflow-action-add-to-google-adwords)
- [GHL Ad Manager Conversions](https://help.gohighlevel.com/support/solutions/articles/155000005431-how-to-create-google-ads-conversion-actions-in-ad-manager)

### Landing Page Examples
- [northbeam.com](https://northbeam.com) - Clean, profitability framing
- [wickedreports.com](https://www.wickedreports.com) - "Source of truth" messaging

### Technical References
- [Google Ads Offline Conversions API](https://developers.google.com/google-ads/api/docs/conversions/upload-clicks)
- [Meta Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api/)
