# How to Get Your Slack Bot Token - Visual Guide

**Date:** January 29, 2026  
**You Are Here:** Basic Information page with Signing Secret ✅  
**You Need:** Bot User OAuth Token

---

## 🎯 Quick Answer

**Click on the LEFT SIDEBAR:**
1. Look for **"OAuth & Permissions"**
2. Click it
3. Follow steps below

---

## 📍 Step-by-Step Guide

### Step 1: Go to OAuth & Permissions

**In your Slack App dashboard (where you are now):**

**LEFT SIDEBAR → Click "OAuth & Permissions"**

```
Settings
├── Basic Information          ← You are here (has Signing Secret)
├── Collaborators
├── Socket Mode
├── Install App
└── Manage Distribution

Features
├── App Home
├── Agents & AI Apps
├── ...
├── Slash Commands
├── ...
├── OAuth & Permissions        ← CLICK HERE
├── Event Subscriptions
└── ...
```

---

### Step 2: Add Bot Token Scopes (If Not Done)

**On the OAuth & Permissions page:**

**Scroll down to "Scopes" section**

**Under "Bot Token Scopes":**

If you don't see any scopes yet, click **"Add an OAuth Scope"** and add these one by one:

```
✅ app_mentions:read       - See @ownet mentions
✅ chat:write              - Post messages  
✅ chat:write.public       - Post in public channels
✅ channels:history        - Read channel messages
✅ groups:history          - Read private channels
✅ im:history              - Read DMs
✅ im:write                - Send DMs
✅ users:read              - Get user info
✅ users:read.email        - Get user emails
✅ files:write             - Upload files
```

---

### Step 3: Install to Workspace

**Scroll back to the TOP of the OAuth & Permissions page**

You'll see a section: **"OAuth Tokens for Your Workspace"**

**Click the button:**
- If first time: **"Install to Workspace"**
- If already installed: **"Reinstall to Workspace"**

**On the permission screen:**
- Review the permissions
- Click **"Allow"**

---

### Step 4: Copy Bot Token

**After clicking "Allow", you'll be redirected back to OAuth & Permissions**

**Now you'll see:**

```
┌─────────────────────────────────────────────────────────┐
│ OAuth Tokens for Your Workspace                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Bot User OAuth Token                                    │
│ ┌─────────────────────────────────────┐                │
│ │ xoxb-1234567890-1234567890-abc...   │  [Copy]        │
│ └─────────────────────────────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Click the "Copy" button!**

This is your **`SLACK_BOT_TOKEN`**

---

## ✅ What You'll Have

After following these steps:

- ✅ **Signing Secret** - You already have this (from Basic Information)
- ✅ **Bot User OAuth Token** - You'll get this (from OAuth & Permissions)

---

## 🎯 Quick Visual Reference

### Current Location (Basic Information):
```
You see:
- App ID
- Client ID  
- Client Secret (hidden)
- Signing Secret (hidden) ← You have this ✅
- Verification Token
```

### Where You Need to Go (OAuth & Permissions):
```
You'll see:
- OAuth Tokens for Your Workspace
  - Bot User OAuth Token ← You need this!
  - Starts with: xoxb-
  
- Scopes
  - Bot Token Scopes (add the 10 scopes listed above)
  
- Redirect URLs (not needed for this integration)
```

---

## 🔗 Direct Steps

1. **LEFT SIDEBAR** → Click **"OAuth & Permissions"**
2. **Scroll down** → Add Bot Token Scopes (if not added)
3. **Scroll to top** → Click **"Install to Workspace"**
4. **Click "Allow"** on permission screen
5. **Copy the Bot User OAuth Token** (starts with `xoxb-`)

---

## 💡 Pro Tip

**If you don't see "Install to Workspace" button:**
- You need to add at least one Bot Token Scope first
- Scroll down to "Scopes" section
- Add the scopes listed above
- Then scroll back up and the button will appear

---

## 🎉 Once You Have Both

**You'll have:**
1. ✅ `SLACK_BOT_TOKEN` (from OAuth & Permissions)
2. ✅ `SLACK_SIGNING_SECRET` (from Basic Information - you already have this)

**Then:**
1. Add both to your `.env` file
2. Add both to Render environment variables
3. Run the database setup script
4. Configure event subscriptions
5. Test in Slack!

---

**Need more help?** Let me know which step you're stuck on! 🚀
