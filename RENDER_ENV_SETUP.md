# Render Environment Variables Setup

## Required for Opticwise-Frontend (srv-d4ebnhp5pdvs73fpa13g)

Go to: https://dashboard.render.com/web/srv-d4ebnhp5pdvs73fpa13g/env

Add these environment variables:

### DATABASE_URL
```
postgresql://opticwise_db_user:er6uVwAIHfgoiGZ1u2IUdlayvZ0ouRJo@dpg-d4eboeh5pdvs73fpagfg-a.oregon-postgres.render.com/opticwise_db
```

### AUTH_SECRET
```
a3b1d9d8f3d1b9e2c4a47f2c1aa0b983e7f21461bdb5a86e5c0f2c4172a9d7e4
```

### NEXT_PUBLIC_BASE_URL
```
https://opticwise-frontend.onrender.com
```

### NODE_ENV
```
production
```

## After adding env vars:
1. Click "Save Changes"
2. Render will automatically redeploy
3. Wait 3-5 minutes for build to complete
4. Test at: https://opticwise-frontend.onrender.com/login

## Test Login Credentials
- Email: bill@opticwise.com
- Password: 123456

## Current Deploy Status
Build started at: 2025-11-18T19:32:29Z
Commit: e5fe29c "Remove large CSV files from repo"
Status: build_in_progress

Check status: https://dashboard.render.com/web/srv-d4ebnhp5pdvs73fpa13g

