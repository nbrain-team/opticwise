-- Add proper vector column to CallTranscript table
-- This allows us to consolidate all vector search into PostgreSQL

-- Add the new vector column
ALTER TABLE "CallTranscript" ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Create vector index for semantic search
CREATE INDEX IF NOT EXISTS "CallTranscript_embedding_idx" 
ON "CallTranscript" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add index on vectorized flag
CREATE INDEX IF NOT EXISTS "CallTranscript_vectorized_idx" ON "CallTranscript"(vectorized);

-- Comment
COMMENT ON COLUMN "CallTranscript".embedding IS 'Vector embedding for semantic search (pgvector format)';
COMMENT ON COLUMN "CallTranscript"."vectorEmbedding" IS 'Legacy text embedding field (deprecated, use embedding column)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'CallTranscript vector column added successfully! Ready to migrate from Pinecone.';
END $$;
