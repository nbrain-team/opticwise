# Render Build Fix - Node 22.16.0 Issue

## Problem
Render's Node 22.16.0 has a broken npm installation causing build failures.

## Solution Options

### Option 1: Downgrade Node Version (Recommended)

Update your Render build settings:

**In Render Dashboard:**
1. Go to your service → Environment
2. Add environment variable:
   - Key: `NODE_VERSION`
   - Value: `20.18.0`
3. Redeploy

**OR** Create `.node-version` file:

```bash
echo "20.18.0" > .node-version
```

### Option 2: Fix Build Command

Change build command in Render to:

```bash
cd ow && npx npm@latest ci --include=dev && npx prisma generate && npx npm@latest run build
```

### Option 3: Use render.yaml

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: opticwise
    env: node
    runtime: node
    buildCommand: cd ow && npm ci --include=dev && npx prisma generate && npm run build
    startCommand: cd ow && npm start
    envVars:
      - key: NODE_VERSION
        value: "20.18.0"
```

## Quick Fix (Do This Now)

**Fastest solution:**

1. Go to Render Dashboard
2. Your Service → Environment
3. Add: `NODE_VERSION` = `20.18.0`
4. Click "Save Changes"
5. Deploy will auto-restart

This will use Node 20.18.0 which is stable and tested.

## Verification

After deploying, check logs for:
```
==> Using Node.js version 20.18.0
```

Then the build should succeed.
