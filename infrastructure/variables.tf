variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token with Account:Workers Scripts and Account:Workers KV Storage permissions"
  sensitive   = true
}

variable "account_id" {
  type        = string
  description = "Cloudflare account ID"
  default     = null
}

variable "environment" {
  type        = string
  description = "Environment name (development, staging, production)"
  default     = "development"
}

variable "worker_name" {
  type        = string
  description = "Name of the Cloudflare Worker"
  default     = "advocate-cloud"
}

variable "database_name" {
  type        = string
  description = "Name of the D1 database"
  default     = "advocate-db"
}
