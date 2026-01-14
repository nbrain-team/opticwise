/**
 * Sync Gmail to Sales Inbox
 * Creates both GmailMessage (for AI) and EmailThread/EmailMessage (for Sales Inbox UI)
 * 
 * Usage:
 *   npx tsx scripts/sync-sales-inbox.ts              # Default: 12 months
 *   npx tsx scripts/sync-sales-inbox.ts --months=6   # Last 6 months
 *   npx tsx scripts/sync-sales-inbox.ts --all        # All emails
 */

import { PrismaClient } from '@prisma/client';
import { getServiceAccountClient, getGmailClient } from '../lib/google';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Parse command line arguments
const args = process.argv.slice(2);
const monthsArg = args.find(a => a.startsWith('--months='));
const allArg = args.includes('--all');
const MONTHS_BACK = allArg ? null : (monthsArg ? parseInt(monthsArg.split('=')[1]) : 12);

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1024,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return empty embedding on error
    return new Array(1024).fill(0);
  }
}

async function syncSalesInbox() {
  console.log('\n📧 SALES INBOX SYNC');
  console.log('='.repeat(50));
  
  try {
    const auth = getServiceAccountClient();
    const gmail = await getGmailClient(auth);
    
    // Build query based on time range
    let query = '';
    if (MONTHS_BACK) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - MONTHS_BACK);
      const afterDate = startDate.toISOString().split('T')[0].replace(/-/g, '/');
      query = `after:${afterDate}`;
      console.log(`📅 Fetching emails from last ${MONTHS_BACK} months (after ${afterDate})`);
    } else {
      console.log('📅 Fetching ALL emails (no date filter)');
    }
    
    // Fetch all message IDs
    console.log('\n🔍 Discovering messages...');
    let allMessages: { id: string; threadId?: string }[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;
    
    do {
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 500,
        q: query || undefined,
        pageToken,
      });
      
      const messages = listResponse.data.messages || [];
      allMessages = allMessages.concat(messages as { id: string; threadId?: string }[]);
      pageToken = listResponse.data.nextPageToken || undefined;
      pageCount++;
      
      console.log(`   Page ${pageCount}: Found ${messages.length} messages (Total: ${allMessages.length})`);
      
      await new Promise(resolve => setTimeout(resolve, 50));
    } while (pageToken);
    
    console.log(`\n✅ Total messages discovered: ${allMessages.length}`);
    
    // Check existing messages
    const existingIds = await prisma.gmailMessage.findMany({
      select: { gmailMessageId: true },
    });
    const existingSet = new Set(existingIds.map(e => e.gmailMessageId));
    
    const newMessages = allMessages.filter(m => !existingSet.has(m.id));
    console.log(`📊 Already imported: ${existingSet.size}`);
    console.log(`📥 New to import: ${newMessages.length}`);
    
    if (newMessages.length === 0) {
      console.log('\n✅ All emails already synced!');
      return;
    }
    
    // Get all contacts for matching
    const contacts = await prisma.person.findMany({
      where: {
        OR: [
          { email: { not: null } },
          { emailWork: { not: null } },
          { emailHome: { not: null } },
          { emailOther: { not: null } },
        ],
      },
      select: {
        id: true,
        email: true,
        emailWork: true,
        emailHome: true,
        emailOther: true,
        firstName: true,
        lastName: true,
        organizationId: true,
      },
    });
    
    const emailToContact = new Map<string, typeof contacts[0]>();
    contacts.forEach(contact => {
      [contact.email, contact.emailWork, contact.emailHome, contact.emailOther].forEach(email => {
        if (email) {
          emailToContact.set(email.toLowerCase(), contact);
        }
      });
    });
    
    console.log(`📇 Loaded ${contacts.length} contacts with ${emailToContact.size} email addresses`);
    console.log('\n🚀 Starting import...\n');
    
    let synced = 0;
    let linked = 0;
    let errors = 0;
    const startTime = Date.now();
    
    for (const message of newMessages) {
      if (!message.id) continue;
      
      try {
        // Get full message
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });
        
        const headers = fullMessage.data.payload?.headers || [];
        const getHeader = (name: string) => 
          headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
        
        const subject = getHeader('Subject');
        const from = getHeader('From');
        const to = getHeader('To');
        const cc = getHeader('Cc');
        const date = getHeader('Date');
        
        // Extract emails
        const extractEmails = (header: string): string[] => {
          const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
          return (header.match(emailRegex) || []).map(e => e.toLowerCase());
        };
        
        const allEmails = [...extractEmails(from), ...extractEmails(to), ...extractEmails(cc)];
        
        // Find matching contact
        let matchedContact = null;
        for (const email of allEmails) {
          if (emailToContact.has(email)) {
            matchedContact = emailToContact.get(email);
            break;
          }
        }
        
        // Extract body
        let body = '';
        let bodyHtml = '';
        
        type MessagePart = {
          mimeType?: string;
          body?: { data?: string };
          parts?: MessagePart[];
        };
        
        const extractBody = (part: MessagePart): void => {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          if (part.mimeType === 'text/html' && part.body?.data) {
            bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          if (part.parts) {
            part.parts.forEach(extractBody);
          }
        };
        
        if (fullMessage.data.payload) {
          extractBody(fullMessage.data.payload as MessagePart);
        }
        
        // Generate embedding (skip on error)
        const textForEmbedding = `Subject: ${subject}\nFrom: ${from}\nBody: ${body || bodyHtml}`.slice(0, 8000);
        const embedding = await generateEmbedding(textForEmbedding);
        
        // Determine direction
        const isOutgoing = from.toLowerCase().includes('bill@opticwise.com');
        
        // Save GmailMessage
        await prisma.gmailMessage.create({
          data: {
            gmailMessageId: message.id,
            threadId: fullMessage.data.threadId || '',
            subject,
            snippet: fullMessage.data.snippet || '',
            body,
            bodyHtml,
            from,
            to,
            cc,
            date: date ? new Date(date) : new Date(),
            labels: JSON.stringify(fullMessage.data.labelIds || []),
            attachments: undefined,
            vectorized: true,
            embedding: `[${embedding.join(',')}]`,
            personId: matchedContact?.id,
            organizationId: matchedContact?.organizationId,
          },
        });
        
        // If matched contact, create EmailThread and EmailMessage
        if (matchedContact) {
          let emailThread = await prisma.emailThread.findFirst({
            where: {
              subject,
              personId: matchedContact.id,
            },
          });
          
          if (!emailThread) {
            emailThread = await prisma.emailThread.create({
              data: {
                subject: subject || '(No Subject)',
                personId: matchedContact.id,
                organizationId: matchedContact.organizationId,
              },
            });
          }
          
          await prisma.emailMessage.create({
            data: {
              threadId: emailThread.id,
              sender: from,
              recipients: to || '',
              cc: cc || '',
              body: bodyHtml || body || '',
              direction: isOutgoing ? 'OUTGOING' : 'INCOMING',
              sentAt: date ? new Date(date) : new Date(),
            },
          });
          
          await prisma.emailThread.update({
            where: { id: emailThread.id },
            data: { updatedAt: new Date() },
          });
          
          linked++;
        }
        
        synced++;
        
        if (synced % 25 === 0 || synced === newMessages.length) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (synced / parseFloat(elapsed)).toFixed(1);
          const remaining = Math.ceil((newMessages.length - synced) / parseFloat(rate));
          console.log(`   ✓ ${synced}/${newMessages.length} emails | ${linked} linked to contacts | ${rate}/sec | ~${remaining}s remaining`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        errors++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errors <= 5) {
          console.error(`   ✗ Error on message ${message.id}: ${errorMessage}`);
        } else if (errors === 6) {
          console.error('   ... suppressing further errors');
        }
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ SALES INBOX SYNC COMPLETE');
    console.log('='.repeat(50));
    console.log(`   📥 Synced: ${synced} new emails`);
    console.log(`   🔗 Linked: ${linked} to contacts (visible in Sales Inbox)`);
    console.log(`   ⏭️  Skipped: ${existingSet.size} existing emails`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   ⏱️  Time: ${totalTime} seconds`);
    console.log('='.repeat(50) + '\n');
    
    console.log('📍 View in Sales Inbox: https://opticwise-frontend.onrender.com/sales-inbox\n');
    
  } catch (error) {
    console.error('Error syncing sales inbox:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncSalesInbox().catch(console.error);

