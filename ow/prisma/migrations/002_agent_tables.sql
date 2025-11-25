-- Agent Chat Tables for Opticwise
-- Simplified schema that works with existing User table

CREATE TABLE IF NOT EXISTS "AgentChatSession" (
  id TEXT PRIMARY KEY DEFAULT ('ags_' || gen_random_uuid()::text),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "dealId" TEXT REFERENCES "Deal"(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AgentChatMessage" (
  id TEXT PRIMARY KEY DEFAULT ('agm_' || gen_random_uuid()::text),
  "sessionId" TEXT NOT NULL REFERENCES "AgentChatSession"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AgentChatSession_userId_idx" ON "AgentChatSession"("userId");
CREATE INDEX IF NOT EXISTS "AgentChatMessage_sessionId_idx" ON "AgentChatMessage"("sessionId");

