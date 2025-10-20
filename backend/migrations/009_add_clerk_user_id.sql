-- Add Clerk user ID column to users table
-- Migration 009: Add Clerk authentication support

ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Allow hashed_password to be nullable for Clerk users
ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;

