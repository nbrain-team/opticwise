# Fathom API Key Verification & Troubleshooting

## ✅ What We Confirmed

### Correct API Endpoint (from official docs)
```
GET https://api.fathom.ai/external/v1/meetings
Header: X-Api-Key: YOUR_API_KEY
```

**Query Parameters:**
- `include_transcript=true` - Include full transcripts
- `include_summary=true` - Include AI-generated summaries
- `include_action_items=true` - Include action items
- `cursor=CURSOR` - For pagination

**Response Format:**
```json
{
  "limit": 10,
  "next_cursor": "eyJwYWdlX251bSI6Mn0=",
  "items": [
    {
      "title": "Meeting Title",
      "recording_id": 123456789,
      "transcript": [...],
      "default_summary": {...},
      "action_items": [...],
      ...
    }
  ]
}
```

## ❌ Current Issue: 503 Service Unavailable

We're getting consistent 503 errors, which indicates one of these problems:

### 1. API Key Not Activated ⚠️ MOST LIKELY
The API key may have been generated but not activated in your Fathom account.

**How to fix:**
1. Log into https://app.fathom.ai
2. Click your profile → **User Settings**
3. Go to **API Access** section
4. Check if the API key shows as "Active"
5. If not active, click "Activate" or "Enable"
6. If there's no API key section, your plan may not include API access

### 2. No Recordings Available
API keys are user-level and can only access:
- Meetings **YOU** recorded
- Meetings **shared to your team**

**How to check:**
1. Go to https://app.fathom.ai
2. Look at your Meetings/Recordings list
3. Confirm you have at least 1 recording
4. If no recordings, record a test meeting first

### 3. Plan Doesn't Include API Access
Some Fathom plans may not include API access.

**How to check:**
1. Go to Settings → Billing/Plan
2. Look for "API Access" feature
3. You may need Business/Enterprise plan
4. Contact Fathom support if unsure

### 4. API Key Format Issue
Less likely, but the key format should be exactly as generated.

**Current key:** `P-7I-RQkIVapQivlY4V4Q.pCnEO1zRbVl0HPw4PlWKtMYi01jeV7sNKBvEcj7cpUM`

This looks correct (starts with `P-`, has a dot separator).

## 🔧 Immediate Action Items

### Step 1: Verify API Key in Fathom Dashboard

1. **Log into Fathom:** https://app.fathom.ai
2. **Navigate to:** Profile Icon (top right) → User Settings
3. **Find:** API Access or Developer section
4. **Check:**
   - [ ] API key is listed and matches what you provided
   - [ ] Status shows as "Active" or "Enabled"
   - [ ] There's no error message or warning
   - [ ] Copy the key again to ensure it's exactly correct

### Step 2: Verify You Have Recordings

1. **Go to:** Meetings or Recordings section in Fathom
2. **Check:**
   - [ ] You have at least 1 recorded meeting
   - [ ] The recording shows as "Processed" or "Complete"
   - [ ] Transcript is available when you click on it

### Step 3: Test with a Fresh Recording

If you don't have recordings:
1. Join any video call (Zoom, Google Meet, Teams)
2. Start Fathom recording
3. Have a 2-minute conversation
4. End the meeting
5. Wait for Fathom to process (usually 5-15 minutes)
6. Try the API again

### Step 4: Contact Fathom Support

If above steps don't work, reach out to Fathom:

**Email Template:**
```
Subject: API Key Returns 503 Error

Hi Fathom Support,

I'm trying to use your Public API to fetch meetings and transcripts, but I'm getting 503 Service Unavailable errors.

Details:
- Endpoint: GET /external/v1/meetings
- Header: X-Api-Key provided
- Response: 503 Service Unavailable (empty body)
- Account: [YOUR EMAIL]

I have:
- Generated an API key in User Settings
- [X recordings / No recordings yet]
- [Free / Team / Business] plan

Questions:
1. Does my plan include API access?
2. Does the API key need additional activation?
3. Are there any account-level settings I need to enable?
4. Should I be seeing my recordings when calling the /meetings endpoint?

Thank you!
```

## 🧪 Testing Checklist

Once you've verified/fixed the API key:

- [ ] Can access Fathom dashboard
- [ ] Have at least 1 processed recording
- [ ] API key is active in settings
- [ ] API key matches exactly (no extra spaces/characters)
- [ ] Run test script: `npx tsx scripts/fetch-fathom-meetings.ts`
- [ ] Should see recordings list (even if empty at first)

## 📝 What We've Built (Ready to Use Once API Works)

### 1. Database Schema ✅
- `CallTranscript` model with all fields
- Auto-linking to Deals, People, Organizations
- Support for vectorization

### 2. Fetch Script ✅
- `/ow/scripts/fetch-fathom-meetings.ts`
- Handles pagination automatically
- Includes transcripts, summaries, action items
- Exports to JSON

### 3. Webhook Handler ✅
- `/ow/app/api/webhooks/fathom/route.ts`
- Stores transcripts in database
- Auto-links to contacts
- Ready for production

## 🎯 Next Steps After API Key Works

1. **Test the fetch script** - Should return your meetings
2. **Export historic data** - Script will create JSON file
3. **Set up webhooks** - For future meetings
4. **Import to database** - Bulk import or via webhook
5. **Build UI** - View transcripts in CRM

## 🔍 Debug Information

If you want to share debug info with Fathom support:

```bash
# Test basic connectivity
curl -v https://api.fathom.ai/external/v1/meetings \
  -H "X-Api-Key: YOUR_KEY" 2>&1 | grep -E "(HTTP|X-|RateLimit)"

# Check if it's a rate limit vs auth issue
# Rate limit = 429 status
# Auth issue = 401/403 status
# Not found = 404 status
# Server issue = 503 status (what we're seeing)
```

Current status: **503** suggests server-side issue or API not enabled for account.

## 💡 Alternative: Start with Webhooks

While troubleshooting the API key, you can still set up webhooks for future meetings:

1. In Fathom dashboard → Settings → Integrations
2. Add webhook: `https://opticwise-frontend.onrender.com/api/webhooks/fathom`
3. Secret: `whsec_Md1/I/ZdFvTDmI/DROEiGAlM6NjP3ffZ`
4. This will capture new meetings going forward

Then reach out to Fathom support for bulk historic export.



