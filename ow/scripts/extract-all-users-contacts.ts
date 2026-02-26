/**
 * Multi-User Contact Extraction
 * 
 * Extracts contacts from ALL OpticWise users' sent emails.
 * Deduplicates across users, keeps richest data per contact.
 * 
 * Usage:
 *   npx tsx scripts/extract-all-users-contacts.ts
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const INTERNAL_DOMAINS = ['opticwise.com', 'nbrain.team'];

const OPTICWISE_SENDERS = [
  { name: 'Bill Douglas', pattern: 'bill' },
  { name: 'Drew Hall', pattern: 'drew.hall' },
  { name: 'Roxana Obertti', pattern: 'roxana' },
  { name: 'Bruceann Gomez', pattern: 'bruceann' },
  { name: 'Kaylie Douglas', pattern: 'kaylie' },
  { name: 'Alex Hodges', pattern: 'alex.hodges' },
  { name: 'Connor Hunt', pattern: 'connor.hunt' },
  { name: 'Dave King', pattern: 'dave.king' },
];

interface ContactData {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedin?: string;
  address?: string;
  totalEmailCount: number;
  initiatedEmailCount: number;
  replyEmailCount: number;
  firstContactDate: Date;
  lastContactDate: Date;
  sourceUsers: string[];
  sampleSubjects: string[];
}

function isSpamOrBounceEmail(email: string): boolean {
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes('bounce') || lowerEmail.includes('+')) return true;
  if (lowerEmail.includes('noreply') || lowerEmail.includes('no-reply')) return true;
  if (lowerEmail.includes('spamproc') || lowerEmail.includes('donotreply')) return true;
  if (lowerEmail.startsWith('receipts@')) return true;
  if (lowerEmail.includes('conversiondocuments@')) return true;
  if (lowerEmail.includes('offboarding@')) return true;
  if (lowerEmail.match(/@em\d+\./)) return true;
  if (lowerEmail.match(/@e\./)) return true;
  const spamDomains = ['fbl.en25.com', 'mail.beehiiv.com', 'email.upwork.com', 'news.credaily.com'];
  if (spamDomains.some(d => lowerEmail.includes(d))) return true;
  return false;
}

function isInternalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return INTERNAL_DOMAINS.some(d => domain === d.toLowerCase());
}

function parseRecipients(field: string): { email: string; name?: string }[] {
  const results: { email: string; name?: string }[] = [];
  const recipients = field.split(/[,;]/).map(r => r.trim());
  for (const recipient of recipients) {
    const match = recipient.match(/^(.+?)\s*<(.+?)>$/) || recipient.match(/^(.+)$/);
    if (match) {
      if (match.length === 3) {
        results.push({ name: match[1].trim().replace(/^["']|["']$/g, ''), email: match[2].trim().toLowerCase() });
      } else {
        results.push({ email: match[1].trim().toLowerCase() });
      }
    }
  }
  return results;
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function extractSignatureInfo(emailBody: string, emailAddress: string): Promise<any> {
  if (!emailBody || emailBody.length < 50) return null;

  const emailStart = emailBody.slice(0, 600);
  const emailEnd = emailBody.slice(-800);
  const combinedPortion = emailStart + '\n...\n' + emailEnd;

  const prompt = `Extract contact information for the person with email: ${emailAddress}

CRITICAL: You MUST match the name to the email address!

EMAIL-TO-NAME MATCHING RULES:
1. Email: cary@nbrain.ai → Name should be "Cary" (NOT "Danny", NOT "Bill")
2. Email: john.smith@company.com → Name should be "John Smith"
3. If you see multiple signatures, extract ONLY the one matching ${emailAddress}
4. REJECT any name that doesn't match the email username: "${emailAddress.split('@')[0]}"

Email content:
${combinedPortion}

Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "Full Name that MATCHES ${emailAddress}, or null if uncertain",
  "firstName": "First Name matching email username, or null",
  "lastName": "Last Name or null",
  "title": "Job Title or null",
  "company": "Company Name or null",
  "phone": "Phone Number or null",
  "linkedin": "LinkedIn URL or null",
  "address": "Physical Address or null"
}

REJECT mismatches! If unsure whether the name matches the email, return nulls for name fields.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate name matches email
      if (parsed.firstName) {
        const emailUsername = emailAddress.split('@')[0].toLowerCase();
        const firstNameLower = parsed.firstName.toLowerCase();
        const lastNameLower = parsed.lastName?.toLowerCase() || '';
        const parts = emailUsername.split(/[._-]/);

        const firstNameMatch = emailUsername.includes(firstNameLower.substring(0, Math.min(4, firstNameLower.length))) ||
                               firstNameLower.includes(emailUsername.substring(0, Math.min(4, emailUsername.length)));
        const lastNameMatch = lastNameLower && (
          emailUsername.includes(lastNameLower.substring(0, Math.min(4, lastNameLower.length))) ||
          lastNameLower.includes(emailUsername.substring(0, Math.min(4, emailUsername.length)))
        );
        const multiPartMatch = parts.some(part =>
          part.length >= 3 && (firstNameLower.includes(part) || lastNameLower.includes(part))
        );

        if (!firstNameMatch && !lastNameMatch && !multiPartMatch) {
          parsed.name = null;
          parsed.firstName = null;
          parsed.lastName = null;
          parsed.title = null;
        }
      }

      if (parsed.name && parsed.name.toLowerCase().includes('bill douglas')) {
        if (!emailAddress.toLowerCase().includes('bill')) {
          parsed.name = null; parsed.firstName = null; parsed.lastName = null;
          parsed.company = null; parsed.title = null;
        }
      }
      if (parsed.company && parsed.company.toLowerCase().includes('opticwise')) {
        if (!emailAddress.toLowerCase().includes('opticwise')) {
          parsed.company = null;
        }
      }

      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function extractAllContacts() {
  console.log('\n📧 MULTI-USER CONTACT EXTRACTION');
  console.log('='.repeat(60));

  const masterContactMap = new Map<string, ContactData>();
  const perUserStats: { name: string; sent: number; uniqueRecipients: number; qualified: number }[] = [];

  for (const sender of OPTICWISE_SENDERS) {
    console.log(`\n👤 Processing: ${sender.name} (${sender.pattern}@opticwise.com)`);

    const sentEmails = await prisma.gmailMessage.findMany({
      where: {
        from: { contains: sender.pattern, mode: 'insensitive' },
      },
      select: {
        id: true, gmailMessageId: true, threadId: true, subject: true,
        body: true, bodyHtml: true, from: true, to: true, cc: true, date: true,
      },
      orderBy: { date: 'asc' },
    });

    console.log(`   📧 Found ${sentEmails.length} sent emails`);
    if (sentEmails.length === 0) continue;

    let newRecipients = 0;

    for (const email of sentEmails) {
      const isReply = email.subject?.toLowerCase().startsWith('re:') || false;
      const toRecipients = email.to ? parseRecipients(email.to) : [];
      const ccRecipients = email.cc ? parseRecipients(email.cc) : [];
      const allRecipients = [...toRecipients, ...ccRecipients];

      for (const recipient of allRecipients) {
        const recipientEmail = recipient.email.toLowerCase();
        if (isInternalEmail(recipientEmail)) continue;
        if (isSpamOrBounceEmail(recipientEmail)) continue;
        if (!recipientEmail.includes('@')) continue;

        let contact = masterContactMap.get(recipientEmail);

        if (!contact) {
          contact = {
            email: recipientEmail,
            name: recipient.name || '',
            totalEmailCount: 0,
            initiatedEmailCount: 0,
            replyEmailCount: 0,
            firstContactDate: email.date,
            lastContactDate: email.date,
            sourceUsers: [],
            sampleSubjects: [],
          };
          masterContactMap.set(recipientEmail, contact);
          newRecipients++;
        }

        if (isReply) { contact.replyEmailCount++; } else { contact.initiatedEmailCount++; }
        contact.totalEmailCount++;
        contact.lastContactDate = email.date > contact.lastContactDate ? email.date : contact.lastContactDate;

        if (!contact.sourceUsers.includes(sender.name)) {
          contact.sourceUsers.push(sender.name);
        }

        if (contact.sampleSubjects.length < 3 && email.subject) {
          contact.sampleSubjects.push(email.subject);
        }
      }
    }

    perUserStats.push({
      name: sender.name,
      sent: sentEmails.length,
      uniqueRecipients: newRecipients,
      qualified: newRecipients,
    });

    console.log(`   👥 ${newRecipients} new unique recipients added to master list`);
  }

  const allContacts = Array.from(masterContactMap.values());
  console.log(`\n📊 Total unique external contacts: ${allContacts.length}`);

  // Enrich contacts with signature data
  console.log('\n🔍 Enriching contacts with signature data...');
  let enriched = 0;
  const batchSize = 5;

  for (let i = 0; i < allContacts.length; i += batchSize) {
    const batch = allContacts.slice(i, i + batchSize);

    await Promise.all(batch.map(async (contact) => {
      const emailFromContact = await prisma.gmailMessage.findFirst({
        where: { from: { contains: contact.email, mode: 'insensitive' }, body: { not: null } },
        select: { body: true },
        orderBy: { date: 'desc' },
      });

      let signatureInfo = null;

      if (emailFromContact?.body) {
        signatureInfo = await extractSignatureInfo(emailFromContact.body, contact.email);
      }

      if (!signatureInfo || !signatureInfo.name) {
        const sentEmail = await prisma.gmailMessage.findFirst({
          where: {
            OR: [
              { to: { contains: contact.email, mode: 'insensitive' } },
              { cc: { contains: contact.email, mode: 'insensitive' } },
            ],
            from: { contains: 'opticwise', mode: 'insensitive' },
          },
          select: { to: true, cc: true },
        });

        if (sentEmail) {
          const combined = `${sentEmail.to || ''},${sentEmail.cc || ''}`;
          const regex = new RegExp(`([^<,]+?)\\s*<${contact.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`, 'i');
          const match = combined.match(regex);
          if (match && match[1]) {
            const extractedName = match[1].trim().replace(/^["']|["']$/g, '');
            if (!signatureInfo) {
              signatureInfo = {
                name: extractedName,
                firstName: extractedName.split(' ')[0],
                lastName: extractedName.split(' ').slice(1).join(' '),
              };
            } else if (!signatureInfo.name) {
              signatureInfo.name = extractedName;
              signatureInfo.firstName = extractedName.split(' ')[0];
              signatureInfo.lastName = extractedName.split(' ').slice(1).join(' ');
            }
          }
        }
      }

      if (signatureInfo) {
        contact.name = signatureInfo.name || contact.name;
        contact.firstName = signatureInfo.firstName;
        contact.lastName = signatureInfo.lastName;
        contact.company = signatureInfo.company;
        contact.title = signatureInfo.title;
        contact.phone = signatureInfo.phone;
        contact.linkedin = signatureInfo.linkedin;
        contact.address = signatureInfo.address;
        enriched++;
      }
    }));

    if ((i + batchSize) % 50 === 0 || i + batchSize >= allContacts.length) {
      console.log(`   Processed ${Math.min(i + batchSize, allContacts.length)}/${allContacts.length} contacts`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`   ✓ Enriched ${enriched} contacts with signature data`);

  // Sort by total emails
  allContacts.sort((a, b) => b.totalEmailCount - a.totalEmailCount);

  // Write master CSV
  const csvPath = path.join(process.cwd(), 'extracted-contacts-all-users.csv');
  const headers = [
    'Email', 'Full Name', 'First Name', 'Last Name', 'Company', 'Job Title',
    'Phone', 'LinkedIn', 'Address', 'Total Emails', 'Initiated Emails', 'Reply Emails',
    'First Contact', 'Last Contact', 'Source Users', 'Sample Email Subjects',
  ];

  const csvLines = [headers.join(',')];
  for (const contact of allContacts) {
    csvLines.push([
      escapeCSV(contact.email),
      escapeCSV(contact.name || ''),
      escapeCSV(contact.firstName || ''),
      escapeCSV(contact.lastName || ''),
      escapeCSV(contact.company || ''),
      escapeCSV(contact.title || ''),
      escapeCSV(contact.phone || ''),
      escapeCSV(contact.linkedin || ''),
      escapeCSV(contact.address || ''),
      escapeCSV(contact.totalEmailCount),
      escapeCSV(contact.initiatedEmailCount),
      escapeCSV(contact.replyEmailCount),
      escapeCSV(contact.firstContactDate.toISOString().split('T')[0]),
      escapeCSV(contact.lastContactDate.toISOString().split('T')[0]),
      escapeCSV(contact.sourceUsers.join('; ')),
      escapeCSV(contact.sampleSubjects.join(' | ')),
    ].join(','));
  }

  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');

  // Print summary
  const withName = allContacts.filter(c => c.firstName && c.lastName).length;
  const withCompany = allContacts.filter(c => c.company).length;
  const withPhone = allContacts.filter(c => c.phone).length;
  const withTitle = allContacts.filter(c => c.title).length;
  const multiUser = allContacts.filter(c => c.sourceUsers.length > 1).length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 MULTI-USER CONTACT EXTRACTION SUMMARY');
  console.log('='.repeat(60));

  console.log('\nPER-USER BREAKDOWN:');
  for (const stat of perUserStats) {
    console.log(`   ${stat.name}: ${stat.sent} sent emails → ${stat.uniqueRecipients} unique recipients`);
  }

  console.log(`\nTOTAL RESULTS:`);
  console.log(`   📧 Total sent emails analyzed: ${perUserStats.reduce((s, u) => s + u.sent, 0)}`);
  console.log(`   👥 Total unique contacts: ${allContacts.length}`);
  console.log(`   📝 Enriched with signature data: ${enriched}`);
  console.log(`   🔗 Contacted by multiple users: ${multiUser}`);

  console.log(`\nDATA COMPLETENESS:`);
  console.log(`   • Full name: ${withName}/${allContacts.length} (${Math.round(withName / allContacts.length * 100)}%)`);
  console.log(`   • Company: ${withCompany}/${allContacts.length} (${Math.round(withCompany / allContacts.length * 100)}%)`);
  console.log(`   • Job title: ${withTitle}/${allContacts.length} (${Math.round(withTitle / allContacts.length * 100)}%)`);
  console.log(`   • Phone: ${withPhone}/${allContacts.length} (${Math.round(withPhone / allContacts.length * 100)}%)`);

  console.log(`\nENGAGEMENT TIERS:`);
  console.log(`   • VIP (10+ emails): ${allContacts.filter(c => c.totalEmailCount >= 10).length}`);
  console.log(`   • Active (5-9 emails): ${allContacts.filter(c => c.totalEmailCount >= 5 && c.totalEmailCount < 10).length}`);
  console.log(`   • Regular (2-4 emails): ${allContacts.filter(c => c.totalEmailCount >= 2 && c.totalEmailCount < 5).length}`);
  console.log(`   • Minimal (1 email): ${allContacts.filter(c => c.totalEmailCount === 1).length}`);

  console.log(`\n📄 CSV exported to: ${csvPath}`);
  console.log('='.repeat(60) + '\n');
}

extractAllContacts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
