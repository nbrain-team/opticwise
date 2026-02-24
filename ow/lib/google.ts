import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Initialize OAuth2 client for user authentication
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Initialize service account client for server-to-server authentication
// userEmail: the @opticwise.com user to impersonate (defaults to bill@opticwise.com)
export function getServiceAccountClient(userEmail?: string) {
  let credentials;
  
  // Option 1: Try environment variable first (easiest for Render)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:', error);
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format');
    }
  }
  // Option 2: Try secret file locations
  else {
    const possiblePaths = [
      '/etc/secrets/google-service-account.json',
      path.join(process.cwd(), 'google-service-account.json'),
      path.join(process.cwd(), 'ow', 'google-service-account.json'),
      path.join(__dirname, '..', 'google-service-account.json'),
      path.join(__dirname, '..', '..', 'google-service-account.json'),
    ];
    
    let found = false;
    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          credentials = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          console.log(`[Google Auth] Loaded credentials from: ${filePath}`);
          found = true;
          break;
        }
      } catch {
        // Try next path
      }
    }
    
    if (!found) {
      console.error('[Google Auth] Checked paths:', possiblePaths);
      throw new Error('Service account credentials not found. Set GOOGLE_SERVICE_ACCOUNT_JSON env var or upload google-service-account.json to /etc/secrets/');
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
    clientOptions: {
      subject: userEmail || process.env.GOOGLE_IMPERSONATE_USER || 'bill@opticwise.com',
    },
  });

  return auth;
}

// Get Gmail API client
export async function getGmailClient(auth: ReturnType<typeof getServiceAccountClient> | ReturnType<typeof getOAuth2Client>) {
  return google.gmail({ version: 'v1', auth });
}

// Get Calendar API client
export async function getCalendarClient(auth: ReturnType<typeof getServiceAccountClient> | ReturnType<typeof getOAuth2Client>) {
  return google.calendar({ version: 'v3', auth });
}

// Get Drive API client
export async function getDriveClient(auth: ReturnType<typeof getServiceAccountClient> | ReturnType<typeof getOAuth2Client>) {
  return google.drive({ version: 'v3', auth });
}

// Generate OAuth URL for user consent
export function generateAuthUrl(oauth2Client: ReturnType<typeof getOAuth2Client>, state?: string) {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive.readonly',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state,
    prompt: 'consent', // Force showing consent screen to get refresh token
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(oauth2Client: ReturnType<typeof getOAuth2Client>, code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}


