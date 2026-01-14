-- Chat Feedback Table for Training/Tuning
-- Stores user comments on AI responses along with conversation context

CREATE TABLE IF NOT EXISTS "ChatFeedback" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionId" TEXT NOT NULL REFERENCES "AgentChatSession"(id) ON DELETE CASCADE,
    "messageId" TEXT NOT NULL REFERENCES "AgentChatMessage"(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    "conversationContext" JSONB,  -- Stores the full conversation history up to this point
    rating INTEGER,  -- Optional 1-5 rating
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS "ChatFeedback_sessionId_idx" ON "ChatFeedback"("sessionId");
CREATE INDEX IF NOT EXISTS "ChatFeedback_userId_idx" ON "ChatFeedback"("userId");
CREATE INDEX IF NOT EXISTS "ChatFeedback_createdAt_idx" ON "ChatFeedback"("createdAt");





