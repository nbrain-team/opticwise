# Slack Integration Rollback Plan

**If you need to rollback the Slack integration to get the site working again:**

---

## 🔙 Quick Rollback

### Option 1: Revert to Last Working Commit

```bash
cd /Users/dannydemichele/Opticwise

# Find the last working commit (before Slack integration)
git log --oneline | head -20

# Revert to commit before Slack integration started
# (probably commit 10121d5 or 17ada33)
git revert 0902916 80f29e6 5eb09bb 602cf79 29109db 333bef5 --no-edit

# Push
git push origin main
```

### Option 2: Disable Slack Routes

Comment out the Slack imports in the route file temporarily:

**File:** `ow/app/api/slack/events/route.ts`

Add `/* eslint-disable */` at top and comment out problematic imports.

---

## 🔍 Diagnosis First

**Before rolling back, let's check:**

1. **Is the app starting at all?**
   - Check Render logs after build
   - Look for "Ready" or "Listening on port"

2. **Are environment variables set?**
   - SLACK_BOT_TOKEN
   - SLACK_SIGNING_SECRET
   
3. **Did the build actually succeed?**
   - Check for "Build succeeded" message
   - Check for "Deploy live" message

---

## 📋 What to Check in Render

### Logs Tab

Look for:
```
✅ Build succeeded
✅ Starting application
✅ Ready on http://...
```

Or errors like:
```
❌ Missing environment variable
❌ Module not found
❌ Runtime error
```

### Events Tab

- Check if deploy actually completed
- Look for any failed deploys

---

**Don't rollback yet - let's diagnose first!** 

Can you share:
1. Deploy status in Render?
2. Any errors in the Logs tab after build?
3. Latest commit hash shown in Render?