BEGIN;

-- Create table to track individual page scraping status
CREATE TABLE IF NOT EXISTS scraped_pages (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, failed
    depth INTEGER DEFAULT 0,
    content_length INTEGER DEFAULT 0,
    error_message TEXT NULL,
    scraped_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (job_id) REFERENCES scraping_jobs(id) ON DELETE CASCADE,
    UNIQUE(job_id, url)
);

CREATE INDEX IF NOT EXISTS ix_scraped_pages_job_id ON scraped_pages (job_id);
CREATE INDEX IF NOT EXISTS ix_scraped_pages_status ON scraped_pages (status);

-- Record this migration
INSERT INTO migrations (filename) VALUES ('005_add_scraped_pages_tracking.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

