# Slack Integration Setup Checklist

**Date:** January 29, 2026  
**Status:** 📋 Ready to Configure  
**Time Required:** ~30 minutes

---

## ✅ Prerequisites

- [x] Slack workspace admin access
- [x] Access token (you have this)
- [x] Refresh OAuth tokens (you have this)
- [ ] Slack Bot Token (`xoxb-...`)
- [ ] Slack Signing Secret
- [ ] Render deployment access

---

## 🔧 Step 1: Configure Slack App (10 minutes)

### 1.1 Go to Slack API Dashboard
Visit: https://api.slack.com/apps

### 1.2 Create New App (or use existing)
- Click "Create New App"
- Choose "From scratch"
- App Name: **OWnet Agent**
- Workspace: Select your workspace
- Click "Create App"

### 1.3 Configure OAuth & Permissions
Navigate to: **OAuth & Permissions**

**Add Bot Token Scopes:**
```
✅ app_mentions:read      - See @ownet mentions
✅ chat:write             - Post messages
✅ chat:write.public      - Post in public channels
✅ channels:history       - Read channel messages
✅ groups:history         - Read private channel messages
✅ im:history             - Read DMs
✅ im:write               - Send DMs
✅ users:read             - Get user info
✅ users:read.email       - Get user emails
✅ files:write            - Upload files (for long responses)
```

**Install App to Workspace:**
- Scroll to top of OAuth & Permissions page
- Click "Install to Workspace"
- Click "Allow"
- **Copy the Bot User OAuth Token** (starts with `xoxb-`)
  - Save this as `SLACK_BOT_TOKEN`

### 1.4 Get Signing Secret
Navigate to: **Basic Information**
- Scroll to "App Credentials"
- **Copy the Signing Secret**
  - Save this as `SLACK_SIGNING_SECRET`

---

## 🗄️ Step 2: Initialize Database (5 minutes)

### 2.1 Run Database Migration

```bash
cd /Users/dannydemichele/Opticwise/ow
npx tsx scripts/init-slack-tables.ts
```

**Expected Output:**
```
✅ SlackUser table created
✅ SlackSession table created
✅ SlackMessageLog table created
🎉 Slack integration tables initialized successfully!
```

### 2.2 Verify Tables

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('SlackUser', 'SlackSession', 'SlackMessageLog');
```

---

## 🌐 Step 3: Configure Environment Variables (5 minutes)

### 3.1 Local Development

Add to `/Users/dannydemichele/Opticwise/.env`:

```bash
# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here

# Optional: If using Socket Mode for development
SLACK_APP_TOKEN=xapp-your-app-token-here

# Your app URL (for API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Render Production

Add to Render environment variables:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
```

**How to add in Render:**
1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable
6. Click "Save Changes"

---

## 🔗 Step 4: Configure Slack Event Subscriptions (5 minutes)

### 4.1 Get Your Webhook URL

**Format:** `https://your-app.onrender.com/api/slack/events`

**Example:** `https://opticwise.onrender.com/api/slack/events`

### 4.2 Enable Event Subscriptions

Navigate to: **Event Subscriptions** in Slack App settings

**Enable Events:** ON

**Request URL:** Enter your webhook URL
- Slack will send a verification challenge
- Our endpoint will automatically respond
- You should see ✅ "Verified"

### 4.3 Subscribe to Bot Events

Click "Subscribe to bot events" and add:

```
✅ app_mention       - When @ownet is mentioned
✅ message.im        - Direct messages to bot
```

**Save Changes**

---

## 🚀 Step 5: Deploy to Render (5 minutes)

### 5.1 Commit and Push

```bash
cd /Users/dannydemichele/Opticwise

# Stage all Slack integration files
git add .

# Commit
git commit -m "feat: Slack integration for OWnet agent"

# Push (triggers Render deployment)
git push origin main
```

### 5.2 Verify Deployment

**Check Render logs for:**
```
✅ Build successful
✅ Deploy live
```

### 5.3 Test Webhook

Visit: `https://your-app.onrender.com/api/slack/events`

**Expected Response:**
```json
{
  "status": "ok",
  "service": "OWnet Slack Integration",
  "timestamp": "2026-01-29T..."
}
```

---

## 🧪 Step 6: Test Integration (5 minutes)

### 6.1 Test in Slack

**Open Slack → Go to any channel where bot is added**

**Test 1: Simple Question**
```
@ownet What deals do we have?
```

**Expected:**
- 👀 Eyes reaction (processing)
- 🔍 "Analyzing your question..." (initial message)
- Response with deal list
- ✅ Checkmark reaction (complete)

**Test 2: Deep Analysis**
```
@ownet Deep analysis of all customer activity with max tokens
```

**Expected:**
- Same flow as above
- Longer, comprehensive response
- Source citations at bottom
- May include file attachment if very long

**Test 3: Thread Conversation**
```
@ownet What's the status of Acme Corp?
```

Then in the thread:
```
@ownet What did we discuss in our last call with them?
```

**Expected:**
- Maintains conversation context
- Remembers previous question
- Provides contextual answer

### 6.2 Test Direct Message

**Open DM with OWnet bot**

```
What deals need attention?
```

**Expected:**
- Same quality response as channel mention
- No need for @ownet prefix in DMs

---

## 🔍 Step 7: Verify Everything Works

### Checklist

- [ ] Bot responds to @ownet mentions
- [ ] Bot responds in threads
- [ ] Bot maintains conversation context
- [ ] Responses match web interface quality
- [ ] Source citations included
- [ ] BrandScript voice maintained
- [ ] Deep analysis mode works
- [ ] Long responses handled (file upload)
- [ ] Error handling works
- [ ] Reactions added correctly

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error

**Cause:** Signature verification failing

**Fix:**
1. Check `SLACK_SIGNING_SECRET` is correct
2. Check timestamp is recent (within 5 minutes)
3. Verify webhook URL is correct

### Issue: Bot Doesn't Respond

**Cause:** Event not reaching webhook

**Fix:**
1. Check Render logs for incoming requests
2. Verify Event Subscriptions are enabled
3. Verify Request URL is verified (✅)
4. Check bot is added to channel

### Issue: "Bot Not in Channel"

**Cause:** Bot needs to be invited

**Fix:**
```
/invite @ownet
```

### Issue: Response Too Slow

**Cause:** Slack expects response within 3 seconds

**Fix:**
- We respond immediately with `{ ok: true }`
- Actual processing happens asynchronously
- This is already implemented correctly

### Issue: Database Connection Error

**Cause:** Tables not created

**Fix:**
```bash
npx tsx scripts/init-slack-tables.ts
```

---

## 📊 Monitoring

### Check Slack Activity

**Query:**
```sql
SELECT 
  COUNT(*) as total_messages,
  COUNT(DISTINCT "slackUserId") as unique_users,
  AVG("responseTime") as avg_response_time_ms
FROM "SlackMessageLog"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

### Check Recent Messages

**Query:**
```sql
SELECT 
  su."slackUserName",
  sm.question,
  sm."responseTime",
  sm."createdAt"
FROM "SlackMessageLog" sm
JOIN "SlackUser" su ON sm."slackUserId" = su.id
ORDER BY sm."createdAt" DESC
LIMIT 10;
```

### Check Error Rate

**Query:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE error IS NOT NULL) as errors,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE error IS NOT NULL)::numeric / COUNT(*) * 100, 2) as error_rate
FROM "SlackMessageLog"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

---

## 🎯 Success Criteria

### Functional
- [ ] Bot responds to mentions within 5 seconds
- [ ] Responses match web interface quality
- [ ] Conversation context maintained in threads
- [ ] Source citations included
- [ ] BrandScript voice consistent
- [ ] Deep analysis mode works
- [ ] Error handling graceful

### Performance
- [ ] Response time < 30 seconds (regular queries)
- [ ] Response time < 2 minutes (deep analysis)
- [ ] No timeouts
- [ ] No dropped messages

### User Experience
- [ ] Clear progress indicators
- [ ] Professional formatting
- [ ] Easy to read in Slack
- [ ] File attachments for long responses
- [ ] Helpful error messages

---

## 📝 Post-Setup Tasks

### 1. Announce to Team

**Slack Message:**
```
🎉 OWnet is now available in Slack!

You can now ask OWnet questions directly in Slack:

• Mention @ownet in any channel
• Ask in DMs
• Use threads for conversations

Examples:
• @ownet What deals are in the pipeline?
• @ownet Deep analysis of customer activity
• @ownet What did we discuss with Acme Corp?

Same AI quality as the web interface, right here in Slack!
```

### 2. Create Help Command

Add to Slack handler:
```
@ownet help
```

Response:
```
Hi! I'm OWnet, your AI assistant for deals, customers, and business data.

Ask me anything:
• What deals are in the pipeline?
• Deep analysis of all customer activity
• What did we discuss with [Customer]?
• Show me recent emails from [Contact]

Features:
• Deep analysis mode (use "max tokens" or "deep analysis")
• Source citations (see what data I used)
• Conversation memory (use threads)

Tips:
• Use threads to keep conversations organized
• Request "deep analysis" for comprehensive reports
• I have access to all your CRM, emails, calls, and documents
```

### 3. Monitor Usage

- Check logs daily for first week
- Review error rates
- Collect user feedback
- Optimize based on usage patterns

---

## 🎉 You're Done!

Once you complete this checklist, users can:
- ✅ Mention `@ownet` in Slack
- ✅ Get same AI quality as web interface
- ✅ See source citations
- ✅ Use deep analysis mode
- ✅ Have threaded conversations
- ✅ Get comprehensive reports

**Next:** Follow the steps above and test! 🚀

---

## 📞 Need Help?

**Check:**
1. Render logs: Look for `[Slack]` prefixed messages
2. Database: Query `SlackMessageLog` for errors
3. Slack App logs: Check Event Subscriptions page

**Common Issues:**
- Signature verification: Check signing secret
- Bot not responding: Check bot is in channel
- Slow responses: Check Render logs for errors
- Database errors: Run init-slack-tables.ts

---

**Ready to go live!** Follow the checklist step by step. 🎯
