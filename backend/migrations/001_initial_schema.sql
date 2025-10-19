-- Migration: 001_initial_schema
-- Description: Create initial database schema with pgvector extension
-- Date: 2024-10-19

BEGIN;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_users_id ON users(id);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);

-- Create scraping_jobs table
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    website_url VARCHAR(1000) NOT NULL,
    job_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS ix_scraping_jobs_id ON scraping_jobs(id);
CREATE INDEX IF NOT EXISTS ix_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX IF NOT EXISTS ix_scraping_jobs_status ON scraping_jobs(status);

-- Create scraped_data table with vector embeddings
CREATE TABLE IF NOT EXISTS scraped_data (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES scraping_jobs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    url VARCHAR(1000) NOT NULL,
    embedding vector(768),
    extra_metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_scraped_data_id ON scraped_data(id);
CREATE INDEX IF NOT EXISTS ix_scraped_data_job_id ON scraped_data(job_id);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS scraped_data_embedding_idx ON scraped_data 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Record this migration
INSERT INTO migrations (filename) VALUES ('001_initial_schema.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

