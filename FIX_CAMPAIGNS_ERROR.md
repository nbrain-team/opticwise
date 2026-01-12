# Fix Campaigns Page Error - Quick Guide

**Error:** "Application error: a server-side exception has occurred"  
**Cause:** Marketing automation database tables don't exist yet  
**Solution:** Run migration on Render (2 minutes)

---

## Quick Fix (2 Minutes)

### Step 1: Open Render Shell

1. Go to: https://dashboard.render.com
2. Click your service: **opticwise-frontend**
3. Click **"Shell"** in left sidebar
4. Wait for shell to connect

### Step 2: Run Migration

Copy and paste this command:

```bash
cd ow && npx prisma db push --accept-data-loss
```

Press Enter and wait (30-60 seconds).

### Step 3: Verify

Run this to check if tables were created:

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Campaign\""
```

If you see a number (even if it's 0), it worked!

### Step 4: Test

Go to: https://opticwise-frontend.onrender.com/campaigns

Should now load without error.

---

## What This Does

Creates 13 new database tables:
- Campaign
- CampaignLead
- CampaignTouchpoint
- CampaignSequence
- CampaignAnalytics
- AuditRequest
- BookRequest
- BookEngagement
- Conference
- ConferenceAttendee
- EmailTemplate
- ChatbotConversation
- ChatbotMessage

All linked to your existing CRM tables (Person, Organization, Deal, User).

---

## After Migration

All these pages will work:
- /campaigns
- /campaigns/new
- /campaigns/[id]
- /conferences
- /conferences/new
- /audit-tool (public)
- /book-request (public)

---

**That's it! Just run the one command in Render Shell and everything will work.**

