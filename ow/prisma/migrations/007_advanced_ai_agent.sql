-- Advanced AI Agent Enhancement Tables
-- Adds StyleGuide, KnowledgeGraph, UserMemory, and AIFeedback for world-class AI capabilities

-- ============================================
-- STYLE GUIDE - For tone and voice matching
-- ============================================
CREATE TABLE IF NOT EXISTS "StyleGuide" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL,  -- email, proposal, marketing, social, documentation
  subcategory TEXT,  -- cold_outreach, follow_up, announcement, technical, etc.
  content TEXT NOT NULL,  -- The example text
  tone TEXT,  -- professional, casual, technical, friendly
  author TEXT,  -- Bill, Team, etc.
  context TEXT,  -- Additional context about when to use this style
  embedding vector(1024),  -- Vector embedding for semantic search
  vectorized BOOLEAN DEFAULT false,
  metadata JSONB,  -- Additional metadata
  "usageCount" INTEGER DEFAULT 0,  -- Track how often this is referenced
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "StyleGuide_category_idx" ON "StyleGuide"(category);
CREATE INDEX IF NOT EXISTS "StyleGuide_subcategory_idx" ON "StyleGuide"(subcategory);
CREATE INDEX IF NOT EXISTS "StyleGuide_tone_idx" ON "StyleGuide"(tone);
CREATE INDEX IF NOT EXISTS "StyleGuide_vectorized_idx" ON "StyleGuide"(vectorized);
CREATE INDEX IF NOT EXISTS "StyleGuide_embedding_idx" ON "StyleGuide" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- KNOWLEDGE GRAPH - Intelligent entity relationships
-- ============================================
CREATE TABLE IF NOT EXISTS "KnowledgeNode" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,  -- person, company, topic, product, technology, event
  name TEXT NOT NULL,
  description TEXT,
  aliases JSONB,  -- Alternative names/spellings
  metadata JSONB,  -- Type-specific data
  embedding vector(1024),  -- Vector for semantic search
  vectorized BOOLEAN DEFAULT false,
  importance FLOAT DEFAULT 0.5,  -- 0-1 importance score
  "lastMentioned" TIMESTAMPTZ,  -- When last referenced
  "mentionCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "KnowledgeEdge" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fromNodeId" TEXT NOT NULL REFERENCES "KnowledgeNode"(id) ON DELETE CASCADE,
  "toNodeId" TEXT NOT NULL REFERENCES "KnowledgeNode"(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,  -- works_at, mentioned_in, related_to, competes_with, etc.
  strength FLOAT DEFAULT 0.5,  -- 0-1 confidence/strength score
  source TEXT,  -- Where this relationship was discovered (email_id, transcript_id, etc.)
  sourceType TEXT,  -- email, transcript, document, manual
  metadata JSONB,  -- Additional relationship data
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "KnowledgeNode_type_idx" ON "KnowledgeNode"(type);
CREATE INDEX IF NOT EXISTS "KnowledgeNode_name_idx" ON "KnowledgeNode"(name);
CREATE INDEX IF NOT EXISTS "KnowledgeNode_vectorized_idx" ON "KnowledgeNode"(vectorized);
CREATE INDEX IF NOT EXISTS "KnowledgeNode_embedding_idx" ON "KnowledgeNode" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS "KnowledgeEdge_fromNode_idx" ON "KnowledgeEdge"("fromNodeId");
CREATE INDEX IF NOT EXISTS "KnowledgeEdge_toNode_idx" ON "KnowledgeEdge"("toNodeId");
CREATE INDEX IF NOT EXISTS "KnowledgeEdge_relationship_idx" ON "KnowledgeEdge"(relationship);

-- ============================================
-- USER MEMORY - Cross-session persistence
-- ============================================
CREATE TABLE IF NOT EXISTS "UserMemory" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  key TEXT NOT NULL,  -- preference, context, fact, instruction
  value TEXT NOT NULL,
  source TEXT,  -- sessionId or messageId where this was learned
  sourceType TEXT,  -- explicit (user stated) or inferred (AI detected)
  embedding vector(1024),  -- For semantic retrieval
  vectorized BOOLEAN DEFAULT false,
  importance INTEGER DEFAULT 5,  -- 1-10 importance score
  "expiresAt" TIMESTAMPTZ,  -- Optional expiration for time-sensitive facts
  "lastUsed" TIMESTAMPTZ,
  "useCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "UserMemory_userId_idx" ON "UserMemory"("userId");
CREATE INDEX IF NOT EXISTS "UserMemory_key_idx" ON "UserMemory"(key);
CREATE INDEX IF NOT EXISTS "UserMemory_importance_idx" ON "UserMemory"(importance);
CREATE INDEX IF NOT EXISTS "UserMemory_vectorized_idx" ON "UserMemory"(vectorized);
CREATE INDEX IF NOT EXISTS "UserMemory_embedding_idx" ON "UserMemory" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- AI FEEDBACK - Continuous learning
-- ============================================
CREATE TABLE IF NOT EXISTS "AIFeedback" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "messageId" TEXT NOT NULL REFERENCES "AgentChatMessage"(id) ON DELETE CASCADE,
  "sessionId" TEXT NOT NULL REFERENCES "AgentChatSession"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  rating INTEGER,  -- 1-5 stars
  "wasEdited" BOOLEAN DEFAULT false,
  "editedContent" TEXT,  -- What the user changed it to
  category TEXT,  -- tone, accuracy, completeness, relevance, helpfulness
  feedback TEXT,  -- Freeform feedback
  "originalPrompt" TEXT,  -- The user's original question
  "aiResponse" TEXT,  -- The AI's original response
  context JSONB,  -- Sources used, model, temperature, etc.
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AIFeedback_messageId_idx" ON "AIFeedback"("messageId");
CREATE INDEX IF NOT EXISTS "AIFeedback_sessionId_idx" ON "AIFeedback"("sessionId");
CREATE INDEX IF NOT EXISTS "AIFeedback_userId_idx" ON "AIFeedback"("userId");
CREATE INDEX IF NOT EXISTS "AIFeedback_rating_idx" ON "AIFeedback"(rating);
CREATE INDEX IF NOT EXISTS "AIFeedback_category_idx" ON "AIFeedback"(category);
CREATE INDEX IF NOT EXISTS "AIFeedback_createdAt_idx" ON "AIFeedback"("createdAt");

-- ============================================
-- QUERY ANALYTICS - Track query patterns
-- ============================================
CREATE TABLE IF NOT EXISTS "QueryAnalytics" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionId" TEXT REFERENCES "AgentChatSession"(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  "queryType" TEXT,  -- research, quick_answer, deep_analysis, creative, etc.
  "sourcesUsed" JSONB,  -- Which data sources were accessed
  "sourcesCount" INTEGER,
  "responseLength" INTEGER,  -- Character count
  "responseTime" INTEGER,  -- Milliseconds
  "tokensUsed" INTEGER,  -- Total tokens (input + output)
  model TEXT,  -- Which model was used
  temperature FLOAT,
  "maxTokens" INTEGER,
  "contextWindowUsed" INTEGER,  -- How much context was loaded
  "wasHelpful" BOOLEAN,  -- User feedback
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "QueryAnalytics_sessionId_idx" ON "QueryAnalytics"("sessionId");
CREATE INDEX IF NOT EXISTS "QueryAnalytics_userId_idx" ON "QueryAnalytics"("userId");
CREATE INDEX IF NOT EXISTS "QueryAnalytics_queryType_idx" ON "QueryAnalytics"("queryType");
CREATE INDEX IF NOT EXISTS "QueryAnalytics_createdAt_idx" ON "QueryAnalytics"("createdAt");

-- ============================================
-- PROACTIVE INSIGHTS - Background intelligence
-- ============================================
CREATE TABLE IF NOT EXISTS "ProactiveInsight" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,  -- alert, suggestion, insight, warning, opportunity
  category TEXT NOT NULL,  -- deal, contact, email, meeting, trend
  priority TEXT NOT NULL,  -- critical, high, medium, low
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,  -- Supporting data
  "actionableSteps" JSONB,  -- Suggested next steps
  "relatedEntityType" TEXT,  -- deal, person, organization
  "relatedEntityId" TEXT,  -- ID of related entity
  "generatedBy" TEXT DEFAULT 'system',  -- system or userId
  "isRead" BOOLEAN DEFAULT false,
  "isDismissed" BOOLEAN DEFAULT false,
  "isActedOn" BOOLEAN DEFAULT false,
  "actedOnAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,  -- When this insight becomes stale
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ProactiveInsight_type_idx" ON "ProactiveInsight"(type);
CREATE INDEX IF NOT EXISTS "ProactiveInsight_category_idx" ON "ProactiveInsight"(category);
CREATE INDEX IF NOT EXISTS "ProactiveInsight_priority_idx" ON "ProactiveInsight"(priority);
CREATE INDEX IF NOT EXISTS "ProactiveInsight_isRead_idx" ON "ProactiveInsight"("isRead");
CREATE INDEX IF NOT EXISTS "ProactiveInsight_createdAt_idx" ON "ProactiveInsight"("createdAt");
CREATE INDEX IF NOT EXISTS "ProactiveInsight_relatedEntity_idx" ON "ProactiveInsight"("relatedEntityType", "relatedEntityId");

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

-- ============================================
-- COMPETITIVE INTELLIGENCE
-- ============================================
CREATE TABLE IF NOT EXISTS "CompetitorMention" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  competitor TEXT NOT NULL,
  source TEXT NOT NULL,  -- email, transcript, document
  "sourceId" TEXT NOT NULL,  -- ID of the source
  context TEXT,  -- Surrounding text
  sentiment TEXT,  -- positive, negative, neutral
  "sentimentScore" FLOAT,  -- -1 to 1
  category TEXT,  -- pricing, features, win, loss, comparison
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CompetitorMention_competitor_idx" ON "CompetitorMention"(competitor);
CREATE INDEX IF NOT EXISTS "CompetitorMention_source_idx" ON "CompetitorMention"(source, "sourceId");
CREATE INDEX IF NOT EXISTS "CompetitorMention_sentiment_idx" ON "CompetitorMention"(sentiment);
CREATE INDEX IF NOT EXISTS "CompetitorMention_createdAt_idx" ON "CompetitorMention"("createdAt");

-- ============================================
-- Helper Views
-- ============================================

-- View for recent high-quality responses (for training)
CREATE OR REPLACE VIEW "HighQualityResponses" AS
SELECT 
  acm.*,
  af.rating,
  af."wasEdited",
  af."editedContent"
FROM "AgentChatMessage" acm
LEFT JOIN "AIFeedback" af ON acm.id = af."messageId"
WHERE acm.role = 'assistant'
  AND (af.rating >= 4 OR af.rating IS NULL)
ORDER BY acm."createdAt" DESC;

-- View for insights that need attention
CREATE OR REPLACE VIEW "ActiveInsights" AS
SELECT *
FROM "ProactiveInsight"
WHERE "isRead" = false
  AND "isDismissed" = false
  AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
ORDER BY 
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  "createdAt" DESC;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE "StyleGuide" IS 'Stores examples of company writing style for AI to learn from';
COMMENT ON TABLE "KnowledgeNode" IS 'Entities extracted from all data sources';
COMMENT ON TABLE "KnowledgeEdge" IS 'Relationships between entities in the knowledge graph';
COMMENT ON TABLE "UserMemory" IS 'Persistent user preferences and context across sessions';
COMMENT ON TABLE "AIFeedback" IS 'Tracks user feedback on AI responses for continuous improvement';
COMMENT ON TABLE "QueryAnalytics" IS 'Analyzes query patterns and performance metrics';
COMMENT ON TABLE "ProactiveInsight" IS 'AI-generated insights and alerts shown proactively';
COMMENT ON TABLE "SemanticCache" IS 'Caches similar queries to reduce API costs and latency';
COMMENT ON TABLE "CompetitorMention" IS 'Tracks mentions of competitors for competitive intelligence';
