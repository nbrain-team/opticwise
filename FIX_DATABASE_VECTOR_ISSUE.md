# Fix Database Vector Extension Issue

## Problem
The OWnet agent is failing with these errors:
```
error: type "vector" does not exist
error: relation "SemanticCache" does not exist
```

## Root Cause
The PostgreSQL `vector` extension (pgvector) is not enabled in the Render database, and the advanced AI agent tables were never created.

## Solution

### Step 1: Enable pgvector Extension on Render

**Option A: Via Render Shell (Recommended)**
```bash
# Connect to Render shell
# Then run:
cd ow && npx ts-node -e "
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('CREATE EXTENSION IF NOT EXISTS vector;')
  .then(() => console.log('✅ pgvector enabled'))
  .catch(err => console.error('❌ Error:', err))
  .finally(() => pool.end());
"
```

**Option B: Via Migration Script**
```bash
# In Render shell:
cd ow && psql $DATABASE_URL -f prisma/migrations/008_enable_vector_extension.sql
```

### Step 2: Run the Advanced AI Agent Migration

After enabling the vector extension, run:
```bash
cd ow && psql $DATABASE_URL -f prisma/migrations/007_advanced_ai_agent.sql
```

Or run the new combined migration:
```bash
cd ow && psql $DATABASE_URL -f prisma/migrations/008_enable_vector_extension.sql
```

### Step 3: Verify Installation

```sql
-- Check if vector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if SemanticCache table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'SemanticCache';

-- Check if vector columns exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE data_type = 'USER-DEFINED' 
AND udt_name = 'vector';
```

## Why This Happened

1. The `007_advanced_ai_agent.sql` migration file exists but was never run on Render
2. The pgvector extension needs to be explicitly enabled before creating vector columns
3. Without the extension, PostgreSQL doesn't recognize the `vector` data type

## Tables That Need Vector Support

- `SemanticCache` - Query caching
- `StyleGuide` - Writing style examples
- `KnowledgeNode` - Entity knowledge graph
- `UserMemory` - User preferences
- `GmailMessage` - Email embeddings
- `GoogleDriveFile` - Document embeddings

## Prevention

The new migration `008_enable_vector_extension.sql` will:
1. Enable the vector extension first
2. Create all missing tables
3. Add missing vector columns to existing tables
4. Create all necessary indexes

This migration is idempotent and safe to run multiple times.
