-- Support Agent: Chat sessions and messages
-- Separate from OWnet internal agent tables

CREATE TABLE IF NOT EXISTS "SupportChatSession" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "visitorId" TEXT NOT NULL,
  "customerName" TEXT,
  "customerEmail" TEXT,
  "propertyName" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  status TEXT NOT NULL DEFAULT 'active',
  channel TEXT NOT NULL DEFAULT 'chat',
  "ticketId" TEXT,
  "escalatedAt" TIMESTAMP,
  "escalatedTo" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupportChatMessage" (
  id SERIAL PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "SupportChatSession"(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  intent TEXT,
  confidence FLOAT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionId" TEXT REFERENCES "SupportChatSession"(id) ON DELETE SET NULL,
  "customerName" TEXT,
  "customerEmail" TEXT,
  "propertyName" TEXT,
  category TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  "stepsAttempted" TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  "assignedTo" TEXT,
  "resolvedAt" TIMESTAMP,
  "resolution" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupportFeedback" (
  id SERIAL PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "SupportChatSession"(id) ON DELETE CASCADE,
  "messageId" INT REFERENCES "SupportChatMessage"(id) ON DELETE SET NULL,
  rating INT,
  comment TEXT,
  category TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupportIngestionLog" (
  id SERIAL PRIMARY KEY,
  "emailCount" INT NOT NULL,
  "transcriptCount" INT NOT NULL,
  "totalChunks" INT NOT NULL,
  "pineconeNamespace" TEXT NOT NULL,
  "ingestedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_session_visitor ON "SupportChatSession"("visitorId");
CREATE INDEX IF NOT EXISTS idx_support_session_status ON "SupportChatSession"(status);
CREATE INDEX IF NOT EXISTS idx_support_session_created ON "SupportChatSession"("createdAt");
CREATE INDEX IF NOT EXISTS idx_support_message_session ON "SupportChatMessage"("sessionId");
CREATE INDEX IF NOT EXISTS idx_support_message_created ON "SupportChatMessage"("createdAt");
CREATE INDEX IF NOT EXISTS idx_support_ticket_status ON "SupportTicket"(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_session ON "SupportTicket"("sessionId");
CREATE INDEX IF NOT EXISTS idx_support_feedback_session ON "SupportFeedback"("sessionId");
