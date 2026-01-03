# Marketing Launch Pack Specification

## Overview
Design and deploy a high-converting landing page for AdsEngineer targeting agencies and local businesses, coupled with a LinkedIn organic and outreach strategy for the founder to acquire the first 20 beta customers.

## Business Context
AdsEngineer (adsengineer.cloud) bridges the gap between Google Ads and GoHighLevel by providing server-side attribution to optimize campaigns for actual revenue.
To secure the first 20 paying customers (Phase 1 Founder-Led Sales), we need:
- A credible destination (landing page) to convert outreach traffic into demos/audits.
- A structured outreach strategy to target agency owners and high-value local businesses.

## Functional Requirements

### Landing Page (adsengineer.cloud)
- **FR-MLP-001**: Hero section with "Book a Demo" / "Get Free Audit" primary CTA and value prop ("Stop Losing Google Ads Attribution").
- **FR-MLP-002**: "How It Works" section explaining the GCLID -> Webhook -> Offline Conversion flow (Visual diagram).
- **FR-MLP-003**: "Who It's For" segmenting Agencies vs. Local Biz (Dental/Legal/HVAC).
- **FR-MLP-004**: Social Proof / Trust Indicators (even if early, use "Secure," "Cloudflare," "GDPR" badges).
- **FR-MLP-005**: Pricing section (Hybrid SaaS + Managed Spend model transparency).
- **FR-MLP-006**: Calendar booking integration (Cal.com/Calendly) for demos.
- **FR-MLP-007**: Lead capture form (email only) for "Join Waitlist" (Secondary CTA).

### LinkedIn Strategy
- **FR-MLP-008**: Profile Optimization Guide for Founder (Headline, Banner, Featured Section).
- **FR-MLP-009**: Content Calendar (4 weeks) focusing on "Revenue vs. Clicks" education.
- **FR-MLP-010**: Outreach Templates (Connection Request, Value Drop, Call Booking) targeting Agency Owners.
- **FR-MLP-011**: List building criteria (Search filters for Sales Navigator/Standard search).

## Non-Functional Requirements

### Performance & Design
- **NFR-MLP-001**: Landing page load time < 1.5s (Cloudflare Pages/Workers).
- **NFR-MLP-002**: Mobile-first design for LinkedIn traffic (most users click from mobile app).
- **NFR-MLP-003**: Professional, "Enterprise-Lite" aesthetic (Dark mode/SaaS vibes).

### Strategy Constraints
- **NFR-MLP-004**: Outreach volume compliant with LinkedIn daily limits (max 20-30 connects/day).
- **NFR-MLP-005**: Zero-cost organic strategy (no paid LinkedIn ads in Phase 1).

## User Scenarios

### Scenario 1: Agency Owner from LinkedIn
**Given** an agency owner receives a DM about "fixing attribution"
**When** they click the link to adsengineer.cloud
**Then** they see "Agencies: Stop Reporting. Start Optimizing."
**And** can book a 15-min demo immediately without friction

### Scenario 2: Local Biz Owner (Organic Search/Referral)
**Given** a Dental practice owner lands on the site
**When** they scroll to "Who This Is For"
**Then** they see "Dental" specifically mentioned with ROI potential
**And** click "Get Free Audit"

## Success Criteria

### Quantitative Metrics
- **SC-MLP-001**: Landing page conversion rate (Visitor -> Demo Booked) > 2%.
- **SC-MLP-002**: First 5 demos booked via LinkedIn outreach within 14 days of launch.
- **SC-MLP-003**: 20% acceptance rate on LinkedIn connection requests using new templates.

### Qualitative Measures
- **SC-MLP-004**: Founder feels confident sharing the URL (brand alignment).
- **SC-MLP-005**: Prospects understand the "Server-side Attribution" concept from the page alone.

## Edge Cases

### Landing Page
- **EC-MLP-001**: User has JavaScript disabled (Form fallback or message).
- **EC-MLP-002**: Calendar booking tool API outage (Show "Email us directly" backup).
- **EC-MLP-003**: Mobile view on ultra-small screens or foldables.

### LinkedIn Strategy
- **EC-MLP-004**: LinkedIn account restricted/flagged (Strategy fallback: email outreach).
- **EC-MLP-005**: Target agency owner has "Open Profile" disabled (InMail vs. Connection Request).

## Assumptions
- Domain adsengineer.cloud is managed via Cloudflare.
- Founder has a personal LinkedIn account ready for optimization.
- Calendar booking tool (Cal.com/Calendly) is available.
- "Marketing Launch Pack" implies strategy + assets, not just code.

## Dependencies
- Cloudflare Pages/Workers for hosting.
- Brand assets (Logo, colors) from existing repo.
- Founder availability for demo calls.

## Out of Scope
- Paid ad campaigns (Google/LinkedIn Ads).
- Full blog/CMS implementation (Phase 2).
- Video production for the landing page (Placeholder allowed).
