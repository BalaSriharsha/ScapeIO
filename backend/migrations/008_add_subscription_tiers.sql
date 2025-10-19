BEGIN;

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_jobs INTEGER NOT NULL DEFAULT -1, -- -1 means unlimited
    max_pages_per_job INTEGER NOT NULL DEFAULT -1,
    max_storage_mb INTEGER NOT NULL DEFAULT -1,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default plans FIRST
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, max_jobs, max_pages_per_job, max_storage_mb, features) VALUES
('free', 'Free', 0, 0, 5, 10, 100, '["Basic analytics", "Community support", "5 scraping jobs", "10 pages per job", "100 MB storage"]'),
('pro', 'Pro', 29, 290, -1, 500, 10240, '["Unlimited scraping jobs", "500 pages per job", "10 GB storage", "Advanced analytics", "Priority support", "Custom depth up to 5", "API access"]'),
('enterprise', 'Enterprise', 0, 0, -1, -1, -1, '["Unlimited everything", "Unlimited storage", "White-label chatbot", "Dedicated support", "Custom integrations", "SLA guarantee", "Team collaboration"]')
ON CONFLICT (name) DO NOTHING;

-- Add subscription columns to users table AFTER plans exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_plan_id INTEGER REFERENCES subscription_plans(id) DEFAULT 1,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Record this migration
INSERT INTO migrations (filename) VALUES ('008_add_subscription_tiers.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

