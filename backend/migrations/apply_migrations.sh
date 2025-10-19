#!/bin/bash

# Script to apply SQL migrations manually
# Usage: ./apply_migrations.sh

set -e

# Database connection string
DB_URL="${DATABASE_URL:-postgresql://scraper_user:scraper_password@127.0.0.1:5432/scraper_db}"

echo "Applying migrations to database..."
echo "Database: $DB_URL"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Apply each migration file in order
for file in "$SCRIPT_DIR"/*.sql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Check if migration has been applied
        applied=$(psql "$DB_URL" -t -c "SELECT 1 FROM migrations WHERE filename = '$filename' LIMIT 1;" 2>/dev/null || echo "")
        
        if [ -z "$applied" ] || [ "$applied" != " 1" ]; then
            echo "Applying migration: $filename"
            psql "$DB_URL" -f "$file"
            echo "✓ Successfully applied: $filename"
            echo ""
        else
            echo "⊗ Skipping already applied migration: $filename"
        fi
    fi
done

echo ""
echo "All migrations applied successfully!"

