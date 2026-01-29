# Cloudflare Workers Monitoring Infrastructure

resource "cloudflare_logpush_job" "worker_logs" {
  name        = "worker-logs"
  account_id  = var.account_id
  destination_conf = {
    name = "analytics-prod-bucket"
    format = "json"
    batch_format = "json-array"
    # Output to Cloudflare R2 or S3
    path = "/worker-logs/{DATE}"
  }
  filter = "where http_response_status_code >= 500"

  # Retention policy
  retention_days = 90
}

# Alerting for worker failures
resource "cloudflare_ruleset" "worker_alerts" {
  name = "worker-error-alerts"
  account_id = var.account_id
  kind = "block"
  phase = "http_response_firewall_custom"
  description = "Alert on worker failures"

  rules {
    action = "skip"
    expression = "http_response_status_code eq 500"
    enabled = true
  }
}

# D1 Analytics Tables
resource "cloudflare_d1_database" "analytics_db" {
  account_id = var.account_id
  name        = "analytics-prod"
}

resource "cloudflare_d1_database_schema" "analytics_tables" {
  database_id = cloudflare_d1_database.analytics_db.id
  schema = <<-EOF
    CREATE TABLE requests (
      id INTEGER PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      event_type TEXT,
      user_id TEXT,
      session_id TEXT,
      page_url TEXT,
      referrer_url TEXT,
      user_agent TEXT,
      ip_address TEXT,
      status_code INTEGER,
      response_time_ms INTEGER,
      metadata TEXT
    );
    
    CREATE TABLE conversions (
      id INTEGER PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      event_type TEXT UNIQUE NOT NULL,
      platform TEXT,
      platform_event_id TEXT,
      metadata TEXT,
      attribution_data TEXT,
      processed BOOLEAN DEFAULT FALSE
    );
    
    CREATE INDEX idx_requests_user_id ON requests(user_id);
    CREATE INDEX idx_requests_timestamp ON requests(timestamp);
    CREATE INDEX idx_conversions_event_type ON conversions(event_type);
  EOF
}

# Analytics Dashboard (optional R2 or external)
locals {
  analytics_config = {
    enable_d1_analytics = true
    enable_error_tracking = true
    enable_performance_monitoring = true
    error_notification_webhook = var.error_webhook_url
  }
}