# Database Migrations

This directory contains SQL migration files for the database schema.

## Structure

- `001_initial_schema.sql` - Initial database schema with users, jobs, and vector embeddings
- `rollback_001.sql` - Rollback script for the initial schema
- `apply_migrations.sh` - Script to automatically apply all pending migrations

## How to Use

### Automatic Application (Recommended)

```bash
cd backend/migrations
./apply_migrations.sh
```

This script will:
1. Check which migrations have been applied
2. Apply any pending migrations in order
3. Track applied migrations in the `migrations` table

### Manual Application

If you prefer to run migrations manually with `psql`:

```bash
# Set your database URL (or export it)
export DATABASE_URL="postgresql://scraper_user:scraper_password@127.0.0.1:5432/scraper_db"

# Apply a specific migration
psql $DATABASE_URL -f 001_initial_schema.sql

# Or without environment variable
psql postgresql://scraper_user:scraper_password@127.0.0.1:5432/scraper_db -f 001_initial_schema.sql
```

### Check Applied Migrations

```bash
psql $DATABASE_URL -c "SELECT * FROM migrations ORDER BY applied_at;"
```

### Rollback a Migration

```bash
psql $DATABASE_URL -f rollback_001.sql
```

## Creating New Migrations

1. Create a new file with sequential numbering: `002_your_migration_name.sql`

2. Follow this template:

```sql
-- Migration: 002_your_migration_name
-- Description: Brief description of what this migration does
-- Date: YYYY-MM-DD

BEGIN;

-- Your SQL changes here
-- Examples:
-- ALTER TABLE users ADD COLUMN phone VARCHAR(20);
-- CREATE INDEX idx_users_phone ON users(phone);

-- Record this migration
INSERT INTO migrations (filename) VALUES ('002_your_migration_name.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
```

3. (Optional) Create a rollback file: `rollback_002.sql`

```sql
-- Rollback Migration: 002_your_migration_name
-- Description: Rollback your migration
-- Date: YYYY-MM-DD

BEGIN;

-- Reverse your changes here
-- ALTER TABLE users DROP COLUMN phone;

-- Remove migration record
DELETE FROM migrations WHERE filename = '002_your_migration_name.sql';

COMMIT;
```

## Migration Tracking

All applied migrations are tracked in the `migrations` table:

```sql
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

This table is automatically created by `001_initial_schema.sql`.

## Best Practices

1. **Always use transactions**: Wrap your migrations in `BEGIN;` and `COMMIT;`
2. **Test rollbacks**: Create and test rollback scripts for complex migrations
3. **Sequential naming**: Use `001_`, `002_`, `003_`, etc. for ordering
4. **Descriptive names**: Use clear names like `add_user_avatar_column.sql`
5. **One migration per change**: Keep migrations focused on a single logical change
6. **Never modify applied migrations**: Create a new migration to fix issues
7. **Document changes**: Add comments explaining what and why

## Troubleshooting

### Migration fails mid-way
If a migration fails, the transaction will be rolled back. Fix the issue and reapply.

### Migration marked as applied but didn't complete
```bash
# Remove the migration record and reapply
psql $DATABASE_URL -c "DELETE FROM migrations WHERE filename = 'XXX_migration.sql';"
psql $DATABASE_URL -f XXX_migration.sql
```

### Reset all migrations (DANGER: Data Loss!)
```bash
# Drop all tables and start fresh
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
./apply_migrations.sh
```

