# INFRASTRUCTURE KNOWLEDGE BASE

**Generated:** 2026-01-12
**Domain:** Cloud Infrastructure (OpenTofu/Terraform)
**Purpose:** Infrastructure as Code for Cloudflare Workers, D1 database, and supporting services

## OVERVIEW
Complete IaC setup for AdsEngineer SaaS using OpenTofu to provision Cloudflare infrastructure including Workers, D1 databases, KV namespaces, and DNS.

## STRUCTURE
```
infrastructure/
├── main.tf              # Core resource definitions (Workers, D1, KV)
├── variables.tf         # Input variables and defaults
├── outputs.tf           # Output values for deployment
├── providers.tf         # Cloudflare provider configuration
├── terraform.tfvars.example  # Variable template
└── README.md            # Deployment guide
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Core Resources | main.tf | Workers, D1 database, KV namespaces |
| Configuration | variables.tf | Environment variables, account settings |
| Deployment Outputs | outputs.tf | Worker URLs, database IDs |
| Provider Setup | providers.tf | Cloudflare authentication |
| Variable Template | terraform.tfvars.example | Example configuration |
| Deployment Guide | README.md | Setup and usage instructions |

## CONVENTIONS
- **Naming:** Environment-prefixed resources (dev/staging/prod)
- **State Management:** Local state for development, remote for production
- **Tooling:** OpenTofu (tofu) instead of Terraform
- **Secrets:** Doppler integration for sensitive values
- **Modules:** Flat structure, no nested modules
- **Variables:** Required variables have no defaults, optional have sensible defaults

## ANTI-PATTERNS (THIS PROJECT)
- Hardcoded credentials in .tf files (Use Doppler secrets)
- Production Terraform state committed to git
- Resource drift without proper planning
- Manual infrastructure changes (Always use IaC)
- Mixing environments in single state file

## AI-AGENT OPTIMIZATION
- **ALLOWED:** Read all .tf files for infrastructure understanding
- **ALLOWED:** Suggest resource additions following existing patterns
- **ALLOWED:** Modify variables and outputs as needed
- **FORBIDDEN:** Execute tofu apply without review
- **FORBIDDEN:** Change provider configuration without testing
- **MUST DO:** Maintain environment separation
- **MUST NOT DO:** Add resources without corresponding outputs

## ENFORCEMENT SEMANTICS
- **MUST:** Use tofu plan before any apply
- **MUST NOT:** Commit secrets or state files
- **MUST:** Keep variables.tf and terraform.tfvars.example synchronized
- **MUST NOT:** Modify production resources without staging validation
- **MUST:** Document all resource changes in commit messages
- **MUST NOT:** Use terraform instead of tofu