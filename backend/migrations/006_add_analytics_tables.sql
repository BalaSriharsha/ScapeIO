BEGIN;

-- Chat interactions table to track all chatbot conversations
CREATE TABLE IF NOT EXISTS chat_interactions (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES scraping_jobs(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    response_time_ms INTEGER,
    sources_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_chat_interactions_job_id ON chat_interactions (job_id);
CREATE INDEX IF NOT EXISTS ix_chat_interactions_user_id ON chat_interactions (user_id);
CREATE INDEX IF NOT EXISTS ix_chat_interactions_created_at ON chat_interactions (created_at);

-- Usage metrics table to track storage and API usage
CREATE TABLE IF NOT EXISTS usage_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES scraping_jobs(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'embedding_storage', 'content_size', 'api_calls'
    metric_value BIGINT NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, job_id, metric_type, date)
);

CREATE INDEX IF NOT EXISTS ix_usage_metrics_user_id ON usage_metrics (user_id);
CREATE INDEX IF NOT EXISTS ix_usage_metrics_date ON usage_metrics (date);

-- Record this migration
INSERT INTO migrations (filename) VALUES ('006_add_analytics_tables.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

