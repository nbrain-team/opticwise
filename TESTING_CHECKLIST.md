# Marketing Automation - Testing Checklist

**After deployment completes, test these features:**

---

## ✅ Quick Test URLs

### Public Pages (No Login Required):
- 📋 **Audit Tool:** https://opticwise-frontend.onrender.com/audit-tool
- 📚 **Book Request:** https://opticwise-frontend.onrender.com/book-request

### Authenticated Pages (Login Required):
- 🎯 **Campaigns:** https://opticwise-frontend.onrender.com/campaigns
- 📅 **Conferences:** https://opticwise-frontend.onrender.com/conferences

**Login:** bill@opticwise.com / 123456

---

## 🧪 Test Scenarios

### 1. Campaign Management (5 min)

**URL:** `/campaigns`

✅ **Test Steps:**
1. Click "New Campaign"
2. Fill in:
   - Name: "Test Campaign"
   - Type: "Email Campaign"
   - Goal: "Demo Booked"
   - Target: 10
3. Click "Create Campaign"
4. Should redirect to campaign detail page

**Expected Result:** Campaign created, detail page loads with tabs

---

### 2. Visual Workflow Builder (5 min)

**URL:** `/campaigns/[id]` → Workflow tab

✅ **Test Steps:**
1. Open the campaign you just created
2. Click "Workflow" tab
3. Click "📧 Email" button
4. Drag the email node around
5. Click "⏰ Wait" button
6. Connect the nodes by dragging from one to another
7. Click "Save Workflow"

**Expected Result:** 
- Nodes appear on canvas
- Can drag nodes
- Can connect nodes with animated edges
- Workflow saves successfully

---

### 3. Analytics Dashboard (3 min)

**URL:** `/campaigns/[id]` → Analytics tab

✅ **Test Steps:**
1. Open any campaign
2. Click "Analytics" tab
3. Should see:
   - Key metrics cards (Open Rate, Click Rate, etc.)
   - Pie chart (Lead Status Distribution)
   - Bar chart (Lead Score Distribution)
   - Funnel chart (Conversion Funnel)

**Expected Result:** Charts render, metrics display (may be 0 if no leads)

---

### 4. Interactive Audit Tool (5 min)

**URL:** `/audit-tool`

✅ **Test Steps:**
1. Click "Start Your Free Audit"
2. Select "Apartment/Multifamily"
3. Enter: 250 units
4. Enter: 5 independent systems, 3 networks
5. Enter pain points: "Too many vendors, high costs"
6. Check "I am the decision maker"
7. Enter contact info:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Company: Test Property Management
8. Submit

**Expected Result:**
- Results page shows
- Lead score displayed (should be 70-85)
- Insights generated
- Calendly booking link shown

---

### 5. Book Request Form (3 min)

**URL:** `/book-request`

✅ **Test Steps:**
1. Select "Digital" book type
2. Choose "PDF" format
3. Enter:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
4. Submit

**Expected Result:**
- Success page shows
- Download link provided
- Confirmation message displayed

---

### 6. Conference Management (5 min)

**URL:** `/conferences`

✅ **Test Steps:**
1. Click "New Conference"
2. Fill in:
   - Name: "CRE Tech 2026"
   - Location: "Las Vegas, NV"
   - Start Date: (pick future date)
   - End Date: (pick date after start)
   - Target Meetings: 20
   - Target Leads: 50
3. Click "Create Conference"

**Expected Result:** Conference created, appears in list

---

### 7. Campaign Leads Tab (2 min)

**URL:** `/campaigns/[id]` → Leads tab

✅ **Test Steps:**
1. Open any campaign
2. Click "Leads" tab
3. Should see lead list (may be empty)
4. Test filters and sorting

**Expected Result:** Lead management interface loads

---

### 8. API Endpoints (Advanced)

Test with curl or Postman:

```bash
# Test Chatbot API
curl -X POST https://opticwise-frontend.onrender.com/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need help with my building infrastructure",
    "visitorId": "test-123",
    "pageUrl": "https://opticwise.com"
  }'

# Test Audit Tool API
curl -X POST https://opticwise-frontend.onrender.com/api/audit-tool \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "propertyType": "apartment",
    "numberOfUnits": 250,
    "independentSystems": 5,
    "decisionMaker": true
  }'
```

**Expected Result:** JSON responses with success messages

---

## 🔍 Database Verification

### Check Tables Were Created:

```sql
-- Connect to database
psql $DATABASE_URL

-- List new tables
\dt Campaign*
\dt Audit*
\dt Book*
\dt Conference*
\dt Chatbot*
\dt EmailTemplate

-- Check a table
SELECT * FROM "Campaign" LIMIT 5;

-- Exit
\q
```

**Expected Result:** All 13 new tables exist

---

## 🐛 Common Issues & Solutions

### Issue: Pages Return 404
**Solution:** 
- Check Render deployment completed
- Verify build succeeded
- Check Render logs for errors

### Issue: Workflow Builder Blank
**Solution:**
- Check browser console for errors
- Verify React Flow loaded (check Network tab)
- Try hard refresh (Cmd+Shift+R)

### Issue: Charts Not Showing
**Solution:**
- Check browser console for errors
- Verify Recharts loaded
- Check if data exists (charts may be empty with no leads)

### Issue: Forms Don't Submit
**Solution:**
- Check browser console for errors
- Verify API endpoint is reachable
- Check Network tab for failed requests

### Issue: Database Tables Missing
**Solution:**
- Check Render logs for `prisma db push` output
- Verify DATABASE_URL is set
- May need to run migration manually

---

## ✅ Success Criteria

All tests pass if:

- ✅ All pages load without errors
- ✅ Campaign can be created
- ✅ Workflow builder renders and saves
- ✅ Analytics charts display
- ✅ Audit tool completes and shows results
- ✅ Book request submits successfully
- ✅ Conference can be created
- ✅ No console errors in browser
- ✅ API endpoints respond correctly
- ✅ Database tables exist

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

[ ] Campaign Management - PASS / FAIL
[ ] Workflow Builder - PASS / FAIL
[ ] Analytics Dashboard - PASS / FAIL
[ ] Audit Tool - PASS / FAIL
[ ] Book Request - PASS / FAIL
[ ] Conference Management - PASS / FAIL
[ ] Campaign Leads - PASS / FAIL
[ ] API Endpoints - PASS / FAIL

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Status: PASS / FAIL
```

---

**Testing Time:** ~30 minutes for complete testing  
**Priority Tests:** Campaign creation, Workflow builder, Audit tool  
**Can Skip:** API endpoint testing (unless issues arise)


