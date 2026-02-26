/**
 * Generate a clean email-only list from the all-users contact extraction.
 * Filters out junk/system/unsubscribe/automated email addresses.
 */

import fs from 'fs';
import path from 'path';

function isJunkEmail(email: string): boolean {
  const e = email.toLowerCase().trim();

  // Long hash/token addresses
  if (e.match(/^[a-f0-9]{20,}@/)) return true;
  if (e.match(/[_=][a-f0-9]{10,}/)) return true;
  if (e.match(/\+[a-f0-9]{5,}/)) return true;
  if (e.match(/^32\./)) return true;

  // Unsubscribe addresses
  if (e.includes('unsubscribe')) return true;

  // System/automated email platforms
  const junkDomains = [
    'intercom-mail.com', 'customer.io', 'hubspot.com', 'salesforce.com',
    'mailchimp.com', 'sendgrid.net', 'mailgun.org', 'constantcontact.com',
    'b2b-mail.net', 'email-od.com', 'docusign.net', 'intuit.com',
    'asana.com', 'fathom.video', 'disco.co', 'beehiiv.com',
    'vimeo.com', 'notification.intuit.com', 'app.disco.co',
    'qbodocs.com', 'plaud.ai',
  ];
  if (junkDomains.some(d => e.includes(d))) return true;

  // System prefixes
  const junkPrefixes = [
    'noreply', 'no-reply', 'donotreply', 'mailer-daemon', 'postmaster',
    'daemon', 'bounce', 'alert@', 'notification', 'automated',
    'system@', 'admin@', 'webmaster', 'feedback@', 'survey@',
    'digest@', 'update@', 'news@', 'receipts@', 'ipadmin@',
    'accounting@', 'purchasing@', 'support@', 'info@', 'securitylicense@',
    'offboarding@', 'conversiondocuments@', 'spamproc',
  ];
  if (junkPrefixes.some(p => e.startsWith(p) || e.includes(p))) return true;

  // Addresses wrapped in angle brackets
  if (e.startsWith('<') || e.endsWith('>')) return true;

  // Missing @ or invalid format
  if (!e.includes('@') || !e.includes('.')) return true;

  // Very long local parts (usually tokens)
  const localPart = e.split('@')[0];
  if (localPart.length > 50) return true;

  // Contains = sign in local part (encoded/token emails)
  if (localPart.includes('=')) return true;

  return false;
}

function main() {
  const csvPath = path.join(process.cwd(), 'extracted-contacts-all-users.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  const cleanEmails: string[] = [];
  const junkEmails: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Extract email (first column)
    let email = '';
    if (line.startsWith('"')) {
      email = line.substring(1, line.indexOf('"', 1));
    } else {
      email = line.split(',')[0];
    }

    email = email.trim().toLowerCase().replace(/^<|>$/g, '');

    if (!email) continue;

    if (isJunkEmail(email)) {
      junkEmails.push(email);
    } else {
      cleanEmails.push(email);
    }
  }

  // Write clean emails
  const outputPath = path.join(process.cwd(), 'clean-email-list.csv');
  fs.writeFileSync(outputPath, 'Email\n' + cleanEmails.join('\n'), 'utf-8');

  console.log('\n📧 CLEAN EMAIL LIST GENERATED');
  console.log('='.repeat(50));
  console.log(`   ✅ Clean emails: ${cleanEmails.length}`);
  console.log(`   ❌ Junk filtered: ${junkEmails.length}`);
  console.log(`   📄 Output: ${outputPath}`);
  console.log('='.repeat(50));

  // Show sample junk for verification
  console.log('\n🗑️  Sample junk emails filtered out:');
  junkEmails.slice(0, 15).forEach(e => console.log(`   ❌ ${e}`));
  if (junkEmails.length > 15) console.log(`   ... and ${junkEmails.length - 15} more`);

  console.log('\n✅ Sample clean emails:');
  cleanEmails.slice(0, 10).forEach(e => console.log(`   ✅ ${e}`));
  console.log('');
}

main();
