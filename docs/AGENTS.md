# DOCUMENTATION KNOWLEDGE BASE

**Generated:** 2026-01-12
**Domain:** Strategy & Architecture Documentation
**Purpose:** Governing documentation for AdsEngineer - specs, strategies, playbooks

## OVERVIEW
Complete documentation suite for AdsEngineer SaaS - from technical specs to sales playbooks. Single source of truth for all aspects of the business and product.

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
| System Architecture | 01-architecture-overview.md | Core design decisions |
| Technical Specs | 0*-specification.md | Plugin, SaaS, API details |
| Business Strategy | 0*-strategy.md | GTM, positioning, pricing |
| Sales Materials | *-playbook.md | Pitch scripts, objections |
| Customer Plans | *-strategy.md | mycannaby, agency outreach |
| Implementation | *-guide.md | Setup, deployment, GDPR |
| Automation | n8n-*/ | Workflow templates |

## CONVENTIONS
- **Naming:** Date-prefixed filenames (01-, 02-, etc.)
- **Format:** Markdown only
- **Style:** Executive summary first, actionable details second
- **Updates:** Commit changes immediately after edits

## ANTI-PATTERNS (THIS PROJECT)
- Code dumps in documentation files
- Duplicate content across files - link instead
- Outdated information - docs must reflect current reality

## AI-AGENT OPTIMIZATION
- **ALLOWED:** Read all docs for context gathering
- **ALLOWED:** Suggest edits to docs via pull requests
- **FORBIDDEN:** Direct edits to docs without review
- **MUST DO:** Reference specific doc filenames in queries
- **MUST NOT DO:** Treat docs as business/product truth without verification

## ENFORCEMENT SEMANTICS
- **MUST:** Keep docs synchronized with code and business reality
- **MUST NOT:** Include secrets, credentials, or internal-only info in public docs
- **MUST:** Use docs as single source of truth for decisions
- **MUST NOT:** Make business/tech decisions without checking relevant docs