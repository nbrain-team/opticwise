# Sales Inbox Hourly Sync - Cron Job Setup

## Quick Setup Guide

The sales inbox now automatically syncs emails from bill@opticwise.com. To enable hourly syncing, you need to set up a cron job.

## Step 1: Generate a Cron Secret

First, add a `CRON_SECRET` environment variable to Render:

1. Go to: https://dashboard.render.com/web/srv-d4ebnhp5pdvs73fpa13g/env
2. Click "Add Environment Variable"
3. Add:
   - **Key**: `CRON_SECRET`
   - **Value**: Generate a random secret (e.g., `opticwise_cron_2026_secure_key`)
4. Click "Save Changes"

## Step 2: Set Up Cron Job

### Option A: Using Render Cron Jobs (Recommended)

1. Go to Render Dashboard: https://dashboard.render.com
2. Click "New +" button in top right
3. Select "Cron Job"
4. Configure:
   - **Name**: `sales-inbox-hourly-sync`
   - **Region**: Same as your web service (Oregon)
   - **Schedule**: `0 * * * *` (every hour at :00)
   - **Command**: 
     ```bash
     curl -X GET "https://opticwise-frontend.onrender.com/api/sales-inbox/sync?secret=YOUR_CRON_SECRET_HERE"
     ```
     *(Replace `YOUR_CRON_SECRET_HERE` with the actual secret you created)*
   - **Docker Image**: `curlimages/curl:latest` (or any image with curl)
5. Click "Create Cron Job"

### Option B: Using EasyCron (Free Alternative)

1. Sign up at: https://www.easycron.com/
2. Create a new cron job:
   - **URL**: `https://opticwise-frontend.onrender.com/api/sales-inbox/sync?secret=YOUR_CRON_SECRET_HERE`
   - **Schedule**: Every 1 hour
   - **Method**: GET
   - **Timezone**: Your preferred timezone
3. Save and enable the job

### Option C: Using cron-job.org (Free Alternative)

1. Sign up at: https://cron-job.org/
2. Create a new cron job:
   - **Title**: Sales Inbox Sync
   - **URL**: `https://opticwise-frontend.onrender.com/api/sales-inbox/sync?secret=YOUR_CRON_SECRET_HERE`
   - **Schedule**: Every hour (0 * * * *)
   - **Request method**: GET
3. Save and enable

## Step 3: Test the Sync

### Manual Test via Browser

Visit this URL (replace with your secret):
```
https://opticwise-frontend.onrender.com/api/sales-inbox/sync?secret=YOUR_CRON_SECRET_HERE
```

You should see a JSON response like:
```json
{
  "success": true,
  "synced": 15,
  "linked": 12,
  "errors": 0,
  "total": 20,
  "skipped": 5
}
```

### Test via Terminal

```bash
curl -X GET "https://opticwise-frontend.onrender.com/api/sales-inbox/sync?secret=YOUR_CRON_SECRET_HERE"
```

### Test via Sales Inbox UI

1. Go to: https://opticwise-frontend.onrender.com/sales-inbox
2. Click the "Sync Now" button
3. Wait a few seconds and refresh the page
4. You should see new email conversations

## Step 4: Verify It's Working

After the cron job runs for the first time:

1. Check the Sales Inbox UI for new conversations
2. Check Render logs for sync activity:
   - Go to: https://dashboard.render.com/web/srv-d4ebnhp5pdvs73fpa13g
   - Click "Logs" tab
   - Look for entries like:
     ```
     🔄 Starting sales inbox sync...
     📅 Fetching emails from last 24 hours
     ✅ Found 25 messages
     📥 New messages to process: 10
     🔗 Linked: 8 to contacts
     ✅ Sync complete
     ```

## Cron Schedule Examples

- **Every hour**: `0 * * * *`
- **Every 2 hours**: `0 */2 * * *`
- **Every 30 minutes**: `*/30 * * * *`
- **Every day at 9 AM**: `0 9 * * *`
- **Every weekday at 9 AM**: `0 9 * * 1-5`

## Troubleshooting

### Cron Job Returns 401 Unauthorized

- Check that `CRON_SECRET` environment variable is set in Render
- Verify the secret in your cron job URL matches exactly
- Make sure there are no extra spaces or characters

### No New Emails Appearing

1. Check that contacts have email addresses in the database
2. Verify Gmail authentication is working:
   ```bash
   curl https://opticwise-frontend.onrender.com/api/integrations/google/gmail
   ```
3. Check Render logs for errors

### Cron Job Not Running

1. Verify the cron job is enabled in your cron service
2. Check the cron service's execution logs
3. Test the URL manually in a browser

## Initial Bulk Import

To import older emails (e.g., last 30 days):

```bash
curl -X POST https://opticwise-frontend.onrender.com/api/sales-inbox/sync \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 720}'
```

Or via Render Shell:
```bash
cd ow && npm run sync:gmail
```

## Monitoring

### Check Sync Stats

View the Sales Inbox UI header to see:
- Total conversations
- Total messages
- Last sync time (implicit from newest message)

### Check Logs

Render logs will show:
- How many emails were fetched
- How many were new vs. already synced
- How many were linked to contacts
- Any errors that occurred

## Support

If you encounter issues:

1. Check Render logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test the sync endpoint manually
4. Check that contacts have valid email addresses
5. Ensure Gmail API quotas haven't been exceeded

For further assistance, refer to `SALES_INBOX_SETUP.md` for detailed troubleshooting steps.

