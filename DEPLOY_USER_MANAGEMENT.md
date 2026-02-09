# Deploy User Management System - Quick Guide

**Status:** Code pushed to GitHub, waiting for Render deployment

---

## Deployment Steps

### Step 1: Wait for Render Auto-Deploy

Render will automatically detect the GitHub push and start deploying. This typically takes 2-3 minutes.

**Check deployment status:**
- Go to Render dashboard
- Look for "opticwise" service
- Wait for "Deploy succeeded" message

---

### Step 2: Run Database Migration

Once deployment succeeds, open Render Shell:

1. Go to Render dashboard
2. Click on "opticwise" service
3. Click "Shell" tab
4. Run migration:

```bash
cd ow
npx prisma migrate deploy
```

**Expected output:**
```
✓ Applying migration `20260209140216_add_user_management_fields`
✓ The following migration(s) have been applied:

migrations/
  └─ 20260209140216_add_user_management_fields/
    └─ migration.sql

All migrations have been successfully applied.
```

---

### Step 3: Verify Bill is Admin

In the same Render Shell, run:

```bash
cd ow
npx tsx scripts/set-bill-as-admin.ts
```

**Expected output:**
```
Setting bill@opticwise.com as admin...
✓ Updated user: {
  id: 'xxx',
  email: 'bill@opticwise.com',
  name: 'Bill',
  role: 'admin',
  isActive: true
}

Bill is now an admin!
```

*(This step may show "already admin" if the migration already set the role)*

---

### Step 4: Test on Live Site

1. **Navigate to the site:**
   ```
   https://opticwise.onrender.com
   ```

2. **Log in as Bill:**
   - Email: bill@opticwise.com
   - Password: [Bill's password]

3. **Check Profile Access:**
   - Look for "Profile" link in header (next to Logout)
   - Click "Profile"
   - Should see Settings page at `/settings`

4. **Verify Admin Access:**
   - Should see "Profile Information" section
   - Should see "Team Members" section below
   - Should see "+ Add User" button

5. **Test Adding a User:**
   - Click "+ Add User"
   - Fill in form:
     - Email: test@opticwise.com
     - Name: Test User
     - Password: TestPass123
     - Department: Marketing (optional)
   - Click "Add User"
   - Should see new user in table

6. **Test User Management:**
   - Try deactivating the test user
   - Try reactivating
   - Try deleting (permanent)

7. **Test Regular User View:**
   - Log out as Bill
   - Log in as test@opticwise.com
   - Click "Profile"
   - Should see only profile section (NO team management)

---

## Troubleshooting

### Migration Fails

If `prisma migrate deploy` fails:

1. Check if columns already exist:
```bash
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'User';"
```

2. If they exist, mark migration as applied:
```bash
npx prisma migrate resolve --applied 20260209140216_add_user_management_fields
```

### Bill Not Admin

If Bill doesn't have admin access:

1. Manually update in database:
```bash
psql $DATABASE_URL -c "UPDATE \"User\" SET role = 'admin' WHERE email = 'bill@opticwise.com';"
```

2. Verify:
```bash
psql $DATABASE_URL -c "SELECT id, email, role FROM \"User\" WHERE email = 'bill@opticwise.com';"
```

### Can't Add Users

1. Check API endpoint:
```bash
curl https://opticwise.onrender.com/api/users \
  -H "Cookie: ow_auth=YOUR_AUTH_TOKEN"
```

2. Check Render logs for errors:
   - Go to Render dashboard
   - Click "Logs" tab
   - Look for errors when adding user

---

## Quick Test Commands (Render Shell)

```bash
# Run migration
cd ow && npx prisma migrate deploy

# Set Bill as admin
cd ow && npx tsx scripts/set-bill-as-admin.ts

# Check Bill's role
cd ow && npx prisma studio
# Then navigate to User model and find bill@opticwise.com

# Or use direct SQL
psql $DATABASE_URL -c "SELECT id, email, role, \"isActive\" FROM \"User\";"
```

---

## Success Criteria

- ✅ Migration applied successfully
- ✅ Bill has `role: 'admin'`
- ✅ Profile link appears in header
- ✅ Settings page loads at `/settings`
- ✅ Bill can see Team Members section
- ✅ Bill can add new user
- ✅ New user can log in
- ✅ Regular users see only profile (no team management)

---

## Next Steps After Testing

If everything works:

1. ✅ Delete test user from team table
2. ✅ Share credentials with real team members
3. ✅ Add actual team members via UI

If issues found:

1. Check Render logs
2. Verify database schema
3. Test API endpoints directly
4. Review browser console for client errors

---

**Estimated Time:** 5-10 minutes total
**Risk Level:** Low (only adds new features, doesn't modify existing ones)
