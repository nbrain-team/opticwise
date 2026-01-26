# Sync All Data Sources - Fresh Import Guide

## 📊 Check Current Status First

Run this in Render shell to see last sync dates:

```bash
psql $DATABASE_URL << 'SQL'
SELECT 'GmailMessage' as source,
  MAX(date)::date as last_sync_date,
  COUNT(*) as total,
  AGE(NOW(), MAX(date)) as days_old
FROM "GmailMessage"
UNION ALL
SELECT 'CallTranscript',
  MAX("startTime")::date,
  COUNT(*),
  AGE(NOW(), MAX("startTime"))
FROM "CallTranscript"
UNION ALL
SELECT 'DriveFile',
  MAX("modifiedTime")::date,
  COUNT(*),
  AGE(NOW(), MAX("modifiedTime"))
FROM "DriveFile"
ORDER BY source;
SQL
```

---

## 🔄 Available Sync Scripts

### Location: `/ow/scripts/`

### 1. **Fathom Transcripts** (Call Recordings)

**Fetch new transcripts:**
```bash
cd ~/project/src/ow && npx tsx scripts/fetch-fathom-transcripts.ts
```

**What it does:**
- Fetches new call recordings from Fathom.ai
- Imports transcripts to database
- Does NOT auto-vectorize

**After fetching, chunk and vectorize:**
```bash
npx tsx scripts/chunk-and-vectorize-transcripts.ts
```

---

### 2. **Gmail (Last 30 Days)**

**Sync recent emails:**
```bash
cd ~/project/src/ow && npx tsx scripts/sync-gmail-30days.ts
```

**What it does:**
- Syncs last 30 days of Gmail
- Auto-vectorizes new emails
- Updates existing emails

**Time:** 5-10 minutes depending on volume

---

### 3. **Google Drive Files**

**Sync new/modified files:**
```bash
cd ~/project/src/ow && npx tsx scripts/sync-drive.ts
```

**What it does:**
- Syncs new and modified files
- Extracts text content
- Auto-vectorizes

**After sync, chunk large docs:**
```bash
npx tsx scripts/chunk-and-vectorize-docs.ts
```

---

### 4. **Google Calendar**

**Sync calendar events:**
```bash
cd ~/project/src/ow && npx tsx scripts/sync-calendar.ts
```

**What it does:**
- Syncs calendar events
- Auto-vectorizes
- Links to contacts/deals

---

### 5. **Sales Inbox** (Pipedrive Integration)

**Sync sales inbox:**
```bash
cd ~/project/src/ow && npx tsx scripts/sync-sales-inbox.ts
```

**What it does:**
- Syncs email threads from Pipedrive
- Links to contacts/deals
- Auto-vectorizes

---

## 🚀 Complete Refresh Workflow

Run these in order for a full data refresh:

```bash
cd ~/project/src/ow

# 1. Sync Gmail (last 30 days)
echo "📧 Syncing Gmail..."
npx tsx scripts/sync-gmail-30days.ts

# 2. Fetch Fathom transcripts
echo "🎙️ Fetching Fathom transcripts..."
npx tsx scripts/fetch-fathom-transcripts.ts

# 3. Chunk new transcripts
echo "📝 Chunking new transcripts..."
npx tsx scripts/chunk-and-vectorize-transcripts.ts

# 4. Sync Google Drive
echo "📁 Syncing Google Drive..."
npx tsx scripts/sync-drive.ts

# 5. Chunk new large docs
echo "📄 Chunking large documents..."
npx tsx scripts/chunk-and-vectorize-docs.ts

# 6. Sync Calendar
echo "📅 Syncing Calendar..."
npx tsx scripts/sync-calendar.ts

# 7. Sync Sales Inbox
echo "💼 Syncing Sales Inbox..."
npx tsx scripts/sync-sales-inbox.ts

# 8. Vectorize new sales inbox emails
echo "✉️ Vectorizing sales inbox..."
npx tsx scripts/vectorize-sales-inbox-emails.ts

# 9. Clear cache
echo "🧹 Clearing cache..."
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"

echo "✅ All data synced and vectorized!"
```

---

## ⏱️ Estimated Times

| Task | Time | Cost |
|------|------|------|
| Gmail sync | 5-10 min | $0.10 |
| Fathom fetch | 2-5 min | Free |
| Chunk transcripts | 10-15 min | $0.20 |
| Drive sync | 5-10 min | $0.05 |
| Chunk docs | 5-10 min | $0.15 |
| Calendar sync | 2-3 min | $0.02 |
| Sales inbox sync | 2-3 min | $0.02 |
| **Total** | **30-55 min** | **~$0.55** |

---

## 📝 Quick Sync (Just Essentials)

If you just want the most important updates:

```bash
cd ~/project/src/ow

# Sync Gmail (30 days)
npx tsx scripts/sync-gmail-30days.ts

# Fetch new Fathom transcripts
npx tsx scripts/fetch-fathom-transcripts.ts

# Chunk any new transcripts
npx tsx scripts/chunk-and-vectorize-transcripts.ts

# Clear cache
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"
```

**Time:** 15-20 minutes  
**Cost:** ~$0.30

---

## ✅ After Syncing

Your agent will have:
- ✅ Latest emails from last 30 days
- ✅ Latest call transcripts
- ✅ Latest Google Drive files
- ✅ All chunked for precise search
- ✅ Better, more current responses

**Test with:** "max_tokens: What are the most recent customer conversations about?"

The agent will now reference current data instead of old data!
