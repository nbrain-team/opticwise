# 🔧 Fix Gmail Sync Issue

## 🚨 Problem Identified

**Gmail sync is not working** because:
- ❌ `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable is **missing on Render**
- ❌ Bill's last email sync shows "error" status
- ❌ Emails only synced up to January 26, 2026 (almost a month behind)

**Error message:**
```
Service account credentials not found. Set GOOGLE_SERVICE_ACCOUNT_JSON env var 
or upload google-service-account.json to /etc/secrets/
```

---

## ✅ Solution

### Step 1: Add GOOGLE_SERVICE_ACCOUNT_JSON to Render

You need to add the Google Service Account JSON to Render's environment variables.

**Go to Render Dashboard:**
1. Visit: https://dashboard.render.com/web/srv-d4ebnhp5pdvs73fpa13g/env
2. Click "Add Environment Variable"
3. Add:
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value**: The entire JSON content of your Google service account file
4. Click "Save Changes"
5. Render will automatically redeploy

**The JSON should look like:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

### Step 2: Verify the Cron Job is Running

The cron job is already configured in `render.yaml`:

```yaml
- type: cron
  name: opticwise-email-sync
  schedule: "*/15 * * * *"  # Every 15 minutes
  startCommand: |
    curl -s -X GET "https://opticwise-frontend.onrender.com/api/sales-inbox/sync?secret=$CRON_SECRET"
```

**This will automatically sync emails every 15 minutes** once the service account is added.

---

### Step 3: Manual Sync to Catch Up

After adding the environment variable, manually trigger a sync to catch up on the last month:

**Option A: Via Render Shell**
```bash
cd ow
npm run sync:gmail
```

**Option B: Via API (if CRON_SECRET is set)**
```bash
curl -X POST "https://opticwise-frontend.onrender.com/api/sales-inbox/sync" \
  -H "Content-Type: application/json" \
  -d '{"userId": "cmi4xt68j00008ot0v4wygbsz", "hoursBack": 720}'
```

**Option C: Via Sales Inbox UI**
1. Go to: https://opticwise-frontend.onrender.com/sales-inbox
2. Look for a "Sync Now" button
3. Click to manually trigger sync

---

## 🎯 What This Will Fix

### Automatic Email Syncing
Once fixed, emails will automatically sync:
- ✅ **Every 15 minutes** (via cron job)
- ✅ **Last 24 hours** of emails each run
- ✅ **No manual intervention** needed
- ✅ **Catches up automatically** if sync fails

### Bill's Email Sync
- ✅ Status will change from "error" to "ok"
- ✅ Emails will be up-to-date (Feb 23, 2026)
- ✅ Sales Inbox will show recent conversations
- ✅ New contacts will be linked automatically

---

## 📊 Current Status

**Email Database:**
- Most recent email: January 26, 2026
- Behind by: ~28 days
- Total emails: 11,174

**Bill's Sync Status:**
- Email sync enabled: ✅ Yes
- Last sync attempt: Today (Feb 23, 22:17)
- Sync status: ❌ Error
- Reason: Missing GOOGLE_SERVICE_ACCOUNT_JSON

**Cron Job:**
- Configured: ✅ Yes (render.yaml)
- Schedule: Every 15 minutes
- Status: Running but failing (missing credentials)

---

## 🔍 Where to Find the Service Account JSON

### Option 1: Check Existing Environment
If you previously had this working, check:
- Old Render environment variables
- Backup configuration files
- Google Cloud Console

### Option 2: Create New Service Account

If you need to create a new one:

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select your project
3. Go to "IAM & Admin" → "Service Accounts"
4. Create new service account or use existing
5. Download JSON key
6. Add to Render environment variables

**Required Permissions:**
- Gmail API (read/send)
- Calendar API
- Drive API (readonly)

**Domain-Wide Delegation:**
- Must be enabled to impersonate bill@opticwise.com

---

## 🚀 Once Fixed

### Automatic Syncing Will:
1. Run every 15 minutes
2. Fetch last 24 hours of emails
3. Link emails to contacts automatically
4. Update Sales Inbox in real-time
5. Keep CRM up-to-date

### Manual Syncing Options:
- **Sales Inbox UI**: Click "Sync Now" button
- **API endpoint**: POST to `/api/sales-inbox/sync`
- **Render Shell**: `npm run sync:gmail`

---

## 📋 Quick Fix Checklist

- [ ] Add `GOOGLE_SERVICE_ACCOUNT_JSON` to Render environment
- [ ] Wait for Render to redeploy (~2-3 minutes)
- [ ] Manually trigger sync to catch up on last month
- [ ] Verify Bill's sync status changes to "ok"
- [ ] Check Sales Inbox for recent emails
- [ ] Confirm cron job is running (check Render logs)

---

## 🎯 Expected Behavior After Fix

**Immediately after adding credentials:**
- Cron job will start working (next run in <15 minutes)
- Manual sync will work
- Bill's sync status will be "ok"

**Within 1 hour:**
- All emails from last month will be synced
- Sales Inbox will be up-to-date
- Contacts will have recent email activity

**Ongoing:**
- New emails sync every 15 minutes automatically
- No manual intervention needed
- Always up-to-date

---

**Current Issue**: Missing GOOGLE_SERVICE_ACCOUNT_JSON on Render  
**Fix**: Add environment variable to Render  
**Time to Fix**: 5 minutes + redeploy time  
**Result**: Automatic email syncing every 15 minutes ✅
