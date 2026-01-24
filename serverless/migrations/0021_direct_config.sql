ALTER TABLE customers ADD COLUMN attribution_mode TEXT NOT NULL DEFAULT 'sgtm';
ALTER TABLE customers ADD COLUMN ga4_measurement_id TEXT;
ALTER TABLE customers ADD COLUMN ga4_api_secret TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_attribution_mode ON customers(attribution_mode);
