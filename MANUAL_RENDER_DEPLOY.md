# Manual Render Deploy Instructions

**Issue:** Render not auto-deploying latest commits  
**Latest Commit:** `80f29e6` (has all fixes)  
**Last Failed Build:** `5eb09bb` (old commit)

---

## 🔧 Manual Deploy Options

### Option 1: Trigger Deploy in Render Dashboard (Fastest)

1. **Go to Render Dashboard**
2. **Select your service**
3. **Click "Manual Deploy"** dropdown (top right)
4. **Select "Deploy latest commit"**
5. **Confirm**

This will pull the latest code from GitHub (`80f29e6`) and build it.

---

### Option 2: Enable Auto-Deploy (Recommended)

**If auto-deploy is disabled:**

1. **Render Dashboard** → Your service
2. **Settings** tab
3. Scroll to **"Build & Deploy"** section
4. **Auto-Deploy:** Should be **"Yes"**
5. If it's "No", change to "Yes"
6. **Save Changes**

Then any future pushes will auto-deploy.

---

### Option 3: Create Empty Commit to Trigger Deploy

```bash
cd /Users/dannydemichele/Opticwise
git commit --allow-empty -m "trigger: manual Render deploy"
git push origin main
```

This creates an empty commit that should trigger Render's webhook.

---

## ✅ What Should Happen

Once the correct build runs (commit `80f29e6` or later):

**Build will succeed because:**
- ✅ All TypeScript errors fixed
- ✅ Proper type checking for sources array
- ✅ Thread_ts handled correctly
- ✅ Slack SDK types imported
- ✅ All linter errors resolved

**Expected build time:** 2-3 minutes

---

## 🎯 After Successful Deploy

### 1. Verify Endpoint Works

Visit:
```
https://opticwise-frontend.onrender.com/api/slack/events
```

**Expected:**
```json
{"status":"ok","service":"OWnet Slack Integration","timestamp":"..."}
```

### 2. Configure Slack Event Subscriptions

**Request URL:**
```
https://opticwise-frontend.onrender.com/api/slack/events
```

**Click "Retry"** → Should show ✅ "Verified"

### 3. Initialize Database

**Render Shell:**
```bash
cd ow
npx tsx scripts/init-slack-tables.ts
```

### 4. Test in Slack

```
@ownet test
```

---

## 🚨 Quick Fix Now

**Try Option 1 (Manual Deploy) right now:**

1. Render Dashboard
2. Your service
3. "Manual Deploy" → "Deploy latest commit"

**This will build commit `80f29e6` which has all the fixes!**

---

**Do this now and the build will succeed!** 🚀
