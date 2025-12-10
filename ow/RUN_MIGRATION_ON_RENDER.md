# How to Run the Database Migration on Render

## The Problem
The deployment is live but the app is crashing because the database doesn't have the new tables (`Note`, `Activity`) and fields (`stageChangeTime`, `noteRecords` relation) yet.

## Solution: Run the Migration

### Option 1: Using Render Shell (Recommended)

1. Go to Render Dashboard: https://dashboard.render.com/web/srv-d4ecr5rgk3sc73blsjag

2. Click on the **"Shell"** tab in the left sidebar

3. Run these commands:
   ```bash
   cd ow
   npx prisma db push
   ```

   This will sync the database schema with your Prisma schema file.

### Option 2: Using SQL Migration File

If Option 1 doesn't work, you can run the SQL migration directly:

1. Go to your database on Render (find it in the Environment tab)

2. Click "Connect" and copy the External Database URL

3. Run this command locally (replace with your actual DATABASE_URL):
   ```bash
   psql "YOUR_DATABASE_URL_HERE" -f ow/prisma/migrations/004_notes_activities.sql
   ```

### Option 3: Using Render Shell with SQL File

1. In Render Shell:
   ```bash
   cd ow
   psql $DATABASE_URL -f prisma/migrations/004_notes_activities.sql
   ```

## What the Migration Does

The migration adds:
- ✅ `Note` table for notes
- ✅ `Activity` table for activities/to-dos  
- ✅ `ActivityType` enum (call, meeting, task, deadline, email, lunch)
- ✅ `ActivityStatus` enum (pending, done, cancelled)
- ✅ `stageChangeTime` column to Deal table
- ✅ All necessary foreign keys and indexes

## Verification

After running the migration, check if the app loads:
1. Visit: https://opticwise-backend.onrender.com
2. Navigate to any deal, person, or organization
3. You should see the new tabs: Notes, Emails, Files, Activities

## If It Still Doesn't Work

Check the Render logs for the actual error:
1. Go to Render Dashboard
2. Click on "Logs" tab
3. Look for error messages
4. Share the error with me

## Alternative: Prisma Migrate Deploy

If you prefer using Prisma's migration system:

```bash
cd ow
npx prisma migrate deploy
```

This will apply all pending migrations in the `prisma/migrations` folder.
