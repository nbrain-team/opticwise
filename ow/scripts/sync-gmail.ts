/**
 * Sync Gmail messages from the last 6 months
 * Vectorize and store in PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { getServiceAccountClient, getGmailClient } from '../lib/google';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function syncGmail() {
  console.log('Starting Gmail sync...');
  
  try {
    const auth = getServiceAccountClient();
    const gmail = await getGmailClient(auth);
    
    // Get messages from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const afterDate = sixMonthsAgo.toISOString().split('T')[0].replace(/-/g, '/');
    
    console.log(`Fetching messages after ${afterDate}...`);
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 500,
      q: `after:${afterDate}`,
    });
    
    const messages = listResponse.data.messages || [];
    console.log(`Found ${messages.length} messages to sync`);
    
    let synced = 0;
    let skipped = 0;
    
    for (const message of messages) {
      if (!message.id) continue;
      
      // Check if already synced
      const existing = await prisma.gmailMessage.findUnique({
        where: { gmailMessageId: message.id },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
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
      
      // Extract body
      let body = '';
      let bodyHtml = '';
      
      const extractBody = (part: any) => {
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
        extractBody(fullMessage.data.payload);
      }
      
      // Generate embedding for vectorization
      const textForEmbedding = `Subject: ${subject}\nFrom: ${from}\nBody: ${body || bodyHtml}`.slice(0, 8000);
      const embedding = await generateEmbedding(textForEmbedding);
      
      // Extract attachments metadata
      const attachments: any[] = [];
      const extractAttachments = (part: any) => {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId,
          });
        }
        if (part.parts) {
          part.parts.forEach(extractAttachments);
        }
      };
      
      if (fullMessage.data.payload) {
        extractAttachments(fullMessage.data.payload);
      }
      
      // Save to database
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
        },
      });
      
      synced++;
      
      if (synced % 10 === 0) {
        console.log(`Synced ${synced}/${messages.length} messages...`);
      }
      
      // Rate limiting - Gmail API has quotas
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nGmail sync complete:`);
    console.log(`- Synced: ${synced} new messages`);
    console.log(`- Skipped: ${skipped} existing messages`);
    console.log(`- Total: ${messages.length} messages processed`);
    
  } catch (error) {
    console.error('Error syncing Gmail:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncGmail().catch(console.error);

