-- Create Chunk Tables for Better Vector Search
-- Mimics Newbury Partners architecture with chunked content

-- ============================================
-- CALL TRANSCRIPT CHUNKS
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
CREATE INDEX IF NOT EXISTS "CallTranscriptChunk_embedding_idx" 
  ON "CallTranscriptChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE "CallTranscriptChunk" IS 'Chunked call transcripts for precise vector search (500 words per chunk)';

-- ============================================
-- DRIVE FILE CHUNKS
-- ============================================
CREATE TABLE IF NOT EXISTS "DriveFileChunk" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fileId" TEXT NOT NULL REFERENCES "DriveFile"(id) ON DELETE CASCADE,
  "chunkIndex" INTEGER NOT NULL,
  "chunkText" TEXT NOT NULL,
  "wordCount" INTEGER,
  embedding vector(1024),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE("fileId", "chunkIndex")
);

CREATE INDEX IF NOT EXISTS "DriveFileChunk_fileId_idx" ON "DriveFileChunk"("fileId");
CREATE INDEX IF NOT EXISTS "DriveFileChunk_chunkIndex_idx" ON "DriveFileChunk"("chunkIndex");
CREATE INDEX IF NOT EXISTS "DriveFileChunk_embedding_idx" 
  ON "DriveFileChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE "DriveFileChunk" IS 'Chunked Google Drive documents for precise vector search';

-- ============================================
-- EMAIL MESSAGE CHUNKS (for very long emails)
-- ============================================
CREATE TABLE IF NOT EXISTS "EmailChunk" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "emailId" TEXT NOT NULL,
  "emailType" TEXT NOT NULL, -- 'gmail' or 'sales_inbox'
  "chunkIndex" INTEGER NOT NULL,
  "chunkText" TEXT NOT NULL,
  "wordCount" INTEGER,
  embedding vector(1024),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE("emailId", "emailType", "chunkIndex")
);

CREATE INDEX IF NOT EXISTS "EmailChunk_emailId_idx" ON "EmailChunk"("emailId");
CREATE INDEX IF NOT EXISTS "EmailChunk_emailType_idx" ON "EmailChunk"("emailType");
CREATE INDEX IF NOT EXISTS "EmailChunk_embedding_idx" 
  ON "EmailChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE "EmailChunk" IS 'Chunked long emails for precise vector search';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Chunk tables created successfully! Ready to implement Newbury-style chunking.';
END $$;
