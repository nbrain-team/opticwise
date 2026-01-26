# Vectorization Status & Available Scripts

## 📊 Current Status (Run This to Check)

```bash
psql $DATABASE_URL << 'SQL'
SELECT 
  'GmailMessage' as table_name,
  COUNT(*) as total,
  COUNT(embedding) as vectorized,
  ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 1) as pct_complete
FROM "GmailMessage"
UNION ALL
SELECT 
  'DriveFile' as table_name,
  COUNT(*) as total,
  COUNT(embedding) as vectorized,
  ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 1) as pct_complete
FROM "DriveFile"
UNION ALL
SELECT 
  'CallTranscript' as table_name,
  COUNT(*) as total,
  COUNT(embedding) as vectorized,
  ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 1) as pct_complete
FROM "CallTranscript"
UNION ALL
SELECT 
  'WebPage' as table_name,
  COUNT(*) as total,
  COUNT(embedding) as vectorized,
  ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 1) as pct_complete
FROM "WebPage"
UNION ALL
SELECT 
  'StyleGuide' as table_name,
  COUNT(*) as total,
  COUNT(embedding) as vectorized,
  ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 1) as pct_complete
FROM "StyleGuide"
UNION ALL
SELECT 
  'EmailMessage' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as vectorized,
  ROUND(COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 1) as pct_complete
FROM "EmailMessage"
ORDER BY table_name;
SQL
```

---

## 📍 Last Known Status (From Earlier Session)

Based on your last run:

| Table | Total | Vectorized | % Complete | Status |
|-------|-------|------------|------------|--------|
| **GmailMessage** | 10,741 | 10,741 | 100% | ✅ COMPLETE |
| **DriveFile** | 7,293 | 1,347 | 18% | ⚠️ PARTIAL (but many have no content) |
| **CallTranscript** | 142 | 142 | 100% | ✅ COMPLETE (full docs, not chunked) |
| **WebPage** | 122 | 120 | 98% | ✅ COMPLETE |
| **StyleGuide** | 12 | 12 | 100% | ✅ COMPLETE |
| **EmailMessage** | 330+ | 0 | 0% | ❌ NOT STARTED |

**Note:** 5,946 DriveFiles have no content (images, binaries) - can't be vectorized

---

## 🔧 Available Vectorization Scripts

### Location: `/ow/scripts/`

### 1. **vectorize-all-data.ts** (Master Script - OLD APPROACH)
Vectorizes full documents (not chunked)

**Run:**
```bash
cd ~/project/src/ow && npx tsx scripts/vectorize-all-data.ts
```

**What it does:**
- GmailMessage (batches of 2000)
- DriveFile (batches of 1000) - only files with content
- WebPage
- StyleGuide

**Status:** ✅ You already ran this - most data is vectorized

---

### 2. **vectorize-sales-inbox-emails.ts** (NEW - Sales Inbox)
Vectorizes Sales Inbox EmailMessage table

**Run:**
```bash
cd ~/project/src/ow && npx tsx scripts/vectorize-sales-inbox-emails.ts
```

**What it does:**
- Vectorizes 330 EmailMessage records (customer conversations)
- Includes contact/company context
- ~2-3 minutes, $0.03 cost

**Status:** ❌ NOT RUN YET - Need to run this!

---

### 3. **chunk-and-vectorize-transcripts.ts** (NEW - CRITICAL!)
Chunks transcripts into 500-word pieces (Newbury style)

**Run:**
```bash
cd ~/project/src/ow && npx tsx scripts/chunk-and-vectorize-transcripts.ts
```

**What it does:**
- Breaks 142 transcripts into ~2,000 chunks
- 500 words per chunk, 50-word overlap
- Vectorizes each chunk separately
- **THIS IS THE KEY IMPROVEMENT!**
- ~10-15 minutes, $0.20 cost

**Status:** ❌ NOT RUN YET - **This will dramatically improve quality!**

---

### 4. **chunk-and-vectorize-docs.ts** (NEW - For large docs)
Chunks large Drive files into 500-word pieces

**Run:**
```bash
cd ~/project/src/ow && npx tsx scripts/chunk-and-vectorize-docs.ts
```

**What it does:**
- Only chunks docs >2000 chars
- Creates ~1,500 chunks from ~300 large docs
- 500 words per chunk
- ~5-10 minutes, $0.15 cost

**Status:** ❌ NOT RUN YET

---

### 5. **vectorize-transcripts-postgres.ts** (OLD - Don't use)
Vectorizes FULL transcripts (not chunked)

**Status:** Already done, but we want chunks instead

---

## 🎯 Recommended Action Plan

### To Match Newbury Partners Quality:

**Priority 1: Create Chunk Tables** (30 seconds)
```bash
cd ~/project/src/ow && psql $DATABASE_URL -f prisma/migrations/011_create_chunk_tables.sql
```

**Priority 2: Chunk Transcripts** (15 mins) ⭐ MOST IMPORTANT
```bash
npx tsx scripts/chunk-and-vectorize-transcripts.ts
```

**Priority 3: Vectorize Sales Inbox** (3 mins)
```bash
npx tsx scripts/vectorize-sales-inbox-emails.ts
```

**Priority 4: Chunk Large Docs** (10 mins) - Optional but recommended
```bash
npx tsx scripts/chunk-and-vectorize-docs.ts
```

**Priority 5: Clear Cache**
```bash
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"
```

---

## 💰 Total Cost & Time

- **Time:** ~30 minutes total
- **Cost:** ~$0.40 in OpenAI credits
- **Impact:** Agent quality will match Newbury Partners

---

## 📝 What You Left Off

Last session you ran:
- ✅ `vectorize-all-data.ts` - Got emails and docs vectorized
- ✅ Ran it 2-3 times until completion
- ✅ Most data vectorized

**What's left:**
1. ❌ Sales Inbox (EmailMessage) not vectorized
2. ❌ Transcripts not chunked (they're full docs)
3. ❌ Documents not chunked (they're full docs)

**This is why responses are poor** - you're searching full 50K char transcripts instead of relevant 500-word chunks!

---

## 🚀 Quick Start (Run These Now)

After deployment completes:

```bash
cd ~/project/src/ow

# 1. Create chunk tables
psql $DATABASE_URL -f prisma/migrations/011_create_chunk_tables.sql

# 2. Chunk transcripts (CRITICAL FOR QUALITY)
npx tsx scripts/chunk-and-vectorize-transcripts.ts

# 3. Vectorize sales inbox
npx tsx scripts/vectorize-sales-inbox-emails.ts

# 4. Clear cache
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"
```

Then test with: **"max_tokens: Show me 5 customer questions from calls"**

You'll see a HUGE quality improvement! 🎯
