# Fix Migration Error - User Management

**Error:** P3005 - Database schema is not empty

**Solution:** We need to either baseline the migration or apply it manually.

---

## Option 1: Check if Columns Already Exist (RECOMMENDED)

First, let's check if the new columns already exist in the database:

```bash
psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User' ORDER BY column_name;"
```

**If you see `role`, `isActive`, `department`, `createdBy` columns:**
- The migration was already applied somehow
- Just mark it as resolved:

```bash
cd ow
npx prisma migrate resolve --applied 20260209140216_add_user_management_fields
```

**If you DON'T see those columns:**
- Continue to Option 2

---

## Option 2: Apply Migration Manually (If Columns Don't Exist)

Run the SQL directly:

```bash
psql $DATABASE_URL << 'EOF'
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "department" TEXT,
ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

UPDATE "User" 
SET "role" = 'admin' 
WHERE "email" = 'bill@opticwise.com';
EOF
```

Then mark the migration as applied:

```bash
cd ow
npx prisma migrate resolve --applied 20260209140216_add_user_management_fields
```

---

## Option 3: Use Prisma DB Push (Alternative)

If the above doesn't work, you can use db push instead:

```bash
cd ow
npx prisma db push
```

This will sync the schema without using migrations. However, you'll still need to set Bill as admin:

```bash
psql $DATABASE_URL -c "UPDATE \"User\" SET role = 'admin' WHERE email = 'bill@opticwise.com';"
```

---

## Verification Steps

After applying the fix, verify:

**1. Check columns exist:**
```bash
psql $DATABASE_URL -c "\d \"User\""
```

Should show:
- role | text | not null | default 'user'
- isActive | boolean | not null | default true
- department | text | | 
- createdBy | text | | 

**2. Check Bill is admin:**
```bash
psql $DATABASE_URL -c "SELECT id, email, role, \"isActive\" FROM \"User\" WHERE email = 'bill@opticwise.com';"
```

Should show:
- role = 'admin'
- isActive = true

**3. Generate Prisma Client:**
```bash
cd ow
npx prisma generate
```

---

## Recommended Approach

**Run these commands in Render Shell in this order:**

```bash
# 1. Check if columns exist
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name IN ('role', 'isActive', 'department', 'createdBy');"

# 2a. If NO columns shown, add them manually
psql $DATABASE_URL -c "ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS \"role\" TEXT NOT NULL DEFAULT 'user', ADD COLUMN IF NOT EXISTS \"isActive\" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS \"department\" TEXT, ADD COLUMN IF NOT EXISTS \"createdBy\" TEXT;"

# 2b. Set Bill as admin
psql $DATABASE_URL -c "UPDATE \"User\" SET role = 'admin' WHERE email = 'bill@opticwise.com';"

# 3. Mark migration as applied
cd ow && npx prisma migrate resolve --applied 20260209140216_add_user_management_fields

# 4. Generate Prisma client
cd ow && npx prisma generate

# 5. Verify
psql $DATABASE_URL -c "SELECT email, role, \"isActive\" FROM \"User\";"
```

---

## Why This Happened

Prisma migrations expect to track all schema changes from the beginning. Since your database was already created and has data, Prisma doesn't know what migrations have been applied.

The `migrate resolve --applied` command tells Prisma "this migration is already applied, don't run it again" which is what we want for a production database.

---

## After Fix

Once the columns are added and migration is resolved:

1. Restart the Render service (or it will auto-restart)
2. Test the `/settings` page
3. Bill should see the Team Members section
4. You can start adding users!

---

## Quick Copy-Paste Solution

If you just want to fix it fast, run this single command:

```bash
cd ow && psql $DATABASE_URL -c "ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS \"role\" TEXT NOT NULL DEFAULT 'user', ADD COLUMN IF NOT EXISTS \"isActive\" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS \"department\" TEXT, ADD COLUMN IF NOT EXISTS \"createdBy\" TEXT; UPDATE \"User\" SET role = 'admin' WHERE email = 'bill@opticwise.com';" && npx prisma migrate resolve --applied 20260209140216_add_user_management_fields && npx prisma generate && echo "✅ Migration fixed! Columns added and Bill set as admin."
```

Then verify:
```bash
psql $DATABASE_URL -c "SELECT email, role, \"isActive\" FROM \"User\";"
```

You should see bill@opticwise.com with role='admin' and isActive=true.
