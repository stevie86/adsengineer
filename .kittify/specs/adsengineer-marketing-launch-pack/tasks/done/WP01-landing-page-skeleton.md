---
work_package_id: WP01
lane: doing
agent: claude
shell_pid: 12345
review_status: ""
---

## Activity Log

- 2026-01-03T19:12:34Z - claude - shell_pid=12345 - lane=doing - Started implementation
- 2026-01-03T19:15:00Z - claude - shell_pid=12345 - lane=doing - Completed implementation
- 2026-01-03T19:16:00Z - claude - shell_pid=12345 - lane=for_review - Ready for review
- 2026-01-03T19:20:00Z - claude - shell_pid=12345 - lane=for_review - Code review complete: Needs build fixes
- 2026-01-03T22:55:00Z - claude - shell_pid=12345 - lane=doing - Addressed review feedback
- 2026-01-03T22:57:00Z - claude - shell_pid=12345 - lane=for_review - Ready for re-review

# WP01: Landing Page Skeleton & Infrastructure

**Goal**: Initialize Astro project, configure Cloudflare Pages, and deploy "Coming Soon" state.

## Context
We are building a high-performance landing page using Astro (SSG) and Tailwind CSS. It must load in under 1.5s. Hosting is on Cloudflare Pages.

## Subtasks

### T001: Initialize Astro project with Tailwind CSS
- Create `landing-page/` directory at root.
- Initialize Astro: `pnpm create astro@latest landing-page` (Use "Empty" or "Minimal" template).
- Add Tailwind: `pnpm astro add tailwind`.
- Configure `astro.config.mjs` for static output (`output: 'static'`).

### T002: Configure Cloudflare Pages deployment
- Create `landing-page/wrangler.toml` (if using Wrangler directly) or ensure build command is `pnpm build` and output dir is `dist/`.
- Verify `pnpm dev` runs locally on port 4321.

### T003: Implement basic Layout
- Create `src/layouts/Layout.astro`.
- Add SEO meta tags (Title: "AdsEngineer - Server-side Attribution for GHL", Description).
- Add Header (Logo placeholder, "Book Demo" button).
- Add Footer (Copyright, Links).

### T004: Create Hero component
- Create `src/components/Hero.astro`.
- Add Headline: "Stop Losing Google Ads Attribution".
- Add Subheadline: "Bridge the gap between Google Ads and GoHighLevel...".
- Add Primary CTA: "Book a Demo" (href="#demo").

### T005: Deploy to Cloudflare Pages
- Run `pnpm build`.
- (Manual test) Use `wrangler pages deploy dist --project-name adsengineer-landing` to verify deployment works.
- Measure Lighthouse score (aim for 100 Performance).

## Definition of Done
- [ ] `landing-page/` exists with working Astro setup.
- [ ] Site builds successfully locally.
- [ ] Header/Hero/Footer are visible.
- [ ] Lighthouse Performance score > 95.
