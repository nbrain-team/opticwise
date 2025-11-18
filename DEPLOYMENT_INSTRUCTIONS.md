# Opticwise CRM - Render Deployment Instructions

## Current Status
- ✅ Code pushed to GitHub: https://github.com/nbrain-team/opticwise
- ✅ Database schema deployed to Render Postgres
- ✅ Seed data loaded (user, pipeline, stages, 4,860 organizations)
- ❌ Docker builds failing on Render

## Issue
The Docker builds are failing. Render logs aren't accessible via API, but likely issues are:
1. Missing environment variables during build
2. Dockerfile complexity with multi-stage builds

## Solution: Switch to Node Runtime

### Option 1: Update Service Settings Manually (Recommended)

Go to Render Dashboard: https://dashboard.render.com/web/srv-d4ebnhp5pdvs73fpa13g/settings

**Change these settings:**

1. **Runtime**: Change from `Docker` to `Node`
2. **Build Command**: 
   ```
   cd ow && npm install && npx prisma generate && npm run build
   ```
3. **Start Command**:
   ```
   cd ow && npm start
   ```

**Then go to Environment tab:**
https://dashboard.render.com/web/srv-d4ebnhp5pdvs73fpa13g/env

**Add these environment variables:**

```
DATABASE_URL = postgresql://opticwise_db_user:er6uVwAIHfgoiGZ1u2IUdlayvZ0ouRJo@dpg-d4eboeh5pdvs73fpagfg-a.oregon-postgres.render.com/opticwise_db

AUTH_SECRET = a3b1d9d8f3d1b9e2c4a47f2c1aa0b983e7f21461bdb5a86e5c0f2c4172a9d7e4

NEXT_PUBLIC_BASE_URL = https://opticwise-frontend.onrender.com

NODE_ENV = production

PORT = 10000
```

Click "Save Changes" and Render will redeploy.

### Option 2: Use render.yaml Blueprint

The `render.yaml` file in the repo root has the correct configuration. You can:

1. Delete the current service
2. Create new service from Blueprint
3. Point it to the GitHub repo

## After Deployment Succeeds

Test at: **https://opticwise-frontend.onrender.com/login**

**Login credentials:**
- Email: `bill@opticwise.com`
- Password: `123456`

## What's in the Database

- 1 User (bill@opticwise.com)
- 1 Pipeline ("New Projects Pipeline")  
- 6 Stages matching Pipedrive:
  - SQL
  - Discovery & Qualification
  - DDI Review Proposed
  - Audit In Progress / Delivered
  - RR Opportunities
  - RR Contracting
- 4,860 Organizations (imported from Pipedrive)
- Sample deal, person, and organization for testing

## Import Remaining Pipedrive Data

Once the site is live, run:

```bash
cd ow
DATABASE_URL="postgresql://opticwise_db_user:er6uVwAIHfgoiGZ1u2IUdlayvZ0ouRJo@dpg-d4eboeh5pdvs73fpagfg-a.oregon-postgres.render.com/opticwise_db" \
npx tsx scripts/import-pipedrive.ts
```

This will import:
- ~17K people
- ~175 deals

## Features Implemented

✅ Login with JWT session cookies
✅ Deals Kanban board with drag-and-drop between stages
✅ Deal detail view with all Pipedrive fields
✅ Add Deal form
✅ Contacts (People) list and detail
✅ Organizations list and detail
✅ Sales Inbox placeholder
✅ Owner filter and Sort dropdown
✅ All custom fields from Pipedrive

## Troubleshooting

If the build still fails after switching to Node runtime:
1. Check build logs in Render dashboard
2. Ensure all env vars are set
3. Verify the ow/ directory exists in the repo
4. Check that package.json has the correct scripts

