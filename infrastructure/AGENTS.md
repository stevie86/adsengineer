# INFRASTRUCTURE KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** Cloud Infrastructure (OpenTofu/Terraform)
**Purpose:** IaC for Cloudflare Workers, D1 database, KV namespaces

## OVERVIEW
Complete IaC setup using OpenTofu to provision Cloudflare resources.

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

## CONVENTIONS
- **Tooling:** OpenTofu (`tofu`) ONLY. No Terraform (`terraform`).
- **Secrets:** Doppler integration for sensitive values.
- **State:** Local state (dev), Remote state (prod - planned).
- **Naming:** Environment-prefixed (dev/staging/prod).

## ANTI-PATTERNS
- Hardcoded credentials in .tf files (Use Doppler).
- Committing `.tfstate` files.
- Manual infrastructure changes (Clicking in dashboard).
- Using `terraform apply` (Use `tofu apply`).
