locals {
  worker_names = {
    development = "${var.worker_name}-dev"
    staging     = "${var.worker_name}-staging"
    production  = var.worker_name
  }

  current_worker_name = local.worker_names[var.environment]
}

data "cloudflare_accounts" "current" {
  count = var.account_id == null ? 1 : 0
}

locals {
  account_id = var.account_id != null ? var.account_id : data.cloudflare_accounts.current[0].accounts[0].id
}

resource "cloudflare_d1_database" "main" {
  account_id = local.account_id
  name       = var.database_name
  comment    = "AdsEngineer conversion tracking database - ${var.environment}"
}

resource "cloudflare_worker_script" "main" {
  account_id    = local.account_id
  name          = local.current_worker_name
  content       = filebase64("${path.module}/../serverless/dist/worker.js")
  compatibility_date = "2024-08-20"
  compatibility_flags = ["nodejs_compat"]

  d1_database_binding {
    binding = "DB"
    database_id = cloudflare_d1_database.main.id
  }
}

resource "cloudflare_worker_route" "main" {
  count       = var.environment != "production" ? 1 : 0
  zone_id     = var.cloudflare_zone_id
  pattern     = "${var.worker_name}*.workers.dev/*"
  script_name = cloudflare_worker_script.main.name
}

resource "cloudflare_workers_kv_namespace" "rate_limit" {
  account_id = local.account_id
  title       = "${var.worker_name}-rate-limit-${var.environment}"
}

# Custom domain for production worker
resource "cloudflare_worker_domain" "main" {
  count       = var.environment == "production" ? 1 : 0
  zone_id     = var.cloudflare_zone_id != null ? var.cloudflare_zone_id : data.cloudflare_zones.domain[0].id
  domain      = var.production_domain
  script_name = cloudflare_worker_script.main.name
}

# Get Cloudflare zone for the custom domain
data "cloudflare_zones" "domain" {
  count = var.environment == "production" && var.cloudflare_zone_id == null ? 1 : 0
  filter {
    name = var.production_domain
  }
}
