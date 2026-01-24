-- Add config column to agencies table
ALTER TABLE agencies ADD COLUMN config TEXT DEFAULT '{}';
