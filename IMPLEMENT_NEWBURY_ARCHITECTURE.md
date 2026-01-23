# Implement Newbury Architecture - Complete Guide

## 🎯 Critical Finding

After analyzing the Newbury Partners agent, the **key difference** is:

**CHUNKING** - Newbury chunks all long content into 500-word pieces for precise vector search.

---

## Phase 1: Database Setup (Run in Render Shell)

### Step 1: Create Chunk Tables
```bash
cd ~/project/src/ow && psql $DATABASE_URL -f prisma/migrations/011_create_chunk_tables.sql
```

Creates:
- `CallTranscriptChunk` - 500-word transcript chunks
- `DriveFileChunk` - 500-word document chunks  
- `EmailChunk` - For very long emails

### Step 2: Add EmailMessage Vector Column
```bash
psql $DATABASE_URL -f ow/prisma/migrations/010_add_email_message_vector.sql
```

---

## Phase 2: Chunk & Vectorize Data

### Step 1: Chunk Transcripts (142 transcripts → ~2,000 chunks)
```bash
cd ~/project/src/ow && npx tsx scripts/chunk-and-vectorize-transcripts.ts
```

- Takes ~10-15 minutes
- Creates ~2,000 chunks from 142 transcripts
- Each chunk: 500 words with 50-word overlap
- Cost: ~$0.20 OpenAI credits

### Step 2: Chunk Large Documents (~300 large docs → ~1,500 chunks)
```bash
npx tsx scripts/chunk-and-vectorize-docs.ts
```

- Only chunks docs >2000 chars
- Takes ~5-10 minutes
- Cost: ~$0.15 OpenAI credits

### Step 3: Vectorize Sales Inbox (330 email threads)
```bash
npx tsx scripts/vectorize-sales-inbox-emails.ts
```

- Takes ~2-3 minutes
- Cost: ~$0.03 OpenAI credits

---

## Phase 3: Deploy Updated Agent

The code has already been updated to:
- ✅ Search `CallTranscriptChunk` first (then fallback to full transcripts)
- ✅ Search `DriveFileChunk` for documents
- ✅ Search `EmailMessage` (Sales Inbox) before GmailMessage
- ✅ Use chunked results for better precision

After Phase 2 completes, just clear the cache:
```bash
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"
```

---

## Why This Will Work

### Newbury Architecture Benefits:

**1. Chunked Content = Precise Results**
- Instead of matching "entire 50K char transcript"
- Matches "specific 500-word segment about pricing"
- Returns exact relevant portion

**2. Better Context Quality**
- Each chunk is self-contained
- Higher similarity scores for relevant chunks
- Less noise in results

**3. More Results in Budget**
- 10 full transcripts = 20K-100K chars
- 20 chunks = 10K chars but MORE RELEVANT
- Fits more useful info in token budget

### Expected Improvement:

**Before (Full Docs):**
```
Query: "What questions do customers ask about pricing?"
Results: 
- Full transcript #1 (50K chars, mentions pricing once)
- Full transcript #2 (30K chars, mentions pricing twice)
→ Truncated to 2K chars each
→ Loses specific questions
```

**After (Chunked):**
```
Query: "What questions do customers ask about pricing?"
Results:
- Chunk from Riley call: "How does your pricing scale with building size?"
- Chunk from Mass Equities: "Can you break down the ROI calculation?"
- Chunk from Cardone: "What's included in the base vs premium tier?"
→ Exact 500-word segments with full context
→ Precise customer questions
```

---

## Complete Implementation Timeline

**Total Time:** ~20-30 minutes
**Total Cost:** ~$0.40 OpenAI credits

### Run These Commands in Order:

```bash
# 1. Create chunk tables (30 seconds)
cd ~/project/src/ow && psql $DATABASE_URL -f prisma/migrations/011_create_chunk_tables.sql

# 2. Chunk transcripts (10-15 mins)
npx tsx scripts/chunk-and-vectorize-transcripts.ts

# 3. Chunk documents (5-10 mins)
npx tsx scripts/chunk-and-vectorize-docs.ts

# 4. Vectorize sales inbox (2-3 mins)
npx tsx scripts/vectorize-sales-inbox-emails.ts

# 5. Clear cache
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"

# 6. Test!
```

---

## Testing After Implementation

Try these queries:

**1. Customer Questions:**
```
max_tokens: Show me 5 specific customer questions from call transcripts
```

Expected: Actual verbatim questions from specific calls

**2. Technical Discussions:**
```
max_tokens: What technical questions do prospects ask during demos?
```

Expected: Specific technical Q&A from relevant call segments

**3. Win/Loss Analysis:**
```
Tell me about successful client conversations
```

Expected: Specific moments from calls where clients showed buying signals

---

## Verification Queries

After running the scripts, verify chunking worked:

```bash
# Check transcript chunks
psql $DATABASE_URL -c "
  SELECT 
    COUNT(DISTINCT \"transcriptId\") as transcript_count,
    COUNT(*) as chunk_count,
    AVG(\"wordCount\") as avg_chunk_size
  FROM \"CallTranscriptChunk\";
"

# Check document chunks
psql $DATABASE_URL -c "
  SELECT 
    COUNT(DISTINCT \"fileId\") as doc_count,
    COUNT(*) as chunk_count
  FROM \"DriveFileChunk\";
"

# Check sales inbox
psql $DATABASE_URL -c "
  SELECT COUNT(*) as total, COUNT(embedding) as vectorized 
  FROM \"EmailMessage\";
"
```

Expected:
- ~2,000 transcript chunks from 142 transcripts
- ~1,500 doc chunks from ~300 large documents
- 330+ sales inbox emails vectorized

---

## After Implementation

Your agent will:
- ✅ Match Newbury Partners quality
- ✅ Find precise, specific content
- ✅ Return exact customer questions
- ✅ Provide better context
- ✅ Give actionable, detailed responses

**This is the missing piece!** 🎯
