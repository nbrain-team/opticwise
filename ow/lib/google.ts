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
export function getServiceAccountClient() {
  // Try to load from secret file location first
  const secretPath = '/etc/secrets/google-service-account.json';
  const workspacePath = path.join(process.cwd(), 'google-service-account.json');
  
  let credentials;
  
  try {
    if (fs.existsSync(secretPath)) {
      credentials = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
    } else if (fs.existsSync(workspacePath)) {
      credentials = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
    } else {
      throw new Error('Service account credentials file not found');
    }
  } catch (error) {
    console.error('Error loading service account credentials:', error);
    throw error;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });

  return auth;
}

// Get Gmail API client
export async function getGmailClient(auth: any) {
  return google.gmail({ version: 'v1', auth });
}

// Get Calendar API client
export async function getCalendarClient(auth: any) {
  return google.calendar({ version: 'v3', auth });
}

// Get Drive API client
export async function getDriveClient(auth: any) {
  return google.drive({ version: 'v3', auth });
}

// Generate OAuth URL for user consent
export function generateAuthUrl(oauth2Client: any, state?: string) {
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
export async function getTokensFromCode(oauth2Client: any, code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

