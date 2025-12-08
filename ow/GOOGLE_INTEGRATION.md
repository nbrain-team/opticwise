# Google Workspace Integration

This document describes the Google Workspace (Gmail, Calendar, Drive) integration for OpticWise.

## Setup Complete ✅

The following has been configured:

1. **Google OAuth Credentials** added to Render environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

2. **Service Account Credentials** added as secret file:
   - `/etc/secrets/google-service-account.json` on Render
   - Contains private key for server-to-server authentication

3. **Google APIs Client Library** installed:
   - `googleapis` package added to dependencies

## API Endpoints

### OAuth Flow (User Authentication)

#### 1. Initiate OAuth
```
GET /api/integrations/google/auth?state=optional_state
```
Returns: `{ authUrl: "https://accounts.google.com/..." }`

Redirect users to this URL to begin OAuth flow.

#### 2. OAuth Callback
```
GET /api/integrations/google/callback?code=xxx&state=xxx
```
Handles the OAuth callback from Google. Automatically redirects to `/settings?google_connected=true`

### Gmail API

#### List Messages
```
GET /api/integrations/google/gmail?maxResults=10&query=from:user@example.com
```
Returns list of Gmail messages.

#### Send Email
```
POST /api/integrations/google/gmail
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email body content"
}
```

### Calendar API

#### List Events
```
GET /api/integrations/google/calendar?maxResults=10&timeMin=2025-12-08T00:00:00Z
```
Returns upcoming calendar events.

#### Create Event
```
POST /api/integrations/google/calendar
Content-Type: application/json

{
  "summary": "Meeting Title",
  "description": "Meeting description",
  "start": "2025-12-09T10:00:00-08:00",
  "end": "2025-12-09T11:00:00-08:00",
  "attendees": ["email1@example.com", "email2@example.com"]
}
```

### Drive API

#### List Files
```
GET /api/integrations/google/drive?maxResults=10&query=name contains 'report'
```
Returns list of Drive files.

#### Get File Metadata
```
POST /api/integrations/google/drive
Content-Type: application/json

{
  "fileId": "1abc...",
  "action": "metadata"
}
```

## Authentication Methods

### Method 1: OAuth2 (User Authentication)
- Used when accessing user-specific resources
- Requires user to grant permission
- Use `getOAuth2Client()` helper

### Method 2: Service Account (Server-to-Server)
- Used for automated access without user interaction
- Requires domain-wide delegation for workspace access
- Use `getServiceAccountClient()` helper

## Helper Functions

Located in `/lib/google.ts`:

- `getOAuth2Client()` - Get OAuth2 client for user auth
- `getServiceAccountClient()` - Get service account client
- `getGmailClient(auth)` - Get Gmail API client
- `getCalendarClient(auth)` - Get Calendar API client
- `getDriveClient(auth)` - Get Drive API client
- `generateAuthUrl(oauth2Client, state?)` - Generate OAuth URL
- `getTokensFromCode(oauth2Client, code)` - Exchange code for tokens

## Usage Examples

### Example 1: Send Email from Backend
```typescript
import { getServiceAccountClient, getGmailClient } from '@/lib/google';

const auth = getServiceAccountClient();
const gmail = await getGmailClient(auth);

// Send email logic here
```

### Example 2: Create Calendar Event
```typescript
import { getServiceAccountClient, getCalendarClient } from '@/lib/google';

const auth = getServiceAccountClient();
const calendar = await getCalendarClient(auth);

// Create event logic here
```

### Example 3: User OAuth Flow (Frontend)
```typescript
// In your React component:
const connectGoogle = async () => {
  const response = await fetch('/api/integrations/google/auth');
  const { authUrl } = await response.json();
  window.location.href = authUrl;
};
```

## Scopes Configured

The integration has access to:
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail
- `https://www.googleapis.com/auth/gmail.send` - Send Gmail
- `https://www.googleapis.com/auth/calendar` - Full Calendar access
- `https://www.googleapis.com/auth/drive.readonly` - Read Drive files

## Next Steps

1. **Install Dependencies**: Run `npm install` in the `/ow` directory
2. **Domain-Wide Delegation** (for service account): 
   - Go to Google Workspace Admin Console
   - Security > API Controls > Domain-wide Delegation
   - Add service account with required scopes
3. **Test Integration**: Use the API endpoints to verify connectivity
4. **Store User Tokens**: Implement database storage for OAuth tokens (TODO in callback route)

## Security Notes

- Service account credentials are stored securely in Render secret files
- OAuth tokens should be stored encrypted in database
- Never expose credentials in client-side code
- Use HTTPS for all OAuth redirects

## Troubleshooting

**Error: "Service account credentials file not found"**
- Verify the secret file is uploaded to Render
- Check file path: `/etc/secrets/google-service-account.json`

**Error: "Missing Google OAuth credentials"**
- Verify environment variables are set in Render
- Check: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**OAuth Error: "redirect_uri_mismatch"**
- Verify redirect URI matches: `https://opticwise-backend.onrender.com/api/integrations/google/callback`
- Check Google Cloud Console OAuth settings

