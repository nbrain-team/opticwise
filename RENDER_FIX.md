# Fix Render Deployment - TypeScript Types Issue

## The Problem
Render builds are failing with:
```
It looks like you're trying to use TypeScript but do not have the required package(s) installed.
Please install @types/react and @types/node
```

## The Root Cause
The build command `npm install` skips devDependencies in production mode, but TypeScript types are currently in devDependencies.

## The Fix (Choose One)

### Option 1: Update Build Command (Fastest - 5 min)

1. Go to: https://dashboard.render.com/web/srv-d4ecr5rgk3sc73blsjag/settings

2. Scroll to "Build Command"

3. Change from:
   ```
   cd ow && npm install && npx prisma generate && npm run build
   ```

4. To:
   ```
   cd ow && npm ci --include=dev && npx prisma generate && npm run build
   ```

5. Click "Save Changes"

6. Render will automatically redeploy and **should succeed**

### Option 2: Wait for GitHub (Then push will include fix)

The local code already has TypeScript types moved to dependencies, but GitHub is down with 500 errors.

Once GitHub recovers:
```bash
cd /Users/dannydemichele/Opticwise
git push origin main
```

This will push commit `a2488b2` which has the types fix.

## After Successful Deploy

Test at: **https://opticwise-backend.onrender.com/login**

Login:
- Email: bill@opticwise.com
- Password: 123456

You should see:
- ✅ Opticwise branding and logo
- ✅ Professional blue styling
- ✅ Deals Kanban board
- ✅ 4,860 organizations (paginated, 100 per page)
- ✅ All Pipedrive fields in detail views

## Current Commits Ready to Push

When GitHub is back:
- `543df92` - Expand Contacts and Organizations with all fields
- `2487190` - Expand database schema with all Pipedrive fields  
- `a2488b2` - Fix TypeScript types + clickable deal cards with drag handles
- Plus earlier: Branding, logo, styling, pagination

## Service Details

- **Service ID**: srv-d4ecr5rgk3sc73blsjag
- **Service Name**: Opticwise-Backend (this is your full app - frontend + backend)
- **URL**: https://opticwise-backend.onrender.com
- **Dashboard**: https://dashboard.render.com/web/srv-d4ecr5rgk3sc73blsjag

## Verify Environment Variables are Set

These should already be configured:
- `DATABASE_URL` = postgresql://opticwise_db_user:er6uVwAIHfgoiGZ1u2IUdlayvZ0ouRJo@dpg-d4eboeh5pdvs73fpagfg-a.oregon-postgres.render.com/opticwise_db
- `AUTH_SECRET` = a3b1d9d8f3d1b9e2c4a47f2c1aa0b983e7f21461bdb5a86e5c0f2c4172a9d7e4
- `NEXT_PUBLIC_BASE_URL` = https://opticwise-backend.onrender.com (or update to match)
- `NODE_ENV` = production
- `PORT` = 10000

Check at: https://dashboard.render.com/web/srv-d4ecr5rgk3sc73blsjag/env

