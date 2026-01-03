---
work_package_id: CLEANUP01
subtasks:
  - T001: Assess all open tasks and prioritize MVP-critical items
  - T002: Archive non-essential files and documentation
  - T003: Focus development on core MVP features (security + payments)
  - T004: Postpone non-critical tooling (BiomeJS) until MVP complete
  - T005: Create clear development roadmap for next 7 days
  - T006: Implement daily focus protocol
lane: doing
assignee: "claude"
agent: "claude"
shell_pid: "12345"
started_at: "2026-01-03T12:30:00Z"
history:
  - created: "2026-01-03T12:30:00Z"
    by: "claude"
    action: "project_declutter_initiated"
---

# Project Declutter & Refocus: AdsEngineer MVP Completion Sprint

## Executive Summary

**Goal:** Declutter project, eliminate distractions, and focus on MVP completion in 7 days

**Methodology:** Ruthless prioritization - only MVP-critical tasks, archive everything else

**Outcome:** Clean, focused project with clear path to production-ready MVP

---

## Current Project Assessment

### 📂 File Inventory (Needs Cleanup)

**Critical Files (Keep):**
- `serverless/src/` - Core application code
- `serverless/wrangler.jsonc` - Deployment config
- `AGENTS.md` - Project knowledge base
- `README-FULL.md` - Core documentation

**Assessment Files (Archive):**
- `MVP_SPECIFICATION.md` - Outdated spec (superseded)
- `stripe-business-description-de.md` - Redundant German version
- `workflow-optimizations.md` - n8n-specific, not core
- `LAUNCH_STATUS_REPORT.md` - Can be updated instead of kept

**Tooling Assessment Files (Archive):**
- `BIOMEJS-INTEGRATION-ASSESSMENT.md` - Comprehensive but not urgent
- `STRIPE-INTEGRATION-GUIDE.md` - Keep for reference
- `LOAD-TESTING-README.md` - Keep for operations

**Spec-Kitty Tasks (Review):**
- `DEV01-streamlined-development-workflow.md` - Good intent, but over-engineered
- Multiple spec files creating complexity

### 🎯 Priority Assessment: BiomeJS vs MVP Completion

#### BiomeJS Priority: **MEDIUM (Postpone)**

**Why NOT High Priority:**
- ✅ **Benefits**: 10-100x faster linting, better DX
- ❌ **But**: Not blocking MVP functionality
- ❌ **Current blockers**: Security, payments, authentication
- ❌ **Risk**: Tooling migration distracts from core features

**MVP Critical Path (HIGH PRIORITY):**
1. **WP02 Encryption** - Customer data security (URGENT)
2. **Authentication** - User access control (CRITICAL)
3. **Stripe Completion** - Payment processing (BLOCKED)
4. **Security Headers** - Basic HTTPS security (IMPORTANT)

**Recommendation:** Complete MVP security/payment features first, then adopt BiomeJS.

---

## Declutter Action Plan

### Phase 1: File Organization (30 minutes)

#### T001: Create Archive Directory Structure
```bash
# Create archives directory
mkdir -p archives/{outdated-specs,tooling-assessments,legacy-docs}

# Move non-essential files
mv MVP_SPECIFICATION.md archives/outdated-specs/
mv stripe-business-description-de.md archives/legacy-docs/
mv workflow-optimizations.md archives/legacy-docs/
mv BIOMEJS-INTEGRATION-ASSESSMENT.md archives/tooling-assessments/
```

#### T002: Simplify Spec-Kitty Structure
```bash
# Keep only active work packages
# Archive completed ones to reduce cognitive load
mv .kittify/specs/adsengineer-security-hardening/tasks/done/DOC01-documentation-cleanup.md archives/completed-specs/
mv .kittify/specs/adsengineer-security-hardening/tasks/doing/DEV01-streamlined-development-workflow.md archives/workflow-planning/
```

#### T003: Update .gitignore for Archives
```bash
# Add to .gitignore
echo "# Archived files (can be restored if needed)" >> .gitignore
echo "archives/" >> .gitignore
```

### Phase 2: Development Focus (Immediate)

#### T004: Create 7-Day MVP Sprint Plan

**Day 1-2: Complete WP02 Encryption**
- Apply encryption to Google Ads API key storage
- Test credential encryption/decryption
- Validate no plain text in logs

**Day 3-4: Basic Authentication**
- JWT token system
- User registration/login endpoints
- Protected route middleware

**Day 5: Stripe Completion**
- Create products/prices via CLI
- Update environment variables
- Test basic payment flow

**Day 6: Security Headers**
- HTTPS security headers
- Basic TLS hardening
- Secure cookie configuration

**Day 7: Integration Testing**
- End-to-end customer flow
- Security validation
- Load testing with new features

#### T005: Update AGENTS.md for Clean State
- Remove outdated references
- Focus on current active work
- Clear next steps

#### T006: Implement Focus Protocol

**Daily Routine:**
1. **Start**: Check today's single task in AGENTS.md
2. **Work**: 4-hour focused block on ONE task
3. **Test**: Validate completion with tests
4. **Commit**: Clean commit with progress
5. **Review**: Update AGENTS.md for tomorrow

**No Multitasking Rule:**
- Complete current task before starting next
- No "quick fixes" of other issues
- Single git branch, single focus

---

## Success Criteria

### Clean Project State
- [ ] Archive directory created with non-essential files
- [ ] Spec-kitty simplified to active tasks only
- [ ] Clear file structure without distractions

### Focused Development
- [ ] 7-day sprint plan documented in AGENTS.md
- [ ] Daily focus protocol established
- [ ] No competing priorities or distractions

### MVP Completion Path
- [ ] Clear next 7 tasks identified
- [ ] Each task has success criteria
- [ ] Dependencies and blockers identified

---

## BiomeJS Decision

### Postpone Until MVP Complete

**Rationale:**
1. **MVP First**: Security, payments, authentication are critical
2. **Low Risk**: Current ESLint + Prettier work fine
3. **High Reward**: BiomeJS benefits justify separate sprint
4. **Clean Migration**: Better to adopt when codebase is stable

**Timeline:** Implement BiomeJS after MVP launch (Day 8-10)

**Benefits Still Valid:**
- 10-100x faster CI/CD
- Better developer experience
- Simplified maintenance

---

## Implementation Checklist

### Immediate Actions (Today)
- [ ] Create archive directory structure
- [ ] Move non-essential files to archives/
- [ ] Simplify spec-kitty to active tasks only
- [ ] Update AGENTS.md with 7-day sprint plan
- [ ] Commit clean project state

### Daily Focus Setup
- [ ] Choose first task (WP02 encryption completion)
- [ ] Set up daily focus timer/reminders
- [ ] Prepare testing environment
- [ ] Update git branch naming for focus

### Weekly Goal
- [ ] Complete 7-day MVP sprint
- [ ] Have functional customer onboarding
- [ ] Security measures implemented
- [ ] Ready for beta testing

---

## Risk Mitigation

### Distraction Prevention
- **Single Task Focus**: Only work on assigned daily task
- **Archive Temptations**: Move distracting files out of sight
- **Communication Boundaries**: Clear work hours, no interruptions

### Quality Assurance
- **Test Everything**: No committing without tests
- **Security First**: Every change validated for security
- **Documentation**: Update AGENTS.md daily with progress

### Contingency Plans
- **Task Overrun**: Reduce scope, focus on core functionality
- **Blocker Hit**: Immediate problem-solving, don't context-switch
- **Motivation Dip**: Small wins celebration, progress tracking

---

## Final Focus Commitment

**This declutter sprint will:**
- ✅ Remove project complexity and distractions
- ✅ Provide clear 7-day path to MVP completion
- ✅ Establish disciplined development habits
- ✅ Deliver production-ready AdsEngineer

**BiomeJS will be implemented after MVP launch for optimal performance gains.**

**Ready to begin the declutter process?** 🧹⚡

---

**Initiated:** January 3, 2026
**Target Completion:** January 10, 2026
**Focus:** MVP Completion Over Tooling</content>
<parameter name="filePath">/home/webadmin/coding/ads-engineer/.kittify/specs/adsengineer-security-hardening/tasks/doing/CLEANUP01-project-declutter-refocus.md