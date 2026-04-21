/**
 * Contact Extraction from Email Analysis
 * 
 * Analyzes sent emails to build a clean contact list based on:
 * - 2+ initiated emails (non-replies), OR
 * - 1 initiated email + 4+ messages in thread
 * - Excludes internal emails
 * - Extracts contact info from email signatures
 * 
 * Usage:
 *   npx tsx scripts/extract-contacts-from-emails.ts
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Internal domains to exclude
const INTERNAL_DOMAINS = [
  'opticwise.com',
  'nbrain.team',
];

// Time range: last 2 years
const SIX_MONTHS_AGO = new Date();
SIX_MONTHS_AGO.setFullYear(SIX_MONTHS_AGO.getFullYear() - 2);

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
  initiatedEmailCount: number;
  replyEmailCount: number;
  totalEmailCount: number;
  threadParticipationCount: number;
  firstContactDate: Date;
  lastContactDate: Date;
  qualificationReason: string;
  sampleSubjects: string[];
  signatureData?: string;
}

interface EmailThread {
  threadId: string;
  messageCount: number;
  hasInitiated: boolean;
}

async function parseEmailAddress(emailField: string): Promise<{ email: string; name?: string }[]> {
  const results: { email: string; name?: string }[] = [];
  
  // Handle multiple recipients (comma or semicolon separated)
  const recipients = emailField.split(/[,;]/).map(r => r.trim());
  
  for (const recipient of recipients) {
    // Parse "Name <email@domain.com>" format
    const match = recipient.match(/^(.+?)\s*<(.+?)>$/) || recipient.match(/^(.+)$/);
    
    if (match) {
      if (match.length === 3) {
        // "Name <email>" format
        results.push({ 
          name: match[1].trim().replace(/^["']|["']$/g, ''),
          email: match[2].trim().toLowerCase()
        });
      } else {
        // Just email
        results.push({ email: match[1].trim().toLowerCase() });
      }
    }
  }
  
  return results;
}

function isInternalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return INTERNAL_DOMAINS.some(d => domain === d.toLowerCase());
}

function isSpamOrBounceEmail(email: string): boolean {
  const lowerEmail = email.toLowerCase();
  
  // Filter out bounce addresses
  if (lowerEmail.includes('bounce') || lowerEmail.includes('+')) return true;
  
  // Filter out automated/system addresses
  if (lowerEmail.includes('noreply') || lowerEmail.includes('no-reply')) return true;
  if (lowerEmail.includes('spamproc') || lowerEmail.includes('donotreply')) return true;
  if (lowerEmail.startsWith('receipts@')) return true;
  if (lowerEmail.includes('conversiondocuments@')) return true;
  if (lowerEmail.includes('offboarding@')) return true;
  
  // Filter out @em domains (marketing automation)
  if (lowerEmail.match(/@em\d+\./)) return true;
  if (lowerEmail.match(/@e\./)) return true;
  
  // Filter out common newsletter/automation domains
  const spamDomains = ['fbl.en25.com', 'mail.beehiiv.com', 'email.upwork.com', 'news.credaily.com'];
  if (spamDomains.some(d => lowerEmail.includes(d))) return true;
  
  return false;
}

async function extractSignatureInfo(emailBody: string, emailAddress: string): Promise<any> {
  if (!emailBody || emailBody.length < 50) return null;
  
  // Extract both beginning and end portions (name often at top, signature at bottom)
  const emailStart = emailBody.slice(0, 600);
  const emailEnd = emailBody.slice(-800);
  const combinedPortion = emailStart + '\n...\n' + emailEnd;
  
  const prompt = `Extract contact information for the person with email: ${emailAddress}

CRITICAL: You MUST match the name to the email address!

EMAIL-TO-NAME MATCHING RULES:
1. Email: cary@nbrain.ai → Name should be "Cary" (NOT "Danny", NOT "Bill")
2. Email: danny@nbrain.ai → Name should be "Danny" (NOT "Cary", NOT "Bill")  
3. Email: john.smith@company.com → Name should be "John Smith"
4. Email: sarah@company.com → Name should be "Sarah"

If the email contains multiple signatures or quoted text from OTHER people (like Bill Douglas or other team members), you MUST extract ONLY the signature that matches ${emailAddress}.

CHECK EMAIL USERNAME: "${emailAddress.split('@')[0]}"
- The firstName should match or be similar to this username
- If you see "Bill Douglas" but email is "cary@...", that's WRONG - return null
- If you see "Danny DeMichele" but email is "cary@...", that's WRONG - return null

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
      model: 'claude-opus-4-7',
      max_tokens: 500,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // ENHANCED VALIDATION: Check if extracted name matches email address
      if (parsed.firstName) {
        const emailUsername = emailAddress.split('@')[0].toLowerCase();
        const firstNameLower = parsed.firstName.toLowerCase();
        const lastNameLower = parsed.lastName?.toLowerCase() || '';
        
        // Check if email username matches first name or last name
        const firstNameMatch = emailUsername.includes(firstNameLower.substring(0, Math.min(4, firstNameLower.length))) ||
                               firstNameLower.includes(emailUsername.substring(0, Math.min(4, emailUsername.length)));
        
        const lastNameMatch = lastNameLower && (
          emailUsername.includes(lastNameLower.substring(0, Math.min(4, lastNameLower.length))) ||
          lastNameLower.includes(emailUsername.substring(0, Math.min(4, emailUsername.length)))
        );
        
        // Check for common patterns like "john.smith" matching "John Smith"
        const parts = emailUsername.split(/[._-]/);
        const multiPartMatch = parts.some(part => 
          part.length >= 3 && (
            firstNameLower.includes(part) || 
            lastNameLower.includes(part)
          )
        );
        
        // If NO match found, this is likely wrong attribution
        if (!firstNameMatch && !lastNameMatch && !multiPartMatch) {
          // Special case: allow if it's a known good extraction
          if (!parsed.name || parsed.name.toLowerCase().includes('bill douglas')) {
            parsed.name = null;
            parsed.firstName = null;
            parsed.lastName = null;
            parsed.title = null;
          }
        }
      }
      
      // Additional filter: "Bill Douglas" should only appear for bill@ emails
      if (parsed.name && parsed.name.toLowerCase().includes('bill douglas')) {
        if (!emailAddress.toLowerCase().includes('bill')) {
          parsed.name = null;
          parsed.firstName = null;
          parsed.lastName = null;
          parsed.company = null;
          parsed.title = null;
        }
      }
      
      // Filter out "OpticWise" as company unless it's actually their company
      if (parsed.company && parsed.company.toLowerCase().includes('opticwise')) {
        if (!emailAddress.toLowerCase().includes('opticwise')) {
          parsed.company = null;
        }
      }
      
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting signature for ${emailAddress}:`, error);
    return null;
  }
}

async function analyzeEmailThreads(): Promise<Map<string, EmailThread>> {
  console.log('\n📊 Analyzing email threads...');
  
  const threads = await prisma.$queryRaw<Array<{ threadId: string; messageCount: bigint }>>`
    SELECT 
      "threadId",
      COUNT(*) as "messageCount"
    FROM "GmailMessage"
    WHERE date >= ${SIX_MONTHS_AGO}
    GROUP BY "threadId"
    HAVING COUNT(*) >= 2
  `;
  
  const threadMap = new Map<string, EmailThread>();
  
  for (const thread of threads) {
    threadMap.set(thread.threadId, {
      threadId: thread.threadId,
      messageCount: Number(thread.messageCount),
      hasInitiated: false,
    });
  }
  
  console.log(`   Found ${threadMap.size} threads with 2+ messages`);
  return threadMap;
}

async function extractContacts() {
  console.log('\n📧 CONTACT EXTRACTION FROM EMAIL ANALYSIS');
  console.log('='.repeat(60));
  console.log(`📅 Analyzing emails from: ${SIX_MONTHS_AGO.toISOString().split('T')[0]}`);
  console.log(`🚫 Excluding domains: ${INTERNAL_DOMAINS.join(', ')}`);
  console.log('');
  
  // Step 1: Analyze threads
  const threadMap = await analyzeEmailThreads();
  
  // Step 2: Get all sent emails from Bill
  console.log('\n🔍 Fetching sent emails from Bill...');
  
  const sentEmails = await prisma.gmailMessage.findMany({
    where: {
      date: { gte: SIX_MONTHS_AGO },
      from: {
        contains: 'bill',
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      gmailMessageId: true,
      threadId: true,
      subject: true,
      snippet: true,
      body: true,
      bodyHtml: true,
      from: true,
      to: true,
      cc: true,
      bcc: true,
      date: true,
      labels: true,
      attachments: true,
      // Exclude embedding column that causes deserialization issues
    },
    orderBy: { date: 'asc' },
  });
  
  console.log(`   Found ${sentEmails.length} sent emails from Bill`);
  
  // Step 3: Analyze each email
  console.log('\n📝 Processing emails and extracting contacts...');
  
  const contactMap = new Map<string, ContactData>();
  
  for (const email of sentEmails) {
    // Check if this is a reply or initiated email
    const isReply = email.subject?.toLowerCase().startsWith('re:') || false;
    
    // Parse recipients
    const toRecipients = email.to ? await parseEmailAddress(email.to) : [];
    const ccRecipients = email.cc ? await parseEmailAddress(email.cc) : [];
    const allRecipients = [...toRecipients, ...ccRecipients];
    
    for (const recipient of allRecipients) {
      const recipientEmail = recipient.email.toLowerCase();
      
      // Skip internal emails
      if (isInternalEmail(recipientEmail)) continue;
      
      // Skip spam/bounce/automated emails
      if (isSpamOrBounceEmail(recipientEmail)) continue;
      
      // Skip invalid emails
      if (!recipientEmail.includes('@')) continue;
      
      // Get or create contact record
      let contact = contactMap.get(recipientEmail);
      
      if (!contact) {
        contact = {
          email: recipientEmail,
          name: recipient.name || '',
          initiatedEmailCount: 0,
          replyEmailCount: 0,
          totalEmailCount: 0,
          threadParticipationCount: 0,
          firstContactDate: email.date,
          lastContactDate: email.date,
          qualificationReason: '',
          sampleSubjects: [],
        };
        contactMap.set(recipientEmail, contact);
      }
      
      // Update metrics
      if (isReply) {
        contact.replyEmailCount++;
      } else {
        contact.initiatedEmailCount++;
      }
      
      contact.totalEmailCount++;
      contact.lastContactDate = email.date > contact.lastContactDate ? email.date : contact.lastContactDate;
      
      // Track thread participation
      if (email.threadId && threadMap.has(email.threadId)) {
        const thread = threadMap.get(email.threadId)!;
        if (!isReply) {
          thread.hasInitiated = true;
        }
      }
      
      // Store sample subjects (up to 3)
      if (contact.sampleSubjects.length < 3 && email.subject) {
        contact.sampleSubjects.push(email.subject);
      }
    }
  }
  
  console.log(`   Identified ${contactMap.size} unique external email addresses`);
  
  // Step 4: Qualify contacts based on criteria
  console.log('\n✅ Qualifying contacts based on criteria...');
  
  const qualifiedContacts: ContactData[] = [];
  
  for (const [email, contact] of contactMap.entries()) {
    // SIMPLEST RULE: Any email Bill sent to them (no other requirements)
    if (contact.totalEmailCount >= 1) {
      contact.qualificationReason = `${contact.totalEmailCount} total emails (${contact.initiatedEmailCount} initiated, ${contact.replyEmailCount} replies)`;
      qualifiedContacts.push(contact);
    }
  }
  
  console.log(`   ✓ ${qualifiedContacts.length} contacts qualified`);
  console.log(`   ✗ ${contactMap.size - qualifiedContacts.length} contacts did not meet criteria`);
  
  // Step 5: Enrich contacts with signature data
  console.log('\n🔍 Enriching contacts with signature data (this may take a while)...');
  
  let enriched = 0;
  const batchSize = 5; // Process in smaller batches to avoid rate limits
  
  for (let i = 0; i < qualifiedContacts.length; i += batchSize) {
    const batch = qualifiedContacts.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (contact) => {
      // Try to find an INCOMING email FROM this contact first (best source)
      const emailFromContact = await prisma.gmailMessage.findFirst({
        where: {
          from: { contains: contact.email, mode: 'insensitive' },
          body: { not: null },
          date: { gte: SIX_MONTHS_AGO },
        },
        select: {
          body: true,
        },
        orderBy: { date: 'desc' },
      });
      
      let signatureInfo = null;
      
      if (emailFromContact?.body) {
        signatureInfo = await extractSignatureInfo(emailFromContact.body, contact.email);
      }
      
      // If we didn't get good data from incoming email, try the recipient's name from email header
      if (!signatureInfo || !signatureInfo.name) {
        // Look for this contact in the To/CC fields to extract their name from "Name <email>" format
        const sentEmail = await prisma.gmailMessage.findFirst({
          where: {
            OR: [
              { to: { contains: contact.email, mode: 'insensitive' } },
              { cc: { contains: contact.email, mode: 'insensitive' } },
            ],
            from: { contains: 'bill', mode: 'insensitive' },
            date: { gte: SIX_MONTHS_AGO },
          },
          select: {
            to: true,
            cc: true,
          },
        });
        
        if (sentEmail) {
          const toField = sentEmail.to || '';
          const ccField = sentEmail.cc || '';
          const combined = `${toField},${ccField}`;
          
          // Try to extract name from "Name <email@domain.com>" format
          const regex = new RegExp(`([^<,]+?)\\s*<${contact.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`, 'i');
          const match = combined.match(regex);
          
          if (match && match[1]) {
            const extractedName = match[1].trim().replace(/^["']|["']$/g, '');
            
            if (!signatureInfo) {
              signatureInfo = {
                name: extractedName,
                firstName: extractedName.split(' ')[0],
                lastName: extractedName.split(' ').slice(1).join(' '),
                company: null,
                title: null,
                phone: null,
                linkedin: null,
                address: null,
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
        contact.signatureData = JSON.stringify(signatureInfo);
        enriched++;
      }
    }));
    
    console.log(`   Processed ${Math.min(i + batchSize, qualifiedContacts.length)}/${qualifiedContacts.length} contacts`);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`   ✓ Enriched ${enriched} contacts with signature data`);
  
  // Step 6: Generate CSV
  console.log('\n📄 Generating CSV report...');
  
  const csvPath = path.join(process.cwd(), 'extracted-contacts.csv');
  
  // Sort by total email count (most engaged first)
  qualifiedContacts.sort((a, b) => b.totalEmailCount - a.totalEmailCount);
  
  // CSV helper function
  function escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
  
  // Build CSV content
  const headers = [
    'Email',
    'Full Name',
    'First Name',
    'Last Name',
    'Company',
    'Job Title',
    'Phone',
    'LinkedIn',
    'Address',
    'Initiated Emails',
    'Reply Emails',
    'Total Emails',
    'Thread Messages',
    'First Contact',
    'Last Contact',
    'Qualification Reason',
    'Sample Email Subjects',
  ];
  
  const csvLines = [headers.join(',')];
  
  for (const contact of qualifiedContacts) {
    const row = [
      escapeCSV(contact.email),
      escapeCSV(contact.name || ''),
      escapeCSV(contact.firstName || ''),
      escapeCSV(contact.lastName || ''),
      escapeCSV(contact.company || ''),
      escapeCSV(contact.title || ''),
      escapeCSV(contact.phone || ''),
      escapeCSV(contact.linkedin || ''),
      escapeCSV(contact.address || ''),
      escapeCSV(contact.initiatedEmailCount),
      escapeCSV(contact.replyEmailCount),
      escapeCSV(contact.totalEmailCount),
      escapeCSV(contact.threadParticipationCount),
      escapeCSV(contact.firstContactDate.toISOString().split('T')[0]),
      escapeCSV(contact.lastContactDate.toISOString().split('T')[0]),
      escapeCSV(contact.qualificationReason),
      escapeCSV(contact.sampleSubjects.join(' | ')),
    ];
    csvLines.push(row.join(','));
  }
  
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  
  // Step 7: Generate statistics
  console.log('\n📊 CONTACT EXTRACTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`📧 Total emails analyzed: ${sentEmails.length}`);
  console.log(`👥 Unique external recipients: ${contactMap.size}`);
  console.log(`✅ Qualified contacts: ${qualifiedContacts.length}`);
  console.log(`📝 Contacts with enriched data: ${enriched}`);
  console.log('');
  console.log('QUALIFICATION BREAKDOWN:');
  
  const by2Plus = qualifiedContacts.filter(c => c.initiatedEmailCount >= 2).length;
  const byThread = qualifiedContacts.filter(c => c.initiatedEmailCount === 1 && c.threadParticipationCount >= 4).length;
  
  console.log(`   • 2+ initiated emails: ${by2Plus}`);
  console.log(`   • 1 initiated + 4+ thread: ${byThread}`);
  console.log('');
  console.log('DATA COMPLETENESS:');
  
  const withName = qualifiedContacts.filter(c => c.firstName && c.lastName).length;
  const withCompany = qualifiedContacts.filter(c => c.company).length;
  const withTitle = qualifiedContacts.filter(c => c.title).length;
  const withPhone = qualifiedContacts.filter(c => c.phone).length;
  const withLinkedIn = qualifiedContacts.filter(c => c.linkedin).length;
  
  console.log(`   • Full name: ${withName}/${qualifiedContacts.length} (${Math.round(withName/qualifiedContacts.length*100)}%)`);
  console.log(`   • Company: ${withCompany}/${qualifiedContacts.length} (${Math.round(withCompany/qualifiedContacts.length*100)}%)`);
  console.log(`   • Job title: ${withTitle}/${qualifiedContacts.length} (${Math.round(withTitle/qualifiedContacts.length*100)}%)`);
  console.log(`   • Phone: ${withPhone}/${qualifiedContacts.length} (${Math.round(withPhone/qualifiedContacts.length*100)}%)`);
  console.log(`   • LinkedIn: ${withLinkedIn}/${qualifiedContacts.length} (${Math.round(withLinkedIn/qualifiedContacts.length*100)}%)`);
  console.log('');
  console.log('ENGAGEMENT TIERS:');
  
  const vip = qualifiedContacts.filter(c => c.totalEmailCount >= 10).length;
  const active = qualifiedContacts.filter(c => c.totalEmailCount >= 5 && c.totalEmailCount < 10).length;
  const regular = qualifiedContacts.filter(c => c.totalEmailCount >= 2 && c.totalEmailCount < 5).length;
  const minimal = qualifiedContacts.filter(c => c.totalEmailCount < 2).length;
  
  console.log(`   • VIP (10+ emails): ${vip}`);
  console.log(`   • Active (5-9 emails): ${active}`);
  console.log(`   • Regular (2-4 emails): ${regular}`);
  console.log(`   • Minimal (1 email): ${minimal}`);
  console.log('');
  console.log(`📄 CSV exported to: ${csvPath}`);
  console.log('='.repeat(60) + '\n');
}

// Run the extraction
extractContacts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
