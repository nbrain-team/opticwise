-- Add vector search capability to EmailMessage (Sales Inbox)
-- This table contains actual customer email conversations

-- Add vectorization columns
ALTER TABLE "EmailMessage" ADD COLUMN IF NOT EXISTS embedding vector(1024);
ALTER TABLE "EmailMessage" ADD COLUMN IF NOT EXISTS vectorized BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS "EmailMessage_embedding_idx" 
ON "EmailMessage" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS "EmailMessage_vectorized_idx" 
ON "EmailMessage"(vectorized);

CREATE INDEX IF NOT EXISTS "EmailMessage_sentAt_idx" 
ON "EmailMessage"("sentAt");

-- Comments
COMMENT ON COLUMN "EmailMessage".embedding IS 'Vector embedding for semantic search of sales inbox emails';
COMMENT ON COLUMN "EmailMessage".vectorized IS 'Flag indicating if email has been vectorized';

-- Success
DO $$
BEGIN
  RAISE NOTICE 'EmailMessage vector columns added! Ready to vectorize sales inbox emails.';
END $$;
