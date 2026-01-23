#!/bin/bash
# Run this script in Render shell to fix the vector extension issue

set -e

echo "🔧 Fixing PostgreSQL vector extension issue..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Enable vector extension and run migration
echo "📦 Enabling pgvector extension..."
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ pgvector extension enabled"
else
  echo "❌ Failed to enable pgvector extension"
  echo "   You may need superuser privileges or contact Render support"
  exit 1
fi

echo ""
echo "🗄️  Running vector migration..."
cd ow && psql "$DATABASE_URL" -f prisma/migrations/008_enable_vector_extension.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "🔍 Verifying installation..."
  
  # Verify
  psql "$DATABASE_URL" -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
  psql "$DATABASE_URL" -c "SELECT COUNT(*) as semantic_cache_exists FROM information_schema.tables WHERE table_name = 'SemanticCache';"
  
  echo ""
  echo "✅ All done! The OWnet agent should now work properly."
else
  echo "❌ Migration failed"
  exit 1
fi
