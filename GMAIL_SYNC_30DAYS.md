# Gmail Sync - Last 30 Days

**Created:** January 14, 2026  
**Script:** `ow/scripts/sync-gmail-30days.ts`

---

## Quick Start

To sync emails from the last 30 days:

```bash
cd ow
npm run sync:gmail:30days
```

---

## What It Does

1. **Fetches** all Gmail messages from the last 30 days
2. **Extracts** full email content (subject, body, attachments)
3. **Vectorizes** each email using OpenAI embeddings (1024 dimensions)
4. **Stores** in PostgreSQL with full metadata
5. **Skips** emails that are already synced

---

## Features

- ✅ **Smart Pagination** - Handles large inboxes automatically
- ✅ **Duplicate Detection** - Won't re-import existing emails
- ✅ **Vector Embeddings** - Makes emails searchable by the OWnet Agent
- ✅ **Progress Tracking** - Shows real-time progress and ETA
- ✅ **Rate Limiting** - Respects Gmail API quotas
- ✅ **Error Handling** - Continues on errors, reports at end

---

## Output Example

```
📧 GMAIL SYNC - LAST 30 DAYS
==================================================
📅 Fetching emails from last 30 days (after 2025/12/15)

🔍 Discovering messages...
   Page 1: Found 250 messages (Total: 250)
   Page 2: Found 180 messages (Total: 430)

✅ Total messages discovered: 430
📊 Already imported: 50
📥 New to import: 380

🚀 Starting import...

   ✓ 10/380 emails (2.5/sec, ~148s remaining)
   ✓ 20/380 emails (2.8/sec, ~129s remaining)
   ...
   ✓ 380/380 emails (3.1/sec, ~0s remaining)

==================================================
✅ GMAIL SYNC COMPLETE
==================================================
   📥 Synced: 380 new emails
   ⏭️  Skipped: 50 existing emails
   ❌ Errors: 0
   ⏱️  Time: 122.5 seconds
   📅 Date Range: Last 30 days
==================================================
```

---

## Email Sorting in Sales Inbox

The Sales Inbox already sorts emails with **newest on top, oldest on bottom**:

**API Sorting:**
```typescript
orderBy: { updatedAt: 'desc' }  // Newest first
```

This means:
- ✅ Most recent emails appear at the top of the left sidebar
- ✅ Older emails appear at the bottom
- ✅ Sorting happens automatically in the database query

---

## What Gets Synced

For each email, we store:

**Metadata:**
- Subject
- From, To, CC
- Date/Time
- Gmail Message ID
- Thread ID
- Labels

**Content:**
- Plain text body
- HTML body
- Snippet (preview)
- Attachments (metadata only)

**AI Features:**
- Vector embedding (1024 dimensions)
- Vectorized flag (true/false)
- Ready for semantic search

---

## Usage in OWnet Agent

Once emails are synced, the OWnet Agent can search them:

**Example Queries:**
- "Show me recent emails about the Koelbel project"
- "What emails need responses?"
- "Find emails from Mass Equities"
- "Show me emails about pricing"

The agent uses semantic search to find relevant emails based on meaning, not just keywords.

---

## Other Sync Options

**Sync last 30 days (this script):**
```bash
npm run sync:gmail:30days
```

**Sync last 12 months (default):**
```bash
npm run sync:gmail
```

**Sync custom time range:**
```bash
cd ow
npx tsx scripts/sync-gmail.ts --months=6  # Last 6 months
```

**Sync all emails:**
```bash
cd ow
npx tsx scripts/sync-gmail.ts --all
```

---

## Performance

**Typical Performance:**
- ~2-3 emails per second
- 100 emails: ~40 seconds
- 500 emails: ~3 minutes
- 1000 emails: ~6 minutes

**Factors:**
- Gmail API rate limits
- Email size (large emails take longer)
- Network speed
- Embedding generation time

---

## Running on Render

To sync emails on the production server:

1. **Open Render Shell:**
   - Go to https://dashboard.render.com/web/srv-d4ebnhp5pdvs73fpa13g
   - Click "Shell" tab
   - Wait for shell to connect

2. **Run sync:**
   ```bash
   cd ow
   npm run sync:gmail:30days
   ```

3. **Monitor progress:**
   - Watch the output in real-time
   - Progress updates every 10 emails
   - Shows ETA and completion status

---

## Troubleshooting

**"Error: OPENAI_API_KEY not found"**
- Make sure environment variables are set in Render
- Check `.env` file locally

**"Gmail API quota exceeded"**
- Wait 24 hours for quota to reset
- Or sync in smaller batches

**"Already synced" for all emails**
- This is normal if you've already run the sync
- Script automatically skips duplicates

**Slow performance**
- Normal for large inboxes
- Rate limiting is intentional to respect API quotas
- Let it run - it will complete

---

## Next Steps

After syncing emails:

1. **Test in OWnet Agent:**
   - Go to https://ownet.opticwise.com/ownet-agent
   - Ask: "Show me recent emails"
   - Agent will search the synced emails

2. **Check Sales Inbox:**
   - Go to https://ownet.opticwise.com/sales-inbox
   - Emails should appear in left sidebar
   - Newest on top, oldest on bottom

3. **Sync regularly:**
   - Run daily or weekly to keep emails current
   - Consider setting up a cron job

---

**Script Location:** `/ow/scripts/sync-gmail-30days.ts`  
**NPM Command:** `npm run sync:gmail:30days`  
**Status:** ✅ Ready to use

