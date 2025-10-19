BEGIN;

-- Add progress tracking columns to scraping_jobs
ALTER TABLE scraping_jobs 
ADD COLUMN pages_found INTEGER DEFAULT 0,
ADD COLUMN pages_scraped INTEGER DEFAULT 0,
ADD COLUMN current_url TEXT NULL;

-- Record this migration
INSERT INTO migrations (filename) VALUES ('004_add_progress_tracking.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

