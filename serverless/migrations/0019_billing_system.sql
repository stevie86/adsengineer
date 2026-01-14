CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  trial_start TEXT,
  trial_end TEXT,
  canceled_at TEXT,
  ended_at TEXT,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stripe_price_id TEXT UNIQUE,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  interval TEXT DEFAULT 'month',
  lead_limit INTEGER NOT NULL,
  features TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  data TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE TABLE IF NOT EXISTS usage_metrics (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  limit_count INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (agency_id) REFERENCES customers(id),
  UNIQUE(agency_id, metric_type, period_start)
);

INSERT OR IGNORE INTO pricing_tiers (
  id, name, price_cents, currency, interval, lead_limit, features, created_at
) VALUES
(
  'starter',
  'Starter',
  9900,
  'usd',
  'month',
  1000,
  '["Basic conversion tracking", "Google Ads integration", "Email support", "Standard analytics", "1 website"]',
  datetime('now')
),
(
  'professional',
  'Professional', 
  29900,
  'usd',
  'month',
  10000,
  '["Advanced conversion tracking", "Multi-platform integration (Google, Facebook, TikTok)", "Priority support", "Custom analytics dashboard", "5 websites", "API access", "White-label reporting"]',
  datetime('now')
),
(
  'enterprise',
  'Enterprise',
  99900,
  'usd', 
  'month',
  -1,
  '["Unlimited conversion tracking", "All platform integrations", "Dedicated success manager", "Custom integrations", "Unlimited websites", "Advanced API access", "Custom reporting", "SLA guarantee", "Onboarding consultation"]',
  datetime('now')
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_agency_id ON subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_billing_events_subscription_id ON billing_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_processed ON billing_events(processed);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_agency_id ON usage_metrics(agency_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON usage_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);