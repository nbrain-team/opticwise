# Slack Integration for OWnet Agent - Implementation Guide

**Date:** January 29, 2026  
**Status:** 📋 Ready to Implement  
**Priority:** High - Client Request

---

## 🎯 Objective

Enable users to access the OWnet AI Agent directly from Slack by mentioning `@ownet` with their question. The bot will retrieve the same high-quality output as the web interface and post it in Slack.

---

## 🏗️ Architecture Overview

```
Slack Message (@ownet question)
    ↓
Slack Events API
    ↓
/api/slack/events (webhook endpoint)
    ↓
Verify Slack signature
    ↓
Extract message & user
    ↓
Create/get OWnet session for Slack user
    ↓
Call existing OWnet chat API
    ↓
Format response for Slack
    ↓
Post to Slack thread
```

---

## 📦 Step 1: Install Slack SDK

```bash
cd /Users/dannydemichele/Opticwise/ow
npm install @slack/bolt @slack/web-api
```

**Packages:**
- `@slack/bolt` - Slack app framework
- `@slack/web-api` - Slack Web API client

---

## 🔐 Step 2: Environment Variables

Add to your `.env` file (and Render environment):

```bash
# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token (if using Socket Mode)

# Optional: Slack OAuth (if you have them)
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_OAUTH_TOKEN=xoxp-your-oauth-token
SLACK_REFRESH_TOKEN=your-refresh-token
```

**You mentioned you have:**
- ✅ Access token
- ✅ Refresh OAuth tokens

**You'll need to get from Slack App settings:**
- Bot Token (starts with `xoxb-`)
- Signing Secret
- App Token (if using Socket Mode)

---

## 🔧 Step 3: Create Slack API Route

**File:** `/ow/app/api/slack/events/route.ts`

This handles incoming Slack events (mentions, messages, etc.)

---

## 🔧 Step 4: Create Slack Message Handler

**File:** `/ow/lib/slack-handler.ts`

This processes Slack messages and calls the OWnet agent.

---

## 🔧 Step 5: Create Slack Formatter

**File:** `/ow/lib/slack-formatter.ts`

This formats OWnet responses for Slack (markdown → Slack blocks).

---

## 🔧 Step 6: Database Schema

Add Slack session tracking to database:

```sql
-- Add Slack integration tables
CREATE TABLE IF NOT EXISTS "SlackUser" (
  id TEXT PRIMARY KEY,
  "slackUserId" TEXT UNIQUE NOT NULL,
  "slackTeamId" TEXT NOT NULL,
  "slackUserName" TEXT,
  "slackUserEmail" TEXT,
  "ownetUserId" TEXT, -- Link to internal user if applicable
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SlackSession" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slackUserId" TEXT NOT NULL REFERENCES "SlackUser"(id),
  "slackChannelId" TEXT NOT NULL,
  "slackThreadTs" TEXT, -- Thread timestamp for threading
  "ownetSessionId" TEXT, -- Link to AgentChatSession
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SlackUser_slackUserId_idx" ON "SlackUser"("slackUserId");
CREATE INDEX IF NOT EXISTS "SlackSession_slackUserId_idx" ON "SlackSession"("slackUserId");
CREATE INDEX IF NOT EXISTS "SlackSession_slackThreadTs_idx" ON "SlackSession"("slackThreadTs");
```

---

## 🔧 Step 7: Slack App Configuration

### In Slack App Settings (api.slack.com/apps):

**1. OAuth & Permissions → Bot Token Scopes:**
- `app_mentions:read` - See @ownet mentions
- `chat:write` - Post messages
- `channels:history` - Read channel messages
- `groups:history` - Read private channel messages
- `im:history` - Read DMs
- `users:read` - Get user info
- `users:read.email` - Get user emails

**2. Event Subscriptions:**
- Enable Events: ON
- Request URL: `https://your-domain.com/api/slack/events`
- Subscribe to bot events:
  - `app_mention` - When @ownet is mentioned
  - `message.im` - DMs to bot

**3. Install App to Workspace:**
- Install to your Slack workspace
- Copy Bot User OAuth Token (starts with `xoxb-`)
- Copy Signing Secret

---

## 📝 Implementation Files

I'll create all the necessary files for you. Here's what will be created:

### API Routes
1. `/ow/app/api/slack/events/route.ts` - Webhook endpoint
2. `/ow/app/api/slack/oauth/route.ts` - OAuth callback (if needed)

### Libraries
1. `/ow/lib/slack-handler.ts` - Message processing
2. `/ow/lib/slack-formatter.ts` - Response formatting
3. `/ow/lib/slack-client.ts` - Slack API client

### Scripts
1. `/ow/scripts/init-slack-tables.ts` - Database setup
2. `/ow/scripts/test-slack-integration.ts` - Test suite

### Documentation
1. `/SLACK_INTEGRATION_GUIDE.md` - Complete guide
2. `/SLACK_SETUP_CHECKLIST.md` - Setup steps

---

## 🎯 Features

### Core Functionality
- ✅ Mention `@ownet` with question
- ✅ Bot responds in thread
- ✅ Same AI quality as web interface
- ✅ Source citations included
- ✅ BrandScript voice maintained
- ✅ Deep analysis mode supported

### Advanced Features
- ✅ Thread support (conversations)
- ✅ Session management per user
- ✅ Typing indicators
- ✅ Progress updates for long queries
- ✅ Error handling
- ✅ Rate limiting

### Slack-Specific
- ✅ Slack markdown formatting
- ✅ Message blocks (rich formatting)
- ✅ Buttons for actions (optional)
- ✅ File attachments (for long reports)
- ✅ Emoji reactions for status

---

## 🔄 User Flow

### Example Interaction

**User in Slack:**
```
@ownet What deals are in the pipeline?
```

**Bot Response (in thread):**
```
🔍 Analyzing your question...

## Open Deals

**1. Koelbel Metropoint** - $50K
- Stage: Discovery & Qualification
- Last Activity: Jan 15, 2026
- Next Step: Schedule technical review

**2. Mass Equities Vario** - $960K
- Stage: Proposal
- Last Activity: Nov 20, 2025
- Next Step: Follow up on pricing

---

### Key Insights
- 2 deals need immediate attention
- Average deal size: $405K

📚 Sources: 3 CRM records, 2 transcripts
```

---

## 🚀 Implementation Steps

### Phase 1: Core Integration (30 minutes)
1. Install Slack SDK packages
2. Create Slack API route
3. Create message handler
4. Create response formatter
5. Test with simple echo

### Phase 2: OWnet Integration (45 minutes)
1. Create Slack session management
2. Connect to OWnet chat API
3. Format responses for Slack
4. Add threading support
5. Test with real queries

### Phase 3: Advanced Features (30 minutes)
1. Add progress indicators
2. Add source citations formatting
3. Add deep analysis support
4. Add error handling
5. Add rate limiting

### Phase 4: Database & Testing (30 minutes)
1. Create database tables
2. Create test suite
3. Test end-to-end
4. Deploy to Render

**Total Time:** ~2-2.5 hours

---

## 🎨 Slack Message Formatting

### Markdown Conversion

**Web (Markdown):**
```markdown
## Heading
**Bold text**
- Bullet point
> Blockquote
```

**Slack (mrkdwn):**
```
*Heading*
*Bold text*
• Bullet point
> Blockquote
```

### Rich Blocks

Slack supports rich message blocks for better formatting:
- Header blocks
- Section blocks with fields
- Divider blocks
- Context blocks (for metadata)
- Button blocks (for actions)

---

## 🔐 Security Considerations

### Signature Verification
- ✅ Verify Slack signature on every request
- ✅ Prevent replay attacks (timestamp check)
- ✅ Validate signing secret

### User Authentication
- ✅ Map Slack users to OWnet users
- ✅ Maintain separate sessions per user
- ✅ Respect user permissions

### Rate Limiting
- ✅ Limit requests per user
- ✅ Limit requests per channel
- ✅ Prevent abuse

---

## 📊 Session Management

### Slack User → OWnet Session

**Mapping:**
```
Slack User ID → SlackUser record
SlackUser → OWnet User (if applicable)
Slack Thread → SlackSession
SlackSession → AgentChatSession
```

**Benefits:**
- Conversation history maintained
- Context preserved across messages
- User-specific sessions
- Thread-based conversations

---

## 🎯 Next Steps

**Ready to implement?** I can create all the files right now. Just confirm:

1. **Do you have the Slack Bot Token?** (starts with `xoxb-`)
2. **Do you have the Signing Secret?**
3. **Do you want Socket Mode or HTTP webhooks?**
   - Socket Mode: Easier for development, no public URL needed
   - HTTP webhooks: Better for production, requires public URL

**Or I can just create everything with placeholder environment variables and you can add them later.**

---

## 🚀 Quick Start (Once Implemented)

### 1. Add Environment Variables
```bash
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret
```

### 2. Deploy to Render
```bash
git push origin main
```

### 3. Configure Slack App
- Set webhook URL: `https://your-domain.com/api/slack/events`
- Subscribe to events: `app_mention`, `message.im`

### 4. Test in Slack
```
@ownet What deals do we have?
```

---

## 📝 Estimated Effort

**Development:** 2-2.5 hours  
**Testing:** 30 minutes  
**Deployment:** 15 minutes  
**Total:** ~3 hours

---

**Ready to proceed?** I'll create all the implementation files now!
