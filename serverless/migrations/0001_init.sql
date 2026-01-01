CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  gclid TEXT,
  fbclid TEXT,
  external_id TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  lead_score INTEGER DEFAULT 0,
  base_value_cents INTEGER DEFAULT 0,
  adjusted_value_cents INTEGER DEFAULT 0,
  value_multiplier REAL DEFAULT 1.0,
  status TEXT DEFAULT 'new',
  vertical TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX idx_leads_org_id ON leads(org_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);

CREATE TABLE IF NOT EXISTS optimization_triggers (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  lead_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_triggers_org_id ON optimization_triggers(org_id);

CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  agency_name TEXT,
  website TEXT,
  monthly_ad_spend TEXT,
  pain_point TEXT,
  referral_source TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  company_name TEXT,
  website TEXT,
  ghl_location_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);

CREATE TABLE IF NOT EXISTS agreements (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  agreement_type TEXT NOT NULL,
  agreement_version TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  consent_text_hash TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_agreements_customer_id ON agreements(customer_id);
CREATE INDEX idx_agreements_type ON agreements(agreement_type);
CREATE INDEX idx_agreements_accepted_at ON agreements(accepted_at);
