BEGIN;

-- Add depth and authentication columns to scraping_jobs
ALTER TABLE scraping_jobs 
ADD COLUMN depth INTEGER DEFAULT 2 NOT NULL,
ADD COLUMN auth_credentials TEXT NULL;

-- Add constraint to ensure depth is between 1 and 5
ALTER TABLE scraping_jobs 
ADD CONSTRAINT depth_range CHECK (depth >= 1 AND depth <= 5);

-- Record this migration
INSERT INTO migrations (filename) VALUES ('003_add_depth_and_auth.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

