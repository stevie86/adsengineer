

CREATE TABLE technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE lead_technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL,
  technology_id INTEGER NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  confidence_score REAL DEFAULT 1.0
);

CREATE INDEX idx_lead_technologies_lead_id ON lead_technologies(lead_id);
CREATE INDEX idx_lead_technologies_technology_id ON lead_technologies(technology_id);
CREATE INDEX idx_lead_technologies_detected_at ON lead_technologies(detected_at);