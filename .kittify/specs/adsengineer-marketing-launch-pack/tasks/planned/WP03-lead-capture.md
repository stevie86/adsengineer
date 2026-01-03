---
work_package_id: WP03
lane: planned
subtasks:
  - T011
  - T012
  - T013
  - T014
---

# WP03: Lead Capture Functionality

**Goal**: Implement secure email capture for "Waitlist" using Cloudflare Pages Functions.

## Context
We need to capture emails without a backend database. We'll use Cloudflare Pages Functions to proxy data to a Google Sheet or email service.

## Subtasks

### T011: Create "Join Waitlist" Form component
- Create `src/components/WaitlistForm.astro`.
- Input: Email (type="email", required).
- Button: "Join Waitlist".
- Client-side validation (HTML5).

### T012: Implement Cloudflare Pages Function
- Create `landing-page/functions/api/submit.ts` (or `.js`).
- Handle POST request.
- Validate email regex server-side.

### T013: Connect Function to Storage
- **Option A (Simple)**: Proxy to Google Forms/Sheets API.
- **Option B (Robust)**: Proxy to ConvertKit/Mailchimp API.
- Use `env.GOOGLE_SHEETS_WEBHOOK` (set in Cloudflare dashboard, do not commit).
- Log submission to console for debugging.

### T014: Add success/error states to UI
- Use a small Preact/React island or vanilla JS script tag in the component.
- On success: Replace form with "Thanks! We'll be in touch."
- On error: Show "Something went wrong. Email us at hello@adsengineer.cloud".

## Definition of Done
- [ ] Form submits successfully.
- [ ] Data appears in destination (Sheet/Email provider).
- [ ] User sees success message.
- [ ] No API keys exposed in client-side JS.
