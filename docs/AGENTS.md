# DOCUMENTATION KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** Strategy & Architecture Documentation
**Purpose:** Single source of truth - specs, strategies, playbooks.

## OVERVIEW
Complete documentation suite for AdsEngineer SaaS.

## STRUCTURE
```
docs/
├── 0*-overview.md          # Architecture & system design
├── 0*-specification.md     # Technical specifications
├── 0*-roadmap.md          # Feature planning & phases
├── 0*-strategy.md         # Business & go-to-market
├── *-strategy.md          # Customer-specific strategies
├── *-playbook.md         # Sales & operational guides
├── n8n-*/                 # Automation workflows
├── *-guide.md            # Implementation guides
└── *-readiness.md        # Launch & status reports
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| System Architecture | `01-architecture-overview.md` | Core design decisions |
| Technical Specs | `0*-specification.md` | Plugin, SaaS, API details |
| Business Strategy | `0*-strategy.md` | GTM, positioning, pricing |
| Sales Materials | `*-playbook.md` | Pitch scripts, objections |
| Automation | `n8n-*/` | Workflow templates |

## CONVENTIONS
- **Format:** Markdown only.
- **Style:** Executive summary first, actionable details second.
- **Truth:** Docs are the authority. If code disagrees, check docs first.

## ENFORCEMENT
- **MUST:** Keep docs synchronized with code.
- **MUST NOT:** Include secrets in docs.
