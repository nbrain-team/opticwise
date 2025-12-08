# Fathom.ai Integration Plan

## ✅ Confirmed Information

Based on testing and the documentation you provided:

### API Endpoint Structure
- **Base URL**: `https://api.fathom.ai/external/v1`
- **Authentication**: `X-Api-Key` header
- **Transcript Endpoint**: `GET /recordings/{recording_id}/transcript`

### API Status
- ✅ API server is reachable
- ✅ Authentication header format is correct  
- ⚠️  Currently getting 503 (Service Unavailable) responses
- ❌ No public "list all recordings" endpoint found

## 🔍 Current Challenge

The Fathom Public API does **not** appear to have a `/recordings` or `/meetings` list endpoint. According to the documentation you shared:

> "You will likely need to first list the recordings/meetings in order to know their recording_id"

This means we need an alternative approach to get the recording IDs.

## 📋 Three Possible Approaches

### Option 1: Zapier Integration (Recommended for Historic Data)
According to Fathom's documentation:
- They support "retroactive Zapier triggers" for historic calls
- There's a "Reviewed, case-by-case service run by our team" for Zapier backfills
- This might be the best option for bulk historic data export

**Next Steps:**
1. Go to your Fathom dashboard
2. Look for Zapier integration settings
3. Set up a Zap to send historic transcripts to a webhook
4. Use our webhook handler (`/api/webhooks/fathom`) to receive and store them

### Option 2: TranscriptExporter Partner Tool
Fathom mentions TranscriptExporter as an official partner for bulk exports:
- Website: Check fathom.ai for partner integrations
- This tool uses the API and can handle bulk exports
- Might be faster than building custom solution

### Option 3: Webhook-First Approach (For New Recordings)
Set up webhooks to receive new transcripts going forward:

**Implementation:**
1. Configure webhook in Fathom dashboard
2. Point to: `https://opticwise-frontend.onrender.com/api/webhooks/fathom`
3. Use webhook secret for verification: `whsec_Md1/I/ZdFvTDmI/DROEiGAlM6NjP3ffZ`
4. Webhook handler is already created and ready

### Option 4: Manual Recording ID Collection
If you have access to recording IDs through the Fathom dashboard:

**Steps:**
1. Export/copy list of recording IDs from Fathom UI
2. Create a CSV file with recording IDs
3. Use our script to fetch transcripts for each ID
4. Store in database

## 🛠️ What We've Built So Far

### 1. Test Scripts (`/ow/scripts/`)
- `test-fathom-api-v2.ts` - API endpoint testing
- `fetch-fathom-transcripts.ts` - Ready to fetch transcripts once we have recording IDs

### 2. Webhook Handler (`/ow/app/api/webhooks/fathom/route.ts`)
- ✅ Signature verification
- ✅ Event handling (call.completed, transcript.ready)
- ✅ Error handling and logging
- ⚠️  Needs database schema to store transcripts

### 3. Documentation
- `FATHOM_API_TESTING.md` - Testing results
- `FATHOM_INTEGRATION_PLAN.md` - This file

## 📊 Next Steps (Recommended Order)

### Immediate (To Get Historic Data):

1. **Check Fathom Dashboard**:
   - Log into https://app.fathom.ai
   - Look for:
     - Settings → Integrations → API
     - Settings → Integrations → Webhooks  
     - Settings → Integrations → Zapier
     - Any bulk export options

2. **Contact Fathom Support**:
   - Ask about bulk historic transcript export
   - Mention you have API key but need recording IDs
   - Ask about "retroactive triggers" or bulk export service
   - Request documentation for listing recordings

3. **Try Zapier Integration**:
   - Set up Fathom → Webhook Zap
   - Configure to send historic calls
   - Point to our webhook endpoint

### Database Setup (Required Before Data Import):

<function_calls>
<invoke name="read_file">
<parameter name="target_file">/Users/dannydemichele/Opticwise/ow/prisma/schema.prisma




