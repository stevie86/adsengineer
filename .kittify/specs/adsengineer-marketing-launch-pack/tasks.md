# Marketing Launch Pack Work Packages

**Feature**: Marketing Launch Pack
**Status**: PLANNED
**Branch**: feat/marketing-launch-pack
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Work Packages

### WP01: Landing Page Skeleton & Infrastructure
**Goal**: Initialize Astro project, configure Cloudflare Pages, and deploy "Coming Soon" state.
**Priority**: High
**Dependencies**: None

- [ ] T001: Initialize Astro project with Tailwind CSS (SpaceX/SaaS theme) `[P]`
- [ ] T002: Configure Cloudflare Pages deployment (wrangler.toml) `[P]`
- [ ] T003: Implement basic Layout (Header, Footer, Meta tags)
- [ ] T004: Create Hero component with primary CTA placeholder
- [ ] T005: Deploy to Cloudflare Pages (verify <1.5s load)

### WP02: Core Landing Page Content Sections
**Goal**: Implement all key sections (How it Works, Pricing, Social Proof) with static content.
**Priority**: High
**Dependencies**: WP01

- [ ] T006: Implement "How It Works" section (SVG diagram of GCLID flow) `[P]`
- [ ] T007: Implement "Who It's For" section (Cards for Agencies/Dental/Legal) `[P]`
- [ ] T008: Implement Pricing section (Table with Hybrid model)
- [ ] T009: Implement Social Proof section (Trust badges, secure icons)
- [ ] T010: Integrate Cal.com/Calendly embed for "Book Demo"

### WP03: Lead Capture Functionality
**Goal**: Implement secure email capture for "Waitlist" using Cloudflare Pages Functions.
**Priority**: Medium
**Dependencies**: WP01

- [ ] T011: Create "Join Waitlist" Form component (Client-side validation)
- [ ] T012: Implement Cloudflare Pages Function `functions/api/submit.ts`
- [ ] T013: Connect Function to Google Sheets or Email Service (API key env var)
- [ ] T014: Add success/error states to UI

### WP04: LinkedIn Strategy Assets
**Goal**: Create documentation and assets for founder-led outreach.
**Priority**: High
**Dependencies**: None (Parallel execution)

- [ ] T015: Create `docs/linkedin-playbook.md` (Profile optimization guide)
- [ ] T016: Create `docs/content-calendar.md` (4-week plan: Revenue vs Clicks) `[P]`
- [ ] T017: Create `docs/outreach-templates.md` (Connection, Value Drop, Booking scripts) `[P]`
- [ ] T018: Define "Agency Owner" search filters in `docs/prospecting-guide.md`

### WP05: Final Polish & Launch
**Goal**: Quality assurance, SEO optimization, and live switchover.
**Priority**: Medium
**Dependencies**: WP02, WP03

- [ ] T019: Audit accessibility (Lighthouse > 90)
- [ ] T020: Verify mobile responsiveness (esp. LinkedIn in-app browser)
- [ ] T021: Configure custom domain `adsengineer.cloud` (DNS switch)
- [ ] T022: Final load test (verify <1.5s globally)

## Implementation Sketch

1. **Setup**: Astro + Tailwind in `landing-page/`
2. **Infra**: Cloudflare Pages for hosting, Functions for forms
3. **Content**: Hardcoded content first (easy to edit later)
4. **Strategy**: Markdown docs in `docs/` for the human strategy part
