# Run Marketing Automation Migration on Render

**Issue:** The campaigns page shows an error because the marketing automation tables don't exist in the database yet.

**Solution:** Run the database migration on Render to create the 13 new tables.

---

## Option 1: Using Render Shell (Recommended - 2 minutes)

### Steps:

1. **Go to Render Dashboard:**
   - https://dashboard.render.com
   - Click on your service: `opticwise-frontend`

2. **Open Shell:**
   - Click "Shell" tab in the left sidebar
   - Wait for shell to connect

3. **Run Migration:**
   ```bash
   cd ow
   npx prisma db push --accept-data-loss
   ```

4. **Verify Tables:**
   ```bash
   psql $DATABASE_URL -c "\dt Campaign*"
   psql $DATABASE_URL -c "\dt Audit*"
   psql $DATABASE_URL -c "\dt Book*"
   psql $DATABASE_URL -c "\dt Conference*"
   psql $DATABASE_URL -c "\dt Chatbot*"
   ```

5. **Restart Service:**
   - Go back to "Settings" tab
   - Click "Manual Deploy" → "Clear build cache & deploy"
   - Or just wait - service should restart automatically

---

## Option 2: Using SQL Migration File (Alternative)

If Prisma push doesn't work, run the SQL file directly:

```bash
cd ow
psql $DATABASE_URL -f prisma/migrations/006_marketing_automation.sql
```

---

## Option 3: Using Custom Script (Alternative)

```bash
cd ow
npm run init:marketing
```

---

## What This Creates

### 13 New Tables:

1. **Campaign** - Main campaign container
2. **CampaignLead** - People enrolled in campaigns
3. **CampaignTouchpoint** - Individual interactions (email, SMS, etc.)
4. **CampaignSequence** - Reusable email/message sequences
5. **CampaignAnalytics** - Daily aggregated metrics
6. **AuditRequest** - Interactive audit tool submissions
7. **BookRequest** - Book distribution requests
8. **BookEngagement** - Reading activity tracking
9. **Conference** - Event details
10. **ConferenceAttendee** - Event attendees
11. **EmailTemplate** - Reusable email templates
12. **ChatbotConversation** - Website chatbot conversations
13. **ChatbotMessage** - Individual chat messages

### All tables include:
- Foreign keys to existing CRM tables (Person, Organization, Deal, User)
- Proper indexes for performance
- Cascade delete rules for data integrity

---

## After Migration Completes

### Test These URLs:

1. **Campaigns:** https://opticwise-frontend.onrender.com/campaigns
   - Should load without error
   - Should show empty state (no campaigns yet)

2. **Conferences:** https://opticwise-frontend.onrender.com/conferences
   - Should load without error
   - Should show empty state

3. **Audit Tool:** https://opticwise-frontend.onrender.com/audit-tool
   - Should load (public page)
   - Test submitting an audit request

4. **Book Request:** https://opticwise-frontend.onrender.com/book-request
   - Should load (public page)
   - Test requesting a book

---

## Verification Queries

After migration, verify in Render Shell:

```sql
-- Check Campaign table
SELECT COUNT(*) FROM "Campaign";

-- Check all marketing tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'Campaign%' 
OR table_name LIKE 'Audit%' 
OR table_name LIKE 'Book%' 
OR table_name LIKE 'Conference%' 
OR table_name LIKE 'Chatbot%' 
OR table_name = 'EmailTemplate'
ORDER BY table_name;
```

Expected output: 13 tables

---

## Troubleshooting

### Error: "Table already exists"
**Solution:** Tables were already created. Just restart the service.

### Error: "Permission denied"
**Solution:** Check DATABASE_URL has write permissions.

### Error: "Relation does not exist"
**Solution:** Run the migration again, it may have partially failed.

### Error: "Connection refused"
**Solution:** Check database service is running in Render dashboard.

---

## Quick Command Summary

```bash
# In Render Shell:
cd ow

# Run migration
npx prisma db push --accept-data-loss

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Campaign\""

# If that works, you're done!
```

---

**Estimated Time:** 2-3 minutes  
**Risk:** Low (migration is idempotent)  
**Impact:** Enables all marketing automation features



