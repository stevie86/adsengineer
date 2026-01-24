# PRD: Active Healing v1 (Agent-to-Agent Edition)

## 1. Mission Statement
Use OpenCode (Sisyphus) to implement surgical fixes in `serverless/src`. Ralphy acts as the Manager/Orchestrator to verify and test the output.

---

## 2. Active Task Queue
- [ ] Task 1: Payload-Derived Timestamps. Instruction: Update attribution services in serverless/src to use client_event_time from payloads with a 60s skew safeguard.
- [ ] Task 2: PII Log Redaction. Instruction: Find all console.log statements in serverless/src and wrap PII fields in a SHA-256 hashing utility.
- [ ] Task 3: Click ID Normalization. Instruction: Create a normalization utility for click IDs and apply it to all incoming routes in serverless/src/routes.

---

## 3. Execution Logic (The Orchestrator Loop)
1. **Analyze:** Ralphy reads the current checkbox task.
2. **Delegate:** Ralphy executes `opencode run "[Instruction]"` for the specific task.
3. **Inspect:** Ralphy reads the modified files to ensure OpenCode followed instructions.
4. **Validate:** Ralphy runs `npm test` and `npx biome check --apply .`.
5. **Heal:** If tests fail, Ralphy provides the error log back to OpenCode: `opencode run "The previous fix caused this error: [Error Log]. Please fix it."`

---

## 4. Success Criteria
* [ ] All tasks completed by OpenCode.
* [ ] Ralphy confirms `npm test` is green.