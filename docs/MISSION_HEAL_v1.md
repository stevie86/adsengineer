# Mission: Active Healing - Tracking & Privacy
Based on the findings in `docs/OPENCODE_REPORT.md`, implement the following fixes in `serverless/src`:

## Tasks:
1. **Timestamp Fix (Priority: High):** Ensure conversion timestamps are derived from the event payload (client-side) rather than `Date.now()`. Add logic to handle clock skew.
2. **PII Protection (Priority: High):** Locate all payload logging in Workers and ensure PII (emails, names, full IP addresses) is redacted or hashed before reaching the logs.
3. **Click ID Normalization:** Implement a global utility to normalize and limit the length of `gclid`, `fbclid`, and `ttclid`.

## Verification:
- After each fix, run `npm test` (or your Vitest suite).
- If tests fail, fix the code autonomously until they pass.
- Update `docs/SYSTEM_REPORT.md` once finished.