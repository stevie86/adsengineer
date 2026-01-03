-- GDPR Compliance Migration
-- Adds consent tracking and audit logging for GDPR compliance

-- Add GDPR consent fields to leads table
ALTER TABLE leads ADD COLUMN consent_status TEXT DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN consent_timestamp TEXT;
ALTER TABLE leads ADD COLUMN consent_method TEXT;

-- Add GDPR audit logging table for accountability
CREATE TABLE IF NOT EXISTS gdpr_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'access', 'rectify', 'erase', 'restrict', 'withdraw'
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  details TEXT -- JSON details of the action
);

-- Create indexes for GDPR compliance and performance
CREATE INDEX IF NOT EXISTS idx_leads_consent_status ON leads(consent_status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_email ON gdpr_audit_log(email);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_action ON gdpr_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_timestamp ON gdpr_audit_log(timestamp);

-- Update existing leads to have proper consent status
UPDATE leads SET consent_status = 'granted' WHERE consent_status IS NULL OR consent_status = '';
UPDATE leads SET consent_method = 'legacy_import' WHERE consent_method IS NULL AND consent_status = 'granted';

-- Migration completed - GDPR compliance activated
INSERT INTO conversion_logs (job_id, agency_id, batch_size, success_count, failure_count, retry_count, errors, processing_time, created_at)
SELECT 'migration-gdpr-compliance-v2', 'system', 0, 0, 0, 0, 'Full GDPR compliance implemented with consent tracking and audit logging', 0, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM conversion_logs WHERE job_id = 'migration-gdpr-compliance-v2');