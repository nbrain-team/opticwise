# Sales Inbox Email Sync Setup

## Overview

The Sales Inbox is now connected to the Gmail account (bill@opticwise.com) and automatically syncs emails associated with contact records in the database.

## Features

✅ **Automatic Email Sync**
- Syncs emails from bill@opticwise.com every hour
- Links emails to contact records based on email addresses
- Creates conversation threads in the Sales Inbox
- Stores full email content for AI search via OWNet Agent

✅ **Contact Matching**
- Matches emails to contacts using all email fields (email, emailWork, emailHome, emailOther)
- Links conversations to organizations automatically
- Shows contact and organization details in inbox

✅ **Sales Inbox UI**
- Clean, modern interface with thread list and message detail view
- Shows conversation history with timestamps
- Displays incoming/outgoing message indicators
- Links to contact, organization, and deal records
- Manual "Sync Now" button for immediate sync

## How It Works

### 1. Email Sync Process

When the sync runs (hourly or manually):

1. **Fetch Recent Emails**: Gets emails from the last 24 hours from Gmail
2. **Match Contacts**: Compares email addresses (from/to/cc) with contact records
3. **Create Threads**: Groups related emails into conversation threads
4. **Store Messages**: Saves email content and metadata
5. **Generate Embeddings**: Creates AI embeddings for semantic search
6. **Link to CRM**: Connects emails to contacts, organizations, and deals

### 2. Data Storage

**GmailMessage Table**:
- Full email content (text and HTML)
- Sender, recipients, CC, BCC
- Attachments metadata
- AI embeddings for search
- Links to Person, Organization, Deal

**EmailThread Table**:
- Conversation subject
- Links to Person, Organization, Deal
- Last activity timestamp

**EmailMessage Table**:
- Individual messages in threads
- Direction (incoming/outgoing)
- Full message body
- Sent timestamp

## Setup Instructions

### 1. Environment Variables

Ensure these are set in Render (already configured):

```bash
GOOGLE_SERVICE_ACCOUNT_JSON=<service account credentials>
GOOGLE_IMPERSONATE_USER=bill@opticwise.com
OPENAI_API_KEY=<your OpenAI API key>
CRON_SECRET=<random secret for cron authentication>
```

### 2. Set Up Hourly Cron Job on Render

#### Option A: Using Render Cron Jobs (Recommended)

1. Go to Render Dashboard: https://dashboard.render.com
2. Click "New +" → "Cron Job"
3. Configure:
   - **Name**: `sales-inbox-sync`
   - **Schedule**: `0 * * * *` (every hour at :00)
   - **Command**: 
     ```bash
     curl -X GET "https://opticwise-frontend.onrender.com/api/sales-inbox/sync?secret=YOUR_CRON_SECRET"
     ```
   - **Environment**: Same as your web service

#### Option B: Using External Cron Service

Use a service like cron-job.org or EasyCron:

1. Create a new cron job
2. Set URL: `https://opticwise-frontend.onrender.com/api/sales-inbox/sync?secret=YOUR_CRON_SECRET`
3. Set schedule: Every hour
4. Method: GET

#### Option C: Manual Sync

Users can click "Sync Now" button in the Sales Inbox UI anytime.

### 3. Initial Sync

Run the initial sync to import existing emails:

```bash
# Via Render Shell
cd ow && npm run sync:gmail

# Or via API
curl -X POST https://opticwise-frontend.onrender.com/api/sales-inbox/sync \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 720}'  # Last 30 days
```

## API Endpoints

### POST /api/sales-inbox/sync

Trigger email sync programmatically.

**Request Body**:
```json
{
  "hoursBack": 24  // Optional, default: 24
}
```

**Response**:
```json
{
  "success": true,
  "synced": 45,
  "linked": 38,
  "errors": 0,
  "total": 50,
  "skipped": 5
}
```

### GET /api/sales-inbox/sync?secret=YOUR_SECRET

Trigger sync via GET (for cron jobs).

**Query Parameters**:
- `secret`: Cron secret for authentication (required if CRON_SECRET env var is set)

## Usage

### Viewing Email Conversations

1. Navigate to **Sales Inbox** in the main menu
2. Browse conversation threads in the left sidebar
3. Click a thread to view full message history
4. Click contact/organization names to view their profiles
5. Click "View Deal" to see associated deal (if linked)

### Manual Sync

Click the **"Sync Now"** button at the top of the Sales Inbox to immediately fetch new emails.

### Linking Emails to Deals

Emails are automatically linked to deals if:
- The contact is associated with an open deal
- The email subject or content mentions a deal

You can also manually create a deal from an email conversation by clicking "Create Deal".

## Monitoring

### Check Sync Status

View sync logs in Render:
1. Go to your web service dashboard
2. Click "Logs" tab
3. Search for "sales inbox sync" or "Gmail sync"

### Verify Sync is Working

1. Check the Sales Inbox UI - should show recent conversations
2. Look for log entries like:
   ```
   🔄 Starting sales inbox sync...
   ✅ Found 25 messages
   📥 New messages to process: 10
   🔗 Linked: 8 to contacts
   ✅ Sync complete
   ```

## Troubleshooting

### No Emails Appearing

1. **Check Gmail Authentication**:
   - Verify `GOOGLE_SERVICE_ACCOUNT_JSON` is set correctly
   - Verify `GOOGLE_IMPERSONATE_USER=bill@opticwise.com`
   - Test Gmail API: `curl https://opticwise-frontend.onrender.com/api/integrations/google/gmail`

2. **Check Contact Email Addresses**:
   - Emails only appear if they match a contact's email address
   - Verify contacts have email addresses in the database
   - Check all email fields: email, emailWork, emailHome, emailOther

3. **Run Manual Sync**:
   - Click "Sync Now" in the UI
   - Check logs for errors

### Sync Failing

1. **Check Environment Variables**:
   ```bash
   # In Render shell
   echo $GOOGLE_SERVICE_ACCOUNT_JSON
   echo $GOOGLE_IMPERSONATE_USER
   echo $OPENAI_API_KEY
   ```

2. **Check API Logs**:
   - Look for error messages in Render logs
   - Common issues: API quota exceeded, invalid credentials

3. **Test Sync Manually**:
   ```bash
   curl -X POST https://opticwise-frontend.onrender.com/api/sales-inbox/sync \
     -H "Content-Type: application/json" \
     -d '{"hoursBack": 1}'
   ```

### Cron Job Not Running

1. **Verify Cron Secret**:
   - Ensure `CRON_SECRET` env var is set
   - Ensure cron job URL includes correct secret parameter

2. **Check Cron Service**:
   - Verify cron job is active
   - Check cron job execution logs
   - Test URL manually in browser

## Performance

- **Sync Speed**: ~10-15 emails per second
- **API Quota**: Gmail API allows 250 quota units per user per second
- **Storage**: Each email with embedding ~5-10 KB
- **Hourly Sync**: Typically processes 10-50 new emails per hour

## Future Enhancements

- [ ] Reply to emails directly from Sales Inbox
- [ ] Compose new emails to contacts
- [ ] Email templates for common responses
- [ ] Smart reply suggestions using AI
- [ ] Email sentiment analysis
- [ ] Automatic deal creation from email content
- [ ] Email tracking (opens, clicks)
- [ ] Email scheduling and follow-up reminders

## Support

For issues or questions:
1. Check Render logs for error messages
2. Verify all environment variables are set
3. Test Gmail API connection
4. Contact support with log excerpts

