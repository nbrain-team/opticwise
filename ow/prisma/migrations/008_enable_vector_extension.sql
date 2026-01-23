-- Enable pgvector extension (required for vector operations)
-- This must be run first before any vector columns can be created

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is installed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'pgvector extension failed to install. Please install it manually or contact your database administrator.';
  END IF;
END $$;

-- Now re-run the advanced AI agent migration to ensure all tables exist
-- This is safe because we use IF NOT EXISTS

-- ============================================
-- SEMANTIC CACHE - Cache frequent queries
-- ============================================
CREATE TABLE IF NOT EXISTS "SemanticCache" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query TEXT NOT NULL,
  "queryEmbedding" vector(1024) NOT NULL,
  response TEXT NOT NULL,
  sources JSONB,  -- What data sources were used
  model TEXT,
  "tokensUsed" INTEGER,
  "cacheHits" INTEGER DEFAULT 0,
  "lastHit" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,  -- When to invalidate this cache
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SemanticCache_queryEmbedding_idx" ON "SemanticCache" USING ivfflat ("queryEmbedding" vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS "SemanticCache_expiresAt_idx" ON "SemanticCache"("expiresAt");

COMMENT ON TABLE "SemanticCache" IS 'Caches similar queries to reduce API costs and latency';

-- Ensure all other tables with vector columns exist
-- Re-create StyleGuide if it doesn't have the embedding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'StyleGuide' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "StyleGuide" ADD COLUMN embedding vector(1024);
    CREATE INDEX IF NOT EXISTS "StyleGuide_embedding_idx" ON "StyleGuide" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- Ensure KnowledgeNode has embedding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'KnowledgeNode' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "KnowledgeNode" ADD COLUMN embedding vector(1024);
    CREATE INDEX IF NOT EXISTS "KnowledgeNode_embedding_idx" ON "KnowledgeNode" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- Ensure UserMemory has embedding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'UserMemory' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "UserMemory" ADD COLUMN embedding vector(1024);
    CREATE INDEX IF NOT EXISTS "UserMemory_embedding_idx" ON "UserMemory" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- Verify GmailMessage has embedding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'GmailMessage' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "GmailMessage" ADD COLUMN embedding vector(1024);
    CREATE INDEX IF NOT EXISTS "GmailMessage_embedding_idx" ON "GmailMessage" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- Verify GoogleDriveFile has embedding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'GoogleDriveFile' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "GoogleDriveFile" ADD COLUMN embedding vector(1024);
    CREATE INDEX IF NOT EXISTS "GoogleDriveFile_embedding_idx" ON "GoogleDriveFile" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'pgvector extension enabled and all vector columns verified successfully!';
END $$;
