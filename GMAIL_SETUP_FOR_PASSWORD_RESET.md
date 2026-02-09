# Gmail Setup for Password Reset Emails

**Issue:** Password reset is getting 500 error when trying to send emails.

**Cause:** Google service account may not have Gmail send permissions or domain-wide delegation configured.

---

## Quick Fix Option 1: Skip Email for Now

You can temporarily disable email sending and just show the reset link directly. This lets you test the password reset functionality without email.

I can modify the code to:
1. Generate the reset token
2. Show the reset URL directly in the response (for testing)
3. Later enable email when Google is configured

---

## Option 2: Configure Gmail Sending (Recommended)

### Requirements

1. **Google Workspace Account** (bill@opticwise.com)
2. **Service Account** with domain-wide delegation
3. **Gmail API enabled**
4. **Proper OAuth scopes**

### Steps to Enable Gmail Sending

#### 1. Check Current Service Account

In Render Shell:
```bash
echo $GOOGLE_SERVICE_ACCOUNT_JSON | jq '.client_email'
```

Should show something like: `opticwise@project-id.iam.gserviceaccount.com`

#### 2. Enable Gmail API

1. Go to Google Cloud Console
2. Select your project
3. Go to "APIs & Services" → "Library"
4. Search for "Gmail API"
5. Click "Enable"

#### 3. Configure Domain-Wide Delegation

1. Go to Google Cloud Console
2. "IAM & Admin" → "Service Accounts"
3. Find your service account
4. Click "Edit"
5. Check "Enable domain-wide delegation"
6. Copy the "Client ID"

#### 4. Authorize in Google Workspace

1. Go to Google Workspace Admin Console
2. Security → Access and data control → API controls
3. Click "Manage Domain Wide Delegation"
4. Click "Add new"
5. Paste the Client ID from step 3
6. Add OAuth Scopes:
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.readonly
   ```
7. Click "Authorize"

#### 5. Verify Environment Variable

In Render, ensure `GOOGLE_IMPERSONATE_USER` is set:
```
GOOGLE_IMPERSONATE_USER=bill@opticwise.com
```

#### 6. Test Email Sending

In Render Shell:
```bash
cd ow
npx tsx -e "
import { sendPasswordResetEmail } from './lib/email';

sendPasswordResetEmail({
  to: 'bill@opticwise.com',
  name: 'Bill',
  resetUrl: 'https://test.com/reset'
}).then(() => console.log('Email sent!'))
  .catch(err => console.error('Error:', err));
"
```

---

## Option 3: Use Admin Email Link (Workaround)

For now, when users request password reset:
1. Admin (you) gets notified
2. Admin manually generates reset link
3. Admin sends link to user

This is manual but works immediately without Gmail setup.

---

## Which Option Do You Want?

**Option 1 (Quick):** Disable email temporarily, show reset link in console/logs
- ✅ Works immediately
- ✅ Can test password reset
- ❌ Not production-ready

**Option 2 (Proper):** Configure Gmail sending
- ✅ Production-ready
- ✅ Professional emails
- ⏱️ Requires Google Workspace admin access

**Option 3 (Manual):** Admin handles reset requests
- ✅ Works now
- ✅ No setup needed
- ❌ Manual work for each request

---

## Current Error Details

The 500 error is happening because the Gmail send is failing. Common causes:

1. **Service account not authorized** for domain-wide delegation
2. **Gmail API not enabled** in Google Cloud project
3. **Missing OAuth scopes** in Workspace admin
4. **Wrong impersonation user** set in environment

Check Render logs for the exact error message to diagnose.

---

Let me know which option you prefer and I can implement it!
