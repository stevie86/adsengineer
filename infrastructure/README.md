# AdsEngineer Infrastructure

OpenTofu configuration for provisioning Cloudflare infrastructure.

## Quick Start

```bash
# Initialize
tofu init

# Plan changes (development)
tofu plan -var="environment=development"

# Apply changes
tofu apply -var="environment=development"
```

Or use the helper script from the root directory:

```bash
# Provision infrastructure with Doppler secrets
../provision-infrastructure.sh development
```

## Resources

- Cloudflare Worker (advocate-cloud)
- D1 Database (advocate-db)
- KV Namespace (rate limiting)
- Worker Routes (dev/staging)

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `cloudflare_api_token` | Cloudflare API token | (required) |
| `account_id` | Cloudflare account ID | null |
| `environment` | Environment name | development |
| `worker_name` | Worker name | advocate-cloud |
| `database_name` | Database name | advocate-db |

## Outputs

| Output | Description |
|--------|-------------|
| `worker_url` | Deployed worker URL |
| `database_id` | D1 database ID |
| `kv_namespace_id` | KV namespace ID |
| `worker_name` | Worker name |

## Secrets

All sensitive values are managed via Doppler. See `../doppler-secrets.template` for the complete list.

Set secrets:

```bash
doppler secrets set CLOUDFLARE_API_TOKEN <token>
doppler secrets set CLOUDFLARE_ACCOUNT_ID <id>
```

## Environments

- **development**: Local development and testing
- **staging**: Pre-production validation
- **production**: Live production environment

## Documentation

For detailed instructions, see [OpenTofu & Doppler Guide](../docs/opentofu-doppler-guide.md).
