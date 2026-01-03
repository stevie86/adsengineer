output "worker_url" {
  description = "URL of the deployed worker"
  value       = var.environment != "production" ? "https://${cloudflare_worker_script.main.name}.workers.dev" : var.production_domain
}

output "database_id" {
  description = "ID of the D1 database"
  value       = cloudflare_d1_database.main.id
  sensitive   = false
}

output "kv_namespace_id" {
  description = "ID of the KV namespace for rate limiting"
  value       = cloudflare_workers_kv_namespace.rate_limit.id
}

output "worker_name" {
  description = "Name of the deployed worker"
  value       = cloudflare_worker_script.main.name
}
