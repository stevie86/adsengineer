# INFRASTRUCTURE AS CODE

OpenTofu configuration for Cloudflare infrastructure.

## STRUCTURE
```
infrastructure/
├── main.tf              # Resource definitions
├── variables.tf         # Input variables
├── outputs.tf           # Output values
└── providers.tf         # Provider config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Resources | main.tf | Workers, D1, KV |
| Variables | variables.tf | Tokens, Account IDs |
| Outputs | outputs.tf | Deployed URLs |

## CONVENTIONS
- **Naming:** Environment-based (dev/staging/prod)
- **State:** Local storage (development)
- **Tooling:** OpenTofu (tofu)

## ANTI-PATTERNS
- Hardcoded credentials in .tf (Use Doppler)
- Production state in git
- Resource drift (Always use tofu apply)
