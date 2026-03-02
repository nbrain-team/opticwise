-- Consolidated migration to fix all missing tables and columns
-- Run this on Render shell: psql $DATABASE_URL -f prisma/migrations/014_fix_missing_tables.sql

-- ============================================
-- 1. Enable pgvector extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. StyleGuide table
-- ============================================
CREATE TABLE IF NOT EXISTS "StyleGuide" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL,
  subcategory TEXT,
  content TEXT NOT NULL,
  tone TEXT,
  author TEXT,
  context TEXT,
  embedding vector(1024),
  vectorized BOOLEAN DEFAULT false,
  metadata JSONB,
  "usageCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "StyleGuide_category_idx" ON "StyleGuide"(category);
CREATE INDEX IF NOT EXISTS "StyleGuide_subcategory_idx" ON "StyleGuide"(subcategory);
CREATE INDEX IF NOT EXISTS "StyleGuide_vectorized_idx" ON "StyleGuide"(vectorized);

-- ============================================
-- 3. QueryAnalytics table
-- ============================================
CREATE TABLE IF NOT EXISTS "QueryAnalytics" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionId" TEXT REFERENCES "AgentChatSession"(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  "queryType" TEXT,
  "sourcesUsed" JSONB,
  "sourcesCount" INTEGER,
  "responseLength" INTEGER,
  "responseTime" INTEGER,
  "tokensUsed" INTEGER,
  model TEXT,
  temperature FLOAT,
  "maxTokens" INTEGER,
  "contextWindowUsed" INTEGER,
  "wasHelpful" BOOLEAN,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "QueryAnalytics_sessionId_idx" ON "QueryAnalytics"("sessionId");
CREATE INDEX IF NOT EXISTS "QueryAnalytics_queryType_idx" ON "QueryAnalytics"("queryType");
CREATE INDEX IF NOT EXISTS "QueryAnalytics_createdAt_idx" ON "QueryAnalytics"("createdAt");

-- ============================================
-- 4. SemanticCache table
-- ============================================
CREATE TABLE IF NOT EXISTS "SemanticCache" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query TEXT NOT NULL,
  "queryEmbedding" vector(1024) NOT NULL,
  response TEXT NOT NULL,
  sources JSONB,
  model TEXT,
  "tokensUsed" INTEGER,
  "cacheHits" INTEGER DEFAULT 0,
  "lastHit" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SemanticCache_expiresAt_idx" ON "SemanticCache"("expiresAt");

-- ============================================
-- 5. CallTranscriptChunk table
-- ============================================
CREATE TABLE IF NOT EXISTS "CallTranscriptChunk" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transcriptId" TEXT NOT NULL REFERENCES "CallTranscript"(id) ON DELETE CASCADE,
  "chunkIndex" INTEGER NOT NULL,
  "chunkText" TEXT NOT NULL,
  "wordCount" INTEGER,
  embedding vector(1024),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("transcriptId", "chunkIndex")
);

CREATE INDEX IF NOT EXISTS "CallTranscriptChunk_transcriptId_idx" ON "CallTranscriptChunk"("transcriptId");
CREATE INDEX IF NOT EXISTS "CallTranscriptChunk_chunkIndex_idx" ON "CallTranscriptChunk"("chunkIndex");

-- ============================================
-- 6. Add vector columns to EmailMessage
-- ============================================
ALTER TABLE "EmailMessage" ADD COLUMN IF NOT EXISTS embedding vector(1024);
ALTER TABLE "EmailMessage" ADD COLUMN IF NOT EXISTS vectorized BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS "EmailMessage_vectorized_idx" ON "EmailMessage"(vectorized);
CREATE INDEX IF NOT EXISTS "EmailMessage_sentAt_idx" ON "EmailMessage"("sentAt");

-- ============================================
-- 7. Fix GmailMessage embedding column type
--    Prisma creates it as TEXT but we need vector(1024)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GmailMessage' AND column_name = 'embedding'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "GmailMessage" DROP COLUMN embedding;
    ALTER TABLE "GmailMessage" ADD COLUMN embedding vector(1024);
    RAISE NOTICE 'GmailMessage.embedding converted from TEXT to vector(1024)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GmailMessage' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "GmailMessage" ADD COLUMN embedding vector(1024);
    RAISE NOTICE 'GmailMessage.embedding column created as vector(1024)';
  END IF;
END $$;

-- ============================================
-- 8. Fix CalendarEvent embedding column type
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'CalendarEvent' AND column_name = 'embedding'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "CalendarEvent" DROP COLUMN embedding;
    ALTER TABLE "CalendarEvent" ADD COLUMN embedding vector(1024);
    RAISE NOTICE 'CalendarEvent.embedding converted from TEXT to vector(1024)';
  END IF;
END $$;

-- ============================================
-- 9. Fix DriveFile embedding column type
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'DriveFile' AND column_name = 'embedding'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "DriveFile" DROP COLUMN embedding;
    ALTER TABLE "DriveFile" ADD COLUMN embedding vector(1024);
    RAISE NOTICE 'DriveFile.embedding converted from TEXT to vector(1024)';
  END IF;
END $$;

-- ============================================
-- 10. Add vector column to CallTranscript if needed
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'CallTranscript' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE "CallTranscript" ADD COLUMN embedding vector(1024);
    RAISE NOTICE 'CallTranscript.embedding column created';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'CallTranscript' AND column_name = 'embedding'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "CallTranscript" DROP COLUMN embedding;
    ALTER TABLE "CallTranscript" ADD COLUMN embedding vector(1024);
    RAISE NOTICE 'CallTranscript.embedding converted from TEXT to vector(1024)';
  END IF;
END $$;

-- ============================================
-- 11. Add embedding to KnowledgeChunk if missing
-- ============================================
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- ============================================
-- Done
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 014 complete: All missing tables and vector columns fixed.';
END $$;
