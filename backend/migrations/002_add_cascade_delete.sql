BEGIN;

-- Drop the existing foreign key constraint
ALTER TABLE scraped_data 
DROP CONSTRAINT IF EXISTS scraped_data_job_id_fkey;

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE scraped_data 
ADD CONSTRAINT scraped_data_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES scraping_jobs(id) ON DELETE CASCADE;

-- Record this migration
INSERT INTO migrations (filename) VALUES ('002_add_cascade_delete.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

