# Pipedrive Features - Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migration
```bash
# Navigate to the ow directory
cd /Users/dannydemichele/Opticwise/ow

# Run the migration
psql $DATABASE_URL -f prisma/migrations/004_notes_activities.sql

# Regenerate Prisma client
npx prisma generate
```

### 2. Verify Environment Variables
Ensure these are set in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- All existing Google/Gmail integration variables

### 3. Install Dependencies (if needed)
```bash
npm install
```

## Deployment to Render

### Option 1: Automatic Deploy (if GitHub is connected)
1. Commit all changes:
   ```bash
   git add .
   git commit -m "Add Pipedrive features: Notes, Emails, Files, Activities tabs with Won/Lost deal archives"
   git push origin main
   ```

2. Render will automatically deploy

### Option 2: Manual Deploy
1. Push code to repository
2. Go to Render dashboard
3. Trigger manual deploy for the service

## Post-Deployment Verification

### 1. Database Schema Check
```bash
# Connect to production database
psql $DATABASE_URL

# Verify new tables exist
\dt

# Should see: Note, Activity tables
# Verify Deal table has stageChangeTime column
\d "Deal"
```

### 2. Test Each Feature

#### Notes Tab
- [ ] Open a deal detail page
- [ ] Click "Notes" tab
- [ ] Click "Add Note" button
- [ ] Enter note text and save
- [ ] Verify note appears in list
- [ ] Edit a note
- [ ] Delete a note

#### Emails Tab
- [ ] Open a deal/person/org with Gmail messages
- [ ] Click "Emails" tab
- [ ] Verify emails are displayed
- [ ] Click to expand an email
- [ ] Verify attachments are shown (if any)

#### Files Tab
- [ ] Open a deal/person/org with Drive files
- [ ] Click "Files" tab
- [ ] Verify files are displayed with icons
- [ ] Click "Open" link to verify it works

#### Activities Tab
- [ ] Open any deal/person/org
- [ ] Click "Activities" tab
- [ ] Click "Add Activity" button
- [ ] Fill out activity form and save
- [ ] Verify activity appears
- [ ] Toggle activity to "Done"
- [ ] Filter by status (All, To Do, Done)
- [ ] Delete an activity

#### Days Counter
- [ ] Go to Deals page
- [ ] Verify each deal card shows "Xd" badge
- [ ] Drag a deal to a new stage
- [ ] Refresh and verify days counter reset to 0d

#### Won/Lost Archives
- [ ] Go to Deals page
- [ ] Click "Won" tab
- [ ] Verify won deals are listed (if any)
- [ ] Click "Lost" tab
- [ ] Verify lost deals are listed (if any)
- [ ] Click "Open" tab to return to board view

### 3. API Endpoints Test
```bash
# Test Notes API
curl -X POST https://your-app.onrender.com/api/notes \
  -H "Content-Type: application/json" \
  -d '{"content":"Test note","dealId":"DEAL_ID"}'

# Test Activities API
curl -X POST https://your-app.onrender.com/api/activities \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test activity","type":"task","dealId":"DEAL_ID"}'
```

### 4. Performance Check
- [ ] Page load times are acceptable (<3s)
- [ ] Tab switching is smooth
- [ ] No console errors in browser
- [ ] No server errors in Render logs

### 5. Data Integrity
- [ ] Existing deals still display correctly
- [ ] Existing contacts/orgs still work
- [ ] Gmail sync is still functioning
- [ ] Drive files are still accessible

## Rollback Plan (If Issues Occur)

### 1. Database Rollback
```sql
-- If you need to rollback the migration
DROP TABLE IF EXISTS "Activity" CASCADE;
DROP TABLE IF EXISTS "Note" CASCADE;
DROP TYPE IF EXISTS "ActivityType";
DROP TYPE IF EXISTS "ActivityStatus";
ALTER TABLE "Deal" DROP COLUMN IF EXISTS "stageChangeTime";
```

### 2. Code Rollback
```bash
git revert HEAD
git push origin main
```

## Known Issues & Solutions

### Issue: Migration fails with "column already exists"
**Solution**: The column might already exist. Check with `\d "Deal"` and skip that part of migration.

### Issue: Prisma client out of sync
**Solution**: Run `npx prisma generate` again

### Issue: Tabs not showing
**Solution**: Clear browser cache and hard refresh (Cmd+Shift+R)

### Issue: Notes/Activities not saving
**Solution**: Check Render logs for API errors. Verify database connection.

## Success Criteria

✅ All tabs are visible on detail pages
✅ Notes can be created, edited, and deleted
✅ Emails are displayed correctly
✅ Files are listed with working links
✅ Activities can be managed
✅ Days counter shows on deal cards
✅ Won/Lost tabs work on deals page
✅ No errors in browser console
✅ No errors in Render logs

## Support Contacts

- **Developer**: [Your contact info]
- **Database**: Check Render dashboard for DB connection
- **Logs**: Render dashboard > Service > Logs

## Monitoring

After deployment, monitor for 24-48 hours:
- [ ] Check Render logs for errors
- [ ] Monitor database query performance
- [ ] Watch for user feedback
- [ ] Verify Gmail sync continues working
- [ ] Check disk space usage (notes/activities add data)

## Completion Sign-off

- [ ] Migration completed successfully
- [ ] All features tested and working
- [ ] No critical errors in logs
- [ ] User (Bill) has been notified
- [ ] Documentation updated

**Deployed by**: _________________
**Date**: _________________
**Version**: _________________



