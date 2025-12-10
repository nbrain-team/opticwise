/**
 * Diagnostic script to test Google API authentication
 * Tests different scenarios to identify the exact issue
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function testGoogleAuth() {
  console.log('🔍 Google API Authentication Diagnostic Tool\n');
  console.log('='.repeat(60));

  // Load service account credentials
  const workspacePath = path.join(process.cwd(), 'google-service-account.json');
  
  if (!fs.existsSync(workspacePath)) {
    console.error('❌ Service account file not found at:', workspacePath);
    return;
  }

  const credentials = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
  console.log('✓ Service account file loaded');
  console.log('  - Project ID:', credentials.project_id);
  console.log('  - Client Email:', credentials.client_email);
  console.log('  - Client ID:', credentials.client_id);
  console.log();

  // Test 1: Basic Authentication
  console.log('Test 1: Basic Service Account Authentication');
  console.log('-'.repeat(60));
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    });
    const client = await auth.getClient();
    console.log('✓ Service account authentication successful');
    console.log('  - Auth client created');
  } catch (error) {
    console.error('❌ Service account authentication failed:', error);
  }
  console.log();

  // Test 2: Test with Domain-Wide Delegation (impersonating a user)
  console.log('Test 2: Domain-Wide Delegation (with user impersonation)');
  console.log('-'.repeat(60));
  const testEmails = ['bill@opticwise.com', 'navjeet@nucleus4d.com'];
  
  for (const email of testEmails) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/drive.readonly',
        ],
        clientOptions: {
          subject: email, // Impersonate this user
        },
      });
      
      const gmail = google.gmail({ version: 'v1', auth });
      
      // Try to list messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1,
      });
      
      console.log(`✓ Gmail API access successful for ${email}`);
      console.log(`  - Found ${response.data.resultSizeEstimate || 0} messages`);
      console.log(`  - Message count: ${response.data.messages?.length || 0}`);
    } catch (error: any) {
      console.error(`❌ Gmail API failed for ${email}`);
      if (error.response) {
        console.error(`  - Status: ${error.response.status} ${error.response.statusText}`);
        console.error(`  - Error: ${error.response.data?.error?.message || 'Unknown'}`);
        console.error(`  - Reason: ${error.response.data?.error?.errors?.[0]?.reason || 'Unknown'}`);
      } else {
        console.error(`  - Error: ${error.message}`);
      }
    }
  }
  console.log();

  // Test 3: Calendar API
  console.log('Test 3: Calendar API Access');
  console.log('-'.repeat(60));
  for (const email of testEmails) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar'],
        clientOptions: {
          subject: email,
        },
      });
      
      const calendar = google.calendar({ version: 'v3', auth });
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        maxResults: 1,
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: new Date().toISOString(),
      });
      
      console.log(`✓ Calendar API access successful for ${email}`);
      console.log(`  - Found ${response.data.items?.length || 0} upcoming events`);
    } catch (error: any) {
      console.error(`❌ Calendar API failed for ${email}`);
      if (error.response) {
        console.error(`  - Status: ${error.response.status} ${error.response.statusText}`);
        console.error(`  - Error: ${error.response.data?.error?.message || 'Unknown'}`);
      } else {
        console.error(`  - Error: ${error.message}`);
      }
    }
  }
  console.log();

  // Test 4: Drive API
  console.log('Test 4: Drive API Access');
  console.log('-'.repeat(60));
  for (const email of testEmails) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        clientOptions: {
          subject: email,
        },
      });
      
      const drive = google.drive({ version: 'v3', auth });
      
      const response = await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)',
      });
      
      console.log(`✓ Drive API access successful for ${email}`);
      console.log(`  - Found ${response.data.files?.length || 0} files`);
    } catch (error: any) {
      console.error(`❌ Drive API failed for ${email}`);
      if (error.response) {
        console.error(`  - Status: ${error.response.status} ${error.response.statusText}`);
        console.error(`  - Error: ${error.response.data?.error?.message || 'Unknown'}`);
      } else {
        console.error(`  - Error: ${error.message}`);
      }
    }
  }
  console.log();

  // Test 5: Check if APIs are enabled
  console.log('Test 5: Service Account Permissions Check');
  console.log('-'.repeat(60));
  console.log('Service Account Email:', credentials.client_email);
  console.log('Project ID:', credentials.project_id);
  console.log();
  console.log('Required APIs that must be enabled in Google Cloud Console:');
  console.log('  1. Gmail API');
  console.log('  2. Google Calendar API');
  console.log('  3. Google Drive API');
  console.log();
  console.log('Required Configuration:');
  console.log('  1. Domain-wide delegation ENABLED for service account');
  console.log('  2. In Google Workspace Admin > API Controls > Domain-wide Delegation:');
  console.log('     - Client ID:', credentials.client_id);
  console.log('     - Scopes: https://www.googleapis.com/auth/gmail.readonly,');
  console.log('               https://www.googleapis.com/auth/gmail.send,');
  console.log('               https://www.googleapis.com/auth/calendar,');
  console.log('               https://www.googleapis.com/auth/drive.readonly');
  console.log();
  console.log('='.repeat(60));
  console.log('\n✅ Diagnostic complete!\n');
}

testGoogleAuth().catch(console.error);

