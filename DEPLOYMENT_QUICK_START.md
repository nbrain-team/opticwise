# Marketing Automation - Quick Deployment Guide

**Status:** Ready to Deploy ✅  
**Estimated Time:** 15-20 minutes

---

## Step 1: Run Database Migration (5 minutes)

### Option A: Using Prisma (Recommended)

```bash
cd /Users/dannydemichele/Opticwise/ow

# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to database
npx prisma db push
```

### Option B: Using SQL Migration Directly

```bash
cd /Users/dannydemichele/Opticwise/ow

# Run migration SQL file
psql $DATABASE_URL -f prisma/migrations/006_marketing_automation.sql
```

**Expected Output:**
```
✓ Generated Prisma Client
✓ 13 new tables created
✓ Foreign keys established
✓ Indexes created
```

---

## Step 2: Add Environment Variables (2 minutes)

Go to Render Dashboard → Your Service → Environment

Add this variable:

```bash
CALENDLY_LINK=https://calendly.com/opticwise/consultation
```

*(Replace with your actual Calendly link)*

**Note:** All other required environment variables (ANTHROPIC_API_KEY, DATABASE_URL, etc.) are already configured.

---

## Step 3: Deploy to Render (5 minutes)

```bash
# From project root
cd /Users/dannydemichele/Opticwise

# Stage all changes
git add .

# Commit
git commit -m "Add marketing automation platform with audit tool and chatbot"

# Push to trigger auto-deploy
git push origin main
```

**Render will automatically:**
1. Pull latest code
2. Run `npx prisma generate`
3. Build Next.js app
4. Deploy to production

**Monitor deployment:** https://dashboard.render.com

---

## Step 4: Test Features (5 minutes)

### Test 1: Interactive Audit Tool

Visit: `https://opticwise-frontend.onrender.com/audit-tool`

**Expected:**
- 5-step conversational flow
- Property type selection
- Size and systems questions
- Contact form
- Results page with insights and booking link

### Test 2: Campaign Management

Visit: `https://opticwise-frontend.onrender.com/campaigns`

**Expected:**
- Campaign list page
- Stats dashboard
- "New Campaign" button
- Empty state if no campaigns yet

### Test 3: Create a Campaign

1. Click "New Campaign"
2. Fill in form:
   - Name: "Test Campaign"
   - Type: "Email Campaign"
   - Goal: "Demo Booked"
3. Click "Create Campaign"

**Expected:**
- Redirects to campaign detail page
- Campaign appears in list

### Test 4: Chatbot API

```bash
curl -X POST https://opticwise-frontend.onrender.com/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I manage a 200-unit apartment building and need help with our infrastructure",
    "visitorId": "test-visitor-123",
    "email": "test@example.com",
    "pageUrl": "https://opticwise.com"
  }'
```

**Expected Response:**
```json
{
  "message": "That's a great size property! With 200 units...",
  "conversationId": "clx...",
  "leadScore": 35,
  "isQualified": false,
  "shouldOfferAudit": false
}
```

### Test 5: Audit Tool API

```bash
curl -X POST https://opticwise-frontend.onrender.com/api/audit-tool \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Test Property Management",
    "propertyType": "apartment",
    "numberOfUnits": 250,
    "independentSystems": 5,
    "physicalNetworks": 3,
    "painPoints": "Too many vendors, high costs, system integration issues",
    "decisionMaker": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "auditRequest": {
    "id": "clx...",
    "score": 85,
    "qualification": "qualified"
  },
  "insights": [
    {
      "title": "System Consolidation Opportunity",
      "description": "With 5 independent systems...",
      "potentialSavings": "High"
    }
  ],
  "bookingUrl": "https://calendly.com/opticwise/consultation",
  "message": "Thank you for your interest!..."
}
```

---

## Step 5: Verify Database (2 minutes)

Connect to your database and verify tables were created:

```bash
psql $DATABASE_URL

# List new tables
\dt Campaign*
\dt Audit*
\dt Book*
\dt Conference*
\dt Chatbot*
\dt EmailTemplate

# Check a table
SELECT * FROM "Campaign" LIMIT 5;

# Exit
\q
```

**Expected:**
- 13 new tables visible
- All tables empty (ready for data)

---

## 🎉 Success Checklist

- [ ] Database migration completed
- [ ] Calendly link configured
- [ ] Code deployed to Render
- [ ] Audit tool page loads
- [ ] Campaign management page loads
- [ ] Can create a test campaign
- [ ] Chatbot API responds
- [ ] Audit tool API responds
- [ ] Database tables exist

---

## 🚨 Troubleshooting

### Issue: Prisma Client Error

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
cd ow
npx prisma generate
npm run build
```

### Issue: Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
- Check DATABASE_URL in Render environment variables
- Verify PostgreSQL service is running
- Check database connection from Render shell

### Issue: 404 on New Pages

**Error:** `/campaigns` returns 404

**Solution:**
- Ensure build completed successfully
- Check Render logs for build errors
- Verify Next.js build output includes new routes

### Issue: Chatbot Not Responding

**Error:** `Failed to process message`

**Solution:**
- Verify ANTHROPIC_API_KEY is set
- Check Render logs for API errors
- Test with simple message first

---

## 📊 What's Available Now

### For Marketing Team:
- ✅ Campaign management interface
- ✅ Interactive audit tool for lead qualification
- ✅ Chatbot API for website integration
- ✅ Lead scoring and tracking

### For Sales Team:
- ✅ Qualified leads from audit tool
- ✅ Chatbot conversation history
- ✅ Lead scores and qualification status
- ✅ Conversion tracking to deals

### For Development:
- ✅ Full API documentation
- ✅ Database schema
- ✅ Type-safe queries with Prisma
- ✅ Clean, maintainable code

---

## 🔜 Phase 2 Features (Not Yet Built)

These features are planned but not yet implemented:

- ⏳ Visual workflow builder (React Flow)
- ⏳ Email sending integration (SendGrid)
- ⏳ SMS integration (Twilio)
- ⏳ Voicemail drops (ElevenLabs)
- ⏳ LinkedIn automation
- ⏳ Analytics dashboard
- ⏳ Book distribution system
- ⏳ Conference campaign tools

---

## 📞 Next Steps After Deployment

1. **Test with Real Data**
   - Submit a real audit request
   - Create a real campaign
   - Test chatbot with real questions

2. **Configure Calendly**
   - Update CALENDLY_LINK with your actual link
   - Test booking flow

3. **Embed Audit Tool**
   - Link to `/audit-tool` from your website
   - Or embed as iframe (future enhancement)

4. **Plan Phase 2**
   - Prioritize remaining features
   - Decide on email provider
   - Schedule development timeline

---

## 📚 Documentation

- **Full Build Summary:** `MARKETING_AUTOMATION_BUILD_SUMMARY.md`
- **Gap Analysis:** `PROPOSAL_GAP_ANALYSIS.md`
- **Database Schema:** `ow/prisma/schema.prisma`
- **API Endpoints:** See individual route files in `ow/app/api/`

---

**Deployment Status:** Ready ✅  
**Estimated Deploy Time:** 15-20 minutes  
**Support:** See troubleshooting section above

