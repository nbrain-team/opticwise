/**
 * Test which email accounts can be accessed via service account impersonation
 */

import { google } from 'googleapis';
import fs from 'fs';

async function testEmailAccess() {
  console.log('='.repeat(80));
  console.log('TESTING EMAIL ACCESS FOR DIFFERENT USERS');
  console.log('='.repeat(80));
  console.log('');
  
  // Load service account credentials
  const credentials = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));
  
  // Common OpticWise email addresses to test
  const emailsToTest = [
    'bill@opticwise.com',
    'drew@opticwise.com',
    'austin@opticwise.com',
    'karen@opticwise.com',
    'shawn@opticwise.com',
    'sean@opticwise.com',
    'support@opticwise.com',
    'info@opticwise.com',
    'sales@opticwise.com',
  ];
  
  console.log('Testing access to the following email accounts:');
  emailsToTest.forEach((email, i) => console.log(`  ${i + 1}. ${email}`));
  console.log('');
  console.log('='.repeat(80));
  console.log('');
  
  const results: any[] = [];
  
  for (const email of emailsToTest) {
    console.log(`\n📧 Testing: ${email}`);
    console.log('-'.repeat(80));
    
    try {
      // Create auth client with domain-wide delegation
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/drive.readonly',
        ],
        clientOptions: {
          subject: email, // Impersonate this user
        },
      });
      
      // Test Gmail access
      let gmailAccess = false;
      let gmailError = '';
      let messageCount = 0;
      
      try {
        const gmail = google.gmail({ version: 'v1', auth });
        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 1,
        });
        gmailAccess = true;
        messageCount = response.data.resultSizeEstimate || 0;
        console.log(`   ✅ Gmail: SUCCESS (${messageCount} messages)`);
      } catch (err: any) {
        gmailError = err.message;
        console.log(`   ❌ Gmail: FAILED - ${err.message}`);
      }
      
      // Test Calendar access
      let calendarAccess = false;
      let calendarError = '';
      let calendarCount = 0;
      
      try {
        const calendar = google.calendar({ version: 'v3', auth });
        const response = await calendar.calendarList.list();
        calendarAccess = true;
        calendarCount = response.data.items?.length || 0;
        console.log(`   ✅ Calendar: SUCCESS (${calendarCount} calendars)`);
      } catch (err: any) {
        calendarError = err.message;
        console.log(`   ❌ Calendar: FAILED - ${err.message}`);
      }
      
      // Test Drive access
      let driveAccess = false;
      let driveError = '';
      let driveFileCount = 0;
      
      try {
        const drive = google.drive({ version: 'v3', auth });
        const response = await drive.files.list({
          pageSize: 1,
          fields: 'files(id, name)',
        });
        driveAccess = true;
        driveFileCount = response.data.files?.length || 0;
        console.log(`   ✅ Drive: SUCCESS (${driveFileCount} files accessible)`);
      } catch (err: any) {
        driveError = err.message;
        console.log(`   ❌ Drive: FAILED - ${err.message}`);
      }
      
      results.push({
        email,
        gmailAccess,
        gmailError,
        messageCount,
        calendarAccess,
        calendarError,
        calendarCount,
        driveAccess,
        driveError,
        driveFileCount,
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err: any) {
      console.log(`   ❌ GENERAL ERROR: ${err.message}`);
      results.push({
        email,
        gmailAccess: false,
        gmailError: err.message,
        messageCount: 0,
        calendarAccess: false,
        calendarError: err.message,
        calendarCount: 0,
        driveAccess: false,
        driveError: err.message,
        driveFileCount: 0,
      });
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY OF ACCESS PERMISSIONS');
  console.log('='.repeat(80));
  console.log('');
  
  const accessibleEmails = results.filter(r => r.gmailAccess || r.calendarAccess || r.driveAccess);
  
  if (accessibleEmails.length === 0) {
    console.log('❌ No email accounts are accessible via service account impersonation.');
    console.log('');
    console.log('This means Domain-Wide Delegation is NOT enabled or not configured properly.');
    console.log('');
    console.log('To enable access to other users:');
    console.log('1. Go to Google Workspace Admin Console');
    console.log('2. Navigate to Security > API Controls > Domain-wide Delegation');
    console.log('3. Add the service account client ID with required scopes');
    console.log(`   Client ID: ${credentials.client_id}`);
    console.log('   Scopes:');
    console.log('   - https://www.googleapis.com/auth/gmail.readonly');
    console.log('   - https://www.googleapis.com/auth/gmail.send');
    console.log('   - https://www.googleapis.com/auth/calendar');
    console.log('   - https://www.googleapis.com/auth/drive.readonly');
  } else {
    console.log(`✅ Found ${accessibleEmails.length} accessible email account(s):\n`);
    
    accessibleEmails.forEach(r => {
      console.log(`📧 ${r.email}`);
      if (r.gmailAccess) console.log(`   ✓ Gmail (${r.messageCount} messages)`);
      if (r.calendarAccess) console.log(`   ✓ Calendar (${r.calendarCount} calendars)`);
      if (r.driveAccess) console.log(`   ✓ Drive access`);
      console.log('');
    });
  }
  
  // Detailed error analysis
  const failedEmails = results.filter(r => !r.gmailAccess && !r.calendarAccess && !r.driveAccess);
  
  if (failedEmails.length > 0) {
    console.log('='.repeat(80));
    console.log(`❌ Failed to access ${failedEmails.length} email account(s):`);
    console.log('');
    
    failedEmails.forEach(r => {
      console.log(`📧 ${r.email}`);
      if (r.gmailError) console.log(`   Gmail Error: ${r.gmailError}`);
      if (r.calendarError) console.log(`   Calendar Error: ${r.calendarError}`);
      if (r.driveError) console.log(`   Drive Error: ${r.driveError}`);
      console.log('');
    });
  }
  
  console.log('='.repeat(80));
  console.log('');
  console.log('Current environment setting:');
  console.log(`GOOGLE_IMPERSONATE_USER: ${process.env.GOOGLE_IMPERSONATE_USER || 'bill@opticwise.com (default)'}`);
  console.log('');
  console.log('To change the impersonated user, set the GOOGLE_IMPERSONATE_USER environment variable.');
  console.log('='.repeat(80));
}

// Run
testEmailAccess().catch(console.error);

