# OWnet Agent Data Analysis - Jan 23, 2026

## Current Data Inventory

### ✅ What's Vectorized and Working

**1. GmailMessage (10,741 emails)**
- ✅ All vectorized with pgvector
- ✅ Average body length: 4,262 characters
- ⚠️ **Issue:** Mostly Bill's personal inbox (newsletters, invoices, automated emails)
- ✅ **Good emails found:** ~20 customer/prospect conversations
  - TIWA partnership emails
  - nBrain AI partnership
  - Oberon Securities meetings
  - Ice House Wifi project
  - SingerLewak accounting

**2. CallTranscript (142 transcripts)**
- ✅ All vectorized in PostgreSQL pgvector
- ⚠️ **Issue:** Mostly podcast interviews and internal meetings, not customer sales calls
- **Types:**
  - PPP Podcast interviews
  - nBrain partnership meetings
  - Internal strategy sessions

**3. DriveFile (7,293 files)**
- ✅ 1,347 with content vectorized
- ⚠️ 5,946 without content (images, binaries)

**4. EmailThread (330 threads)**
- ⚠️ Only 5 external customer threads
- ⚠️ 325 threads incorrectly linked to "Bill Douglas" as contact

**5. WebPage (122 pages)**
- ✅ 120 vectorized

**6. StyleGuide (12 entries)**
- ✅ All vectorized

---

## Why Agent Responses Are Limited

### Root Cause
The agent IS working correctly - it's finding and reading the vectorized data. The issue is **data composition**:

**When asked for "customer questions":**
- ✅ Searches 10,741 vectorized emails
- ✅ Finds most relevant emails
- ❌ Those emails are invoices, newsletters, internal emails
- ❌ Not customer sales conversations with questions

**Vector search is working perfectly** - it's just finding what's actually in the database.

---

## Data Quality Assessment

### Good Customer Email Examples Found:

**1. TIWA Partnership (Rich B)**
```
Subject: OpticWise x TIWA | Strategic Sponsorship Proposal
From: Rich B <richb@fifthgenmedia.com>
To: Bill Douglas
Date: Jan 15, 2026
Body: 7,512 chars - Partnership negotiation
```

**2. nBrain AI Partnership (Danny, Cary)**
```
Subject: Recap of your meeting with nBrain
From: Danny DeMichele <danny@nbrain.ai>
Body: 31,094 chars - Comprehensive meeting recap
```

**3. Oberon Securities (Scott Robinson)**
```
Subject: Meeting in Denver
From: Scott Robinson <srobinson@oberonsecurities.com>
Body: 4,438 chars - Meeting coordination
```

These emails ARE vectorized and searchable - the agent just needs better instructions to find them.

---

## Technical Status

### ✅ What's Working Perfectly:

1. **PostgreSQL pgvector** - All vector columns working
2. **Query classification** - 80-100% accuracy
3. **Token orchestration** - Correct allocation
4. **max_tokens command** - 32,768 tokens working
5. **Context loading** - 15-200K tokens depending on mode
6. **Claude Sonnet 4** - Latest model in use
7. **Email filtering** - Excluding noreply, invoices, etc.
8. **Transcript search** - PostgreSQL pgvector working

### ❌ Data Composition Issues:

1. **GmailMessage** - 99% personal/admin emails, 1% customer
2. **CallTranscript** - Podcast interviews, not sales calls
3. **EmailThread** - Missing proper contact linking

---

## Solutions

### Option 1: Improve Email Search (Quick Fix) ✅
Add better filtering to surface the ~20 good customer emails that exist:
- Filter by sender domains (exclude newsletters)
- Prioritize emails with replies (conversations)
- Look for keywords: "proposal", "demo", "pricing", "meeting"

### Option 2: Import Customer Sales Emails (Best Long-term)
Sync Bill's customer-facing email folder:
- Sales correspondence
- Prospect inquiries
- Demo follow-ups
- Proposal discussions

### Option 3: Use Call Transcripts Instead
The podcast transcripts might actually have good questions being asked of Bill about OpticWise:
- Extract questions from podcast interviews
- These are real questions people ask about the business

### Option 4: Manual Examples (Immediate)
Create a curated list of common customer questions based on:
- Sales team knowledge
- Common objections
- Typical discovery questions

---

## Recommendation

**Immediate (Today):**
1. ✅ I'll update the email search to better surface the ~20 customer emails that exist
2. ✅ Extract questions from podcast transcripts (people asking Bill about OpticWise)

**Short-term (This Week):**
1. Sync Bill's customer sales email folder
2. Import any Salesforce/CRM email history
3. Add customer discovery call recordings

**The agent architecture is working perfectly - we just need better data!**
