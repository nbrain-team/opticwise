# Enable Sales Inbox Email Search

## What This Fixes

The Sales Inbox contains **330 email threads** with actual customer conversations. These are much better than the GmailMessage table (which is mostly Bill's personal inbox).

## Steps to Enable (Run in Render Shell)

### Step 1: Add Vector Columns to EmailMessage

```bash
cd ~/project/src/ow && psql $DATABASE_URL -f prisma/migrations/010_add_email_message_vector.sql
```

### Step 2: Vectorize Sales Inbox Emails

```bash
cd ~/project/src/ow && npx tsx scripts/vectorize-sales-inbox-emails.ts
```

This will:
- Process up to 500 email messages
- Generate embeddings with full context (subject, sender, contact, company)
- Store in PostgreSQL pgvector
- Take ~3-5 minutes
- Cost ~$0.05 in OpenAI credits

### Step 3: Verify

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as total, COUNT(embedding) as vectorized FROM \"EmailMessage\";"
```

Should show all messages vectorized.

### Step 4: Clear Cache & Test

```bash
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"
```

Then test with: **"max_tokens: Show me 5 customer questions from sales emails"**

---

## What Will Change

### Before:
- Agent searches only GmailMessage (10,741 emails)
- 99% are invoices, newsletters, admin emails
- Very few customer questions found

### After:
- Agent searches **EmailMessage first** (330 sales threads)
- Then GmailMessage as backup
- Prioritizes actual customer conversations
- Better quality responses with real customer questions

---

## Data Quality Improvement

**Sales Inbox EmailMessage:**
- ✅ 330 threads with 14 unique external contacts
- ✅ Actual customer email conversations
- ✅ Linked to Person and Organization records
- ✅ Includes full conversation context

**Examples of what will now be searchable:**
- Quick Intro Ask - Lucas McQuinn (CU Boulder)
- OpticWise Demand Letter discussions
- Lane Taylor meetings
- External customer inquiries

---

## Agent Changes

The agent now:
1. **Searches Sales Inbox first** for customer emails
2. **Then searches Gmail** for additional context
3. **Labels source** ([Sales Inbox] vs [Gmail])
4. **Prioritizes external contacts** (excludes Bill Douglas threads)
5. **Includes contact/company context** in results

---

## Run Order

```bash
# 1. Add vector columns
psql $DATABASE_URL -f ow/prisma/migrations/010_add_email_message_vector.sql

# 2. Vectorize sales inbox
cd ow && npx tsx scripts/vectorize-sales-inbox-emails.ts

# 3. Clear cache
psql $DATABASE_URL -c "DELETE FROM \"SemanticCache\";"

# 4. Test the agent!
```

**After this, the agent will have access to real customer email conversations!**
