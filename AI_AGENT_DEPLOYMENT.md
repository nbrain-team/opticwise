# Enhanced AI Agent - Deployment Guide

## Quick Deployment Steps

This guide walks you through deploying the enhanced AI agent to Render with all new features.

---

## Prerequisites

✅ PostgreSQL database with pgvector extension  
✅ Anthropic API key (Claude)  
✅ OpenAI API key (embeddings)  
✅ Pinecone API key (vector store)  
✅ Access to Render shell  

---

## Step 1: Database Migration

### Option A: Via Render Shell (Recommended)

1. **Connect to Render shell:**
```bash
# In Render dashboard, go to your web service → Shell
```

2. **Run the migration:**
```bash
cd /opt/render/project/src/ow
npm run tsx -- prisma/migrations/007_advanced_ai_agent.sql
```

### Option B: Direct SQL Execution

1. **Copy migration file content:**
```bash
cat ow/prisma/migrations/007_advanced_ai_agent.sql
```

2. **Execute in Render PostgreSQL:**
- Go to Render Dashboard → Your Database
- Click "Connect" → "External Connection"
- Use psql or any SQL client
- Paste and execute the SQL

### Option C: Using npm script (Add to package.json first)

Add to `ow/package.json`:
```json
{
  "scripts": {
    "migrate:advanced-agent": "psql $DATABASE_URL -f prisma/migrations/007_advanced_ai_agent.sql"
  }
}
```

Then run:
```bash
npm run migrate:advanced-agent
```

---

## Step 2: Verify Migration

Run the test script to verify tables were created:

```bash
cd ow
npm run tsx scripts/test-enhanced-agent.ts
```

**Expected Output:**
```
✅ PASS - Database Migration
   All new tables exist:
   - StyleGuide ✓
   - KnowledgeNode ✓
   - KnowledgeEdge ✓
   - UserMemory ✓
   - AIFeedback ✓
   - QueryAnalytics ✓
   - SemanticCache ✓
   - ProactiveInsight ✓
   - CompetitorMention ✓
```

---

## Step 3: Environment Variables

**No new environment variables needed!** The enhanced agent uses existing:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `DATABASE_URL`

---

## Step 4: Deploy to Render

### Option A: Git Push (Automatic)

```bash
git add .
git commit -m "feat: enhanced AI agent with advanced RAG and intelligence"
git push origin main
```

Render will automatically deploy.

### Option B: Manual Deploy

1. Go to Render Dashboard
2. Select your web service
3. Click "Manual Deploy" → "Deploy latest commit"

---

## Step 5: Smoke Test

After deployment, test the API:

```bash
curl -X POST https://your-app.onrender.com/api/ownet/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "message": "What are my top deals?",
    "sessionId": "test-session-123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Your top deals are...",
  "messageId": "msg_123",
  "sources": {
    "sources": [
      { "type": "crm", "tokenCount": 1234 }
    ],
    "totalContextTokens": 5678,
    "queryClassification": "quick_answer"
  },
  "performance": {
    "responseTime": 1234,
    "tokensUsed": 6789,
    "contextTokens": 5678,
    "queryType": "quick_answer"
  }
}
```

---

## Step 6: Monitor Performance

### Check Query Analytics

```sql
SELECT 
  "queryType",
  COUNT(*) as queries,
  AVG("responseTime") as avg_ms,
  AVG("tokensUsed") as avg_tokens
FROM "QueryAnalytics"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY "queryType"
ORDER BY queries DESC;
```

### Check Cache Performance

```sql
SELECT 
  COUNT(*) as total_entries,
  SUM("cacheHits") as total_hits,
  AVG("cacheHits") as avg_hits_per_entry
FROM "SemanticCache"
WHERE "createdAt" > NOW() - INTERVAL '7 days';
```

---

## Rollback Plan

If you need to rollback:

### 1. Revert Code Changes

```bash
git revert HEAD
git push origin main
```

### 2. Drop New Tables (Optional)

```sql
DROP TABLE IF EXISTS "CompetitorMention";
DROP TABLE IF EXISTS "ProactiveInsight";
DROP TABLE IF EXISTS "SemanticCache";
DROP TABLE IF EXISTS "QueryAnalytics";
DROP TABLE IF EXISTS "AIFeedback";
DROP TABLE IF EXISTS "UserMemory";
DROP TABLE IF EXISTS "KnowledgeEdge";
DROP TABLE IF EXISTS "KnowledgeNode";
DROP TABLE IF EXISTS "StyleGuide";

DROP VIEW IF EXISTS "HighQualityResponses";
DROP VIEW IF EXISTS "ActiveInsights";
```

**Note**: Old chat functionality will still work even with new tables present.

---

## Common Issues & Solutions

### Issue 1: Migration fails with "relation already exists"

**Cause**: Migration was partially run before  
**Solution**: Tables use `CREATE TABLE IF NOT EXISTS`, so it's safe to re-run

### Issue 2: Vector index creation fails

**Cause**: pgvector extension not installed  
**Solution**: 
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue 3: Out of memory during migration

**Cause**: Creating too many indexes at once  
**Solution**: Run migration in parts, restart between sections

### Issue 4: Slow query performance

**Cause**: Indexes not created or need to be analyzed  
**Solution**:
```sql
ANALYZE "StyleGuide";
ANALYZE "KnowledgeNode";
ANALYZE "SemanticCache";
-- etc for all new tables
```

---

## Performance Tuning

### Optimize Vector Indexes

After populating data:

```sql
-- Rebuild vector indexes for better performance
REINDEX INDEX "StyleGuide_embedding_idx";
REINDEX INDEX "KnowledgeNode_embedding_idx";
REINDEX INDEX "UserMemory_embedding_idx";
REINDEX INDEX "SemanticCache_queryEmbedding_idx";
```

### Update Index Statistics

```sql
VACUUM ANALYZE "StyleGuide";
VACUUM ANALYZE "KnowledgeNode";
VACUUM ANALYZE "SemanticCache";
VACUUM ANALYZE "QueryAnalytics";
```

---

## Monitoring Checklist

After deployment, monitor these for 24-48 hours:

- [ ] API response times (<2s average)
- [ ] Error rates (<1%)
- [ ] Cache hit rates (>50% after 24 hours, >90% after 1 week)
- [ ] Database CPU usage (should be stable)
- [ ] Memory usage (may increase 10-15%)
- [ ] API costs (should decrease 50%+ after cache builds up)

---

## Success Metrics

**Week 1 Targets:**
- ✅ All tests passing
- ✅ Zero critical errors
- ✅ Average response time <3s
- ✅ At least 10 successful queries

**Week 2 Targets:**
- ✅ Cache hit rate >50%
- ✅ Average response time <2s
- ✅ User satisfaction rating >4.0
- ✅ Cost per query <$1.00

**Month 1 Targets:**
- ✅ Cache hit rate >90%
- ✅ Average response time <1.5s
- ✅ User satisfaction rating >4.5
- ✅ Cost per query <$0.50

---

## Next Steps After Deployment

1. **Populate StyleGuide**
   - Add examples of email writing
   - Add proposal templates
   - Add marketing content samples

2. **Build Knowledge Graph**
   - Run entity extraction on existing transcripts
   - Link entities to CRM records
   - Populate relationships

3. **Enable Background Jobs**
   - Set up proactive insights generation
   - Configure competitive intelligence tracking
   - Schedule weekly analytics reports

4. **User Training**
   - Share capabilities with team
   - Collect feedback
   - Iterate based on usage patterns

---

## Support & Documentation

- **Implementation Guide**: `AI_AGENT_IMPLEMENTATION_GUIDE.md`
- **Weekly Updates**: `WEEKLY-CLIENT-UPDATES.md`
- **Test Script**: `ow/scripts/test-enhanced-agent.ts`
- **Utility Library**: `ow/lib/ai-agent-utils.ts`
- **API Route**: `ow/app/api/ownet/chat/route.ts`

---

## Emergency Contacts

If critical issues arise:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check database: Connect via Render SQL client
3. Run test script: `npm run tsx scripts/test-enhanced-agent.ts`
4. Rollback if needed (see Rollback Plan above)

---

**Deployment Prepared By**: AI Agent Enhancement Team  
**Date**: January 15, 2026  
**Version**: 2.0.0 (Enhanced Agent)
