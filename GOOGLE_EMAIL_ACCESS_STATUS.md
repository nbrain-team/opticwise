# Google Email Access Status

## Current Status: ❌ NO EMAIL ACCESS

**Result:** The service account currently **CANNOT access ANY email accounts** including Bill's email.

## What This Means

Currently, your Google service account can:
- ✅ Access **Shared Drives** (confirmed working)
- ✅ List files and folders in shared drives
- ❌ **Cannot access Gmail** for any user
- ❌ **Cannot access Calendar** for any user  
- ❌ **Cannot access individual user's Drive files**

## Why Gmail/Calendar Don't Work

The error message `unauthorized_client: Client is unauthorized to retrieve access tokens using this method` indicates that **Domain-Wide Delegation** is NOT enabled for your service account.

### What is Domain-Wide Delegation?

Domain-Wide Delegation allows a service account to impersonate users in your Google Workspace and access their Gmail, Calendar, and Drive on their behalf. Without it, the service account can only access:
- Shared Drives (which you have)
- Files/folders explicitly shared with the service account email

## How to Enable Access to Email Accounts

To access Gmail, Calendar, and individual user Drive files, you need to:

### 1. Go to Google Workspace Admin Console
   - URL: https://admin.google.com
   - You need to be a Google Workspace Admin

### 2. Navigate to Domain-Wide Delegation
   - Go to **Security** → **API Controls** → **Domain-wide Delegation**
   - Click **Add new** or **Manage Domain Wide Delegation**

### 3. Add Your Service Account
   - **Client ID:** `102168247649817239640`
   - **OAuth Scopes (comma-separated):**
     ```
     https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/drive.readonly
     ```

### 4. Authorize and Save
   - Click **Authorize**
   - Wait 10-15 minutes for changes to propagate

## Tested Email Accounts

We tested the following OpticWise email accounts:
1. ❌ bill@opticwise.com - Unauthorized
2. ❌ drew@opticwise.com - Unauthorized
3. ❌ austin@opticwise.com - Invalid email/User ID (doesn't exist)
4. ❌ karen@opticwise.com - Invalid email/User ID (doesn't exist)
5. ❌ shawn@opticwise.com - Invalid email/User ID (doesn't exist)
6. ❌ sean@opticwise.com - Unauthorized
7. ❌ support@opticwise.com - Unauthorized
8. ❌ info@opticwise.com - Unauthorized
9. ❌ sales@opticwise.com - Unauthorized

**Note:** Some emails show "Invalid email or User ID" which means those accounts don't exist in your Google Workspace.

## After Enabling Domain-Wide Delegation

Once enabled, you'll be able to:
- 📧 Read Gmail messages from any user in your workspace
- 📅 Access Calendar events from any user
- 📁 Access individual user's Drive files
- 🔄 Sync emails to your CRM automatically
- 📊 Pull calendar data for meeting analysis

You can switch between users by changing the `GOOGLE_IMPERSONATE_USER` environment variable.

## Current Configuration

```
Service Account Email: opticwise-service@opticwise-integration-nbrain.iam.gserviceaccount.com
Client ID: 102168247649817239640
Default Impersonation: bill@opticwise.com
```

## Next Steps

1. **Enable Domain-Wide Delegation** (see steps above)
2. Re-run the test script: `npx tsx scripts/test-email-access.ts`
3. Once working, you can sync emails: `npx tsx scripts/sync-gmail.ts`
4. Access other users by setting env var: `GOOGLE_IMPERSONATE_USER=drew@opticwise.com`

