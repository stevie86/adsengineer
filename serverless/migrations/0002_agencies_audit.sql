CREATE TABLE IF NOT EXISTS agencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  customer_id TEXT NOT NULL UNIQUE, -- Google Ads customer ID
  google_ads_config TEXT NOT NULL, -- Encrypted JSON with client_id, client_secret, refresh_token, developer_token
  meta_config TEXT, -- Encrypted JSON with access_token, pixel_id for Meta Conversions API
  conversion_action_id TEXT, -- Google Ads conversion action ID
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'conversion_upload', 'lead_capture', etc.
  result TEXT NOT NULL, -- 'success', 'failed', 'partial_failure'
  error TEXT,
  details TEXT, -- JSON string with additional data
  created_at TEXT NOT NULL,
  FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

CREATE INDEX idx_agencies_customer_id ON agencies(customer_id);
CREATE INDEX idx_audit_logs_agency_id ON audit_logs(agency_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);