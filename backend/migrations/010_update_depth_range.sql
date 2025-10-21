-- Migration: Update depth range to allow 0
-- Date: 2025-10-20
-- Description: Update CHECK constraint to allow depth 0 for single-page scraping (e.g., LinkedIn profiles)

-- Drop the old constraint
ALTER TABLE scraping_jobs DROP CONSTRAINT IF EXISTS depth_range;

-- Add new constraint that allows depth 0-5
ALTER TABLE scraping_jobs ADD CONSTRAINT depth_range CHECK (depth >= 0 AND depth <= 5);

