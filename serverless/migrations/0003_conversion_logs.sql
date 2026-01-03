CREATE TABLE IF NOT EXISTS conversion_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  job_id TEXT NOT NULL,
  agency_id TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  errors TEXT, -- JSON array of error messages
  processing_time INTEGER, -- Processing time in milliseconds
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

CREATE INDEX idx_conversion_logs_job_id ON conversion_logs(job_id);
CREATE INDEX idx_conversion_logs_agency_id ON conversion_logs(agency_id);
CREATE INDEX idx_conversion_logs_created_at ON conversion_logs(created_at);