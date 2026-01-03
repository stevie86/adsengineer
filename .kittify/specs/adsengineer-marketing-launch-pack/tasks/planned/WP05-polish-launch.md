---
work_package_id: WP05
lane: planned
subtasks:
  - T019
  - T020
  - T021
  - T022
---

# WP05: Final Polish & Launch

**Goal**: Quality assurance, SEO optimization, and live switchover.

## Context
Final checks before public sharing on LinkedIn.

## Subtasks

### T019: Audit accessibility
- Run Lighthouse / axe-core.
- Fix contrast issues (Dark mode often fails this).
- Ensure all form inputs have labels.

### T020: Verify mobile responsiveness
- Check LinkedIn in-app browser behavior (it has a weird bottom bar).
- Verify "Book Demo" button is reachable with thumb.

### T021: Configure custom domain
- Update `landing-page/wrangler.toml` (if needed) or Cloudflare Dashboard.
- Point `adsengineer.cloud` to Pages project.
- Verify SSL certificate provisioning.

### T022: Final load test
- Check loading speed from mobile networks (3G/4G).
- Verify <1.5s First Contentful Paint.

## Definition of Done
- [ ] Lighthouse score > 90 in all categories.
- [ ] Domain `adsengineer.cloud` resolves to landing page.
- [ ] SSL is valid.
