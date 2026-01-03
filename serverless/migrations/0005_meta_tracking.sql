-- Add Microsoft Ads Click ID support
ALTER TABLE leads ADD COLUMN msclkid TEXT;

-- Update existing records to have msclkid column
-- (SQLite ALTER TABLE automatically handles this)

-- Add to technology tracking
INSERT OR IGNORE INTO technologies (name, category, description) VALUES
('Meta Ads', 'ads', 'Facebook/Instagram advertising platform - PARTIALLY SUPPORTED'),
('Microsoft Ads', 'ads', 'Microsoft/Bing advertising platform - NOT SUPPORTED');

-- Migration completed
INSERT INTO conversion_logs (job_id, agency_id, batch_size, success_count, failure_count, retry_count, errors, processing_time, created_at)
SELECT 'migration-meta-tracking', 'system', 0, 0, 0, 0, 'Meta and Microsoft Ads tracking migration applied', 0, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM conversion_logs WHERE job_id = 'migration-meta-tracking');