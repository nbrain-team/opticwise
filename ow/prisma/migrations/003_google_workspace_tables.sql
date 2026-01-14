-- Google Workspace Integration Tables
-- Enable pgvector extension for vector similarity search

CREATE EXTENSION IF NOT EXISTS vector;

-- Gmail Messages Table
CREATE TABLE IF NOT EXISTS "GmailMessage" (
  id TEXT PRIMARY KEY DEFAULT ('gm_' || gen_random_uuid()::text),
  "gmailMessageId" TEXT UNIQUE NOT NULL,
  "threadId" TEXT NOT NULL,
  subject TEXT,
  snippet TEXT,
  body TEXT,
  "bodyHtml" TEXT,
  "from" TEXT NOT NULL,
  "to" TEXT,
  cc TEXT,
  bcc TEXT,
  date TIMESTAMPTZ NOT NULL,
  labels TEXT,
  attachments JSONB,
  vectorized BOOLEAN DEFAULT false,
  embedding vector(1024),
  "dealId" TEXT REFERENCES "Deal"(id) ON DELETE SET NULL,
  "personId" TEXT REFERENCES "Person"(id) ON DELETE SET NULL,
  "organizationId" TEXT REFERENCES "Organization"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "GmailMessage_gmailMessageId_idx" ON "GmailMessage"("gmailMessageId");
CREATE INDEX IF NOT EXISTS "GmailMessage_threadId_idx" ON "GmailMessage"("threadId");
CREATE INDEX IF NOT EXISTS "GmailMessage_date_idx" ON "GmailMessage"(date);
CREATE INDEX IF NOT EXISTS "GmailMessage_from_idx" ON "GmailMessage"("from");
CREATE INDEX IF NOT EXISTS "GmailMessage_dealId_idx" ON "GmailMessage"("dealId");
CREATE INDEX IF NOT EXISTS "GmailMessage_personId_idx" ON "GmailMessage"("personId");
CREATE INDEX IF NOT EXISTS "GmailMessage_organizationId_idx" ON "GmailMessage"("organizationId");
CREATE INDEX IF NOT EXISTS "GmailMessage_vectorized_idx" ON "GmailMessage"(vectorized);
CREATE INDEX IF NOT EXISTS "GmailMessage_embedding_idx" ON "GmailMessage" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  id TEXT PRIMARY KEY DEFAULT ('ce_' || gen_random_uuid()::text),
  "googleEventId" TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  location TEXT,
  "startTime" TIMESTAMPTZ NOT NULL,
  "endTime" TIMESTAMPTZ NOT NULL,
  timezone TEXT,
  "allDay" BOOLEAN DEFAULT false,
  organizer TEXT,
  attendees JSONB,
  "meetingLink" TEXT,
  "conferenceData" JSONB,
  status TEXT,
  visibility TEXT,
  vectorized BOOLEAN DEFAULT false,
  embedding vector(1024),
  "dealId" TEXT REFERENCES "Deal"(id) ON DELETE SET NULL,
  "personId" TEXT REFERENCES "Person"(id) ON DELETE SET NULL,
  "organizationId" TEXT REFERENCES "Organization"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CalendarEvent_googleEventId_idx" ON "CalendarEvent"("googleEventId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime");
CREATE INDEX IF NOT EXISTS "CalendarEvent_organizer_idx" ON "CalendarEvent"(organizer);
CREATE INDEX IF NOT EXISTS "CalendarEvent_dealId_idx" ON "CalendarEvent"("dealId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_personId_idx" ON "CalendarEvent"("personId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_organizationId_idx" ON "CalendarEvent"("organizationId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_vectorized_idx" ON "CalendarEvent"(vectorized);
CREATE INDEX IF NOT EXISTS "CalendarEvent_embedding_idx" ON "CalendarEvent" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Drive Files Table
CREATE TABLE IF NOT EXISTS "DriveFile" (
  id TEXT PRIMARY KEY DEFAULT ('df_' || gen_random_uuid()::text),
  "googleFileId" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  description TEXT,
  size BIGINT,
  "webViewLink" TEXT,
  "thumbnailLink" TEXT,
  "iconLink" TEXT,
  content TEXT,
  "createdTime" TIMESTAMPTZ,
  "modifiedTime" TIMESTAMPTZ,
  "viewedTime" TIMESTAMPTZ,
  "ownedByMe" BOOLEAN DEFAULT false,
  owners JSONB,
  "sharedWith" JSONB,
  parents JSONB,
  "folderPath" TEXT,
  vectorized BOOLEAN DEFAULT false,
  embedding vector(1024),
  "dealId" TEXT REFERENCES "Deal"(id) ON DELETE SET NULL,
  "personId" TEXT REFERENCES "Person"(id) ON DELETE SET NULL,
  "organizationId" TEXT REFERENCES "Organization"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DriveFile_googleFileId_idx" ON "DriveFile"("googleFileId");
CREATE INDEX IF NOT EXISTS "DriveFile_mimeType_idx" ON "DriveFile"("mimeType");
CREATE INDEX IF NOT EXISTS "DriveFile_createdTime_idx" ON "DriveFile"("createdTime");
CREATE INDEX IF NOT EXISTS "DriveFile_modifiedTime_idx" ON "DriveFile"("modifiedTime");
CREATE INDEX IF NOT EXISTS "DriveFile_dealId_idx" ON "DriveFile"("dealId");
CREATE INDEX IF NOT EXISTS "DriveFile_personId_idx" ON "DriveFile"("personId");
CREATE INDEX IF NOT EXISTS "DriveFile_organizationId_idx" ON "DriveFile"("organizationId");
CREATE INDEX IF NOT EXISTS "DriveFile_vectorized_idx" ON "DriveFile"(vectorized);
CREATE INDEX IF NOT EXISTS "DriveFile_embedding_idx" ON "DriveFile" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);







