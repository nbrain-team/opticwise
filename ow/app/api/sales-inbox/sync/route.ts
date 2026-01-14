import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServiceAccountClient, getGmailClient } from '@/lib/google';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

/**
 * POST /api/sales-inbox/sync
 * 
 * Syncs Gmail messages with the sales inbox by:
 * 1. Fetching new emails from Gmail (last 24 hours by default)
 * 2. Linking emails to contact records based on email addresses
 * 3. Creating EmailThread and EmailMessage records for the sales inbox
 * 4. Storing GmailMessage records for AI search
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting sales inbox sync...');
    
    // Get sync parameters
    const body = await request.json().catch(() => ({}));
    const hoursBack = body.hoursBack || 24; // Default: last 24 hours
    
    // Authenticate with Gmail
    const auth = getServiceAccountClient();
    const gmail = await getGmailClient(auth);
    
    // Build query for recent emails
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hoursBack);
    const afterDate = startDate.toISOString().split('T')[0].replace(/-/g, '/');
    const query = `after:${afterDate}`;
    
    console.log(`📅 Fetching emails from last ${hoursBack} hours (after ${afterDate})`);
    
    // Fetch message IDs
    let allMessages: { id: string; threadId?: string }[] = [];
    let pageToken: string | undefined;
    
    do {
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 500,
        q: query,
        pageToken,
      });
      
      const messages = listResponse.data.messages || [];
      allMessages = allMessages.concat(messages as { id: string; threadId?: string }[]);
      pageToken = listResponse.data.nextPageToken || undefined;
    } while (pageToken);
    
    console.log(`✅ Found ${allMessages.length} messages`);
    
    // Check which messages we already have
    const existingGmailIds = await prisma.gmailMessage.findMany({
      select: { gmailMessageId: true },
    });
    const existingSet = new Set(existingGmailIds.map(e => e.gmailMessageId));
    
    const newMessages = allMessages.filter(m => !existingSet.has(m.id));
    console.log(`📥 New messages to process: ${newMessages.length}`);
    
    if (newMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new emails to sync',
        synced: 0,
        skipped: existingSet.size,
      });
    }
    
    // Get all contacts with email addresses for matching
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
    
    // Create email lookup map
    const emailToContact = new Map<string, typeof contacts[0]>();
    contacts.forEach(contact => {
      [contact.email, contact.emailWork, contact.emailHome, contact.emailOther].forEach(email => {
        if (email) {
          emailToContact.set(email.toLowerCase(), contact);
        }
      });
    });
    
    console.log(`📇 Loaded ${contacts.length} contacts with ${emailToContact.size} email addresses`);
    
    let synced = 0;
    let linked = 0;
    let errors = 0;
    
    // Process each new message
    for (const message of newMessages) {
      if (!message.id) continue;
      
      try {
        // Get full message details
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
        
        // Extract email addresses from headers
        const extractEmails = (header: string): string[] => {
          const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
          return (header.match(emailRegex) || []).map(e => e.toLowerCase());
        };
        
        const fromEmails = extractEmails(from);
        const toEmails = extractEmails(to);
        const ccEmails = extractEmails(cc);
        const allEmails = [...fromEmails, ...toEmails, ...ccEmails];
        
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
        
        // Generate embedding
        const textForEmbedding = `Subject: ${subject}\nFrom: ${from}\nBody: ${body || bodyHtml}`.slice(0, 8000);
        const embedding = await generateEmbedding(textForEmbedding);
        
        // Extract attachments
        type AttachmentPart = {
          filename?: string;
          mimeType?: string;
          body?: { size?: number; attachmentId?: string };
          parts?: AttachmentPart[];
        };
        
        const attachments: Array<{
          filename: string;
          mimeType: string;
          size: number;
          attachmentId: string;
        }> = [];
        
        const extractAttachments = (part: AttachmentPart): void => {
          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType || '',
              size: part.body.size || 0,
              attachmentId: part.body.attachmentId,
            });
          }
          if (part.parts) {
            part.parts.forEach(extractAttachments);
          }
        };
        
        if (fullMessage.data.payload) {
          extractAttachments(fullMessage.data.payload as AttachmentPart);
        }
        
        // Determine if this is incoming or outgoing
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
            attachments: attachments.length > 0 ? attachments : null,
            vectorized: true,
            embedding: `[${embedding.join(',')}]`,
            personId: matchedContact?.id,
            organizationId: matchedContact?.organizationId,
          },
        });
        
        // If we found a matching contact, create/update EmailThread and EmailMessage
        if (matchedContact) {
          // Find or create EmailThread
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
          
          // Create EmailMessage
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
          
          // Update thread timestamp
          await prisma.emailThread.update({
            where: { id: emailThread.id },
            data: { updatedAt: new Date() },
          });
          
          linked++;
        }
        
        synced++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        errors++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`❌ Error processing message ${message.id}:`, errorMessage);
      }
    }
    
    console.log('✅ Sync complete');
    console.log(`   📥 Synced: ${synced} messages`);
    console.log(`   🔗 Linked: ${linked} to contacts`);
    console.log(`   ❌ Errors: ${errors}`);
    
    return NextResponse.json({
      success: true,
      synced,
      linked,
      errors,
      total: allMessages.length,
      skipped: existingSet.size,
    });
    
  } catch (error) {
    console.error('Error syncing sales inbox:', error);
    return NextResponse.json(
      { error: 'Failed to sync sales inbox', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sales-inbox/sync
 * 
 * Trigger sync via GET request (for cron jobs)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret if provided
  const cronSecret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Call POST handler
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ hoursBack: 24 }),
  });
  
  return POST(mockRequest);
}

