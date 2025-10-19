BEGIN;

-- Add user profile and preference columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Record this migration
INSERT INTO migrations (filename) VALUES ('007_add_user_preferences.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

