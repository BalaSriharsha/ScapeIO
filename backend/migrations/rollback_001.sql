-- Rollback Migration: 001_initial_schema
-- Description: Rollback initial database schema
-- Date: 2024-10-19

BEGIN;

-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS scraped_data CASCADE;
DROP TABLE IF EXISTS scraping_jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Remove migration record
DELETE FROM migrations WHERE filename = '001_initial_schema.sql';

-- Note: We don't drop the migrations table or vector extension
-- as they might be needed for future migrations

COMMIT;

