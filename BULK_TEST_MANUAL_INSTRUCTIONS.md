# Manual Bulk Testing Instructions

## Issue

The production API at `/api/ownet/chat` requires authentication or is not publicly accessible, so automated bulk testing cannot connect directly.

## Solution Options

### Option 1: Manual Testing via UI (RECOMMENDED)
The client manually tests through the web interface and records responses.

**Steps:**
1. Go to `https://opticwise-frontend.onrender.com/ownet-agent`
2. Use `AGENT_BULK_TESTING_FEEDBACK_SHEET.md` to test each question
3. Follow instructions in `AGENT_TESTING_QUICK_START.md`
4. Estimated time: 2-3 hours

### Option 2: Browser Automation Script
You can use a browser automation tool (Puppeteer/Playwright) to:
1. Navigate to the agent page
2. Input each question
3. Wait for and capture responses
4. Export to CSV

Would need to be run from a machine with browser access.

### Option 3: API Authentication
If you have the authentication credentials/tokens, we can:
1. Add auth headers to the bulk test script
2. Run automated testing against production API
3. Export results to CSV

## What We Have

### Testing Documents ✅
- 25 questions across 8 categories
- Evaluation framework
- Feedback templates
- Instructions

### Scripts ✅
- `bulk-test-live-agent.ts` - Ready to use if API auth is provided
- Generates JSON + CSV output
- Includes formatting checks (emojis, collapsed sources)

## Quick Test (Single Question)

To verify the API works, try this command:

```bash
curl -X POST https://opticwise-frontend.onrender.com/api/ownet/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is OpticWise?","sessionId":"test-123"}'
```

If it returns 404, the endpoint is not publicly accessible.
If it returns 401/403, it needs authentication.
If it returns data, we can proceed with bulk testing.

## Recommendation

**For now:** Use Option 1 (Manual Testing via UI)
- Most reliable
- Ensures you're testing the exact user experience
- Client can provide qualitative feedback while testing
- Use the comprehensive feedback sheet already created

**For future:** Set up proper API access with auth tokens for automated bulk testing.
