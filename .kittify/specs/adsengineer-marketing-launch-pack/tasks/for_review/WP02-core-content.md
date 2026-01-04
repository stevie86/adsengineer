---
work_package_id: WP02
lane: for_review
subtasks:
  - T006
  - T007
  - T008
  - T009
  - T010
---

# WP02: Core Landing Page Content Sections

**Goal**: Implement all key sections (How it Works, Pricing, Social Proof) with static content.

## Context
These sections explain the value proposition. We use hardcoded content for speed.

## Subtasks

### T006: Implement "How It Works" section
- Create `src/components/HowItWorks.astro`.
- Visual flow: "Visitor Clicks Ad (GCLID captured)" -> "Fills Form (Webhook sent)" -> "Becomes Customer (Offline Conversion uploaded)".
- Use Lucide icons or simple SVG shapes for the diagram.

### T007: Implement "Who It's For" section
- Create `src/components/Audience.astro`.
- 3 Cards:
  1. **Agencies**: "Stop reporting clicks, start reporting revenue."
  2. **Dental/Medical**: "Implants vs Whitening - know the difference."
  3. **Legal/Professional**: "Track high-value case retainers."

### T008: Implement Pricing section
- Create `src/components/Pricing.astro`.
- Hybrid Model Table:
  - SaaS Fee: "$99/mo base"
  - Managed Spend: "+ % of Ad Spend"
  - "Book Audit" CTA for enterprise/custom.

### T009: Implement Social Proof section
- Create `src/components/Trust.astro`.
- Add "Secure" badge, "Cloudflare" logo, "GDPR Compliant" badge.
- Placeholder for testimonials (commented out for now if none exist).

### T010: Integrate Cal.com/Calendly embed
- Create `src/components/Booking.astro`.
- Embed Calendly/Cal.com iframe.
- Ensure it's responsive (doesn't break mobile layout).

## Definition of Done
- [ ] All sections visible and responsive.
- [ ] "How It Works" diagram is clear.
- [ ] Pricing table matches spec.
- [ ] Booking widget works (loads iframe).
