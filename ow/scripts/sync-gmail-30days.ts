/**
 * Sync Gmail messages from the last 30 days
 * Vectorize and store in PostgreSQL
 * 
 * Usage:
 *   npx tsx scripts/sync-gmail-30days.ts
 */

import { PrismaClient } from '@prisma/client';
import { getServiceAccountClient, getGmailClient } from '../lib/google';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DAYS_BACK = 30;

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function syncGmailLast30Days() {
  console.log('\n📧 GMAIL SYNC - LAST 30 DAYS');
  console.log('='.repeat(50));
  
  try {
    const auth = getServiceAccountClient();
    const gmail = await getGmailClient(auth);
    
    // Calculate date 30 days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - DAYS_BACK);
    const afterDate = startDate.toISOString().split('T')[0].replace(/-/g, '/');
    const query = `after:${afterDate}`;
    
    console.log(`📅 Fetching emails from last ${DAYS_BACK} days (after ${afterDate})`);
    
    // Fetch all message IDs with pagination
    console.log('\n🔍 Discovering messages...');
    let allMessages: { id: string; threadId?: string }[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;
    
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
      pageCount++;
      
      console.log(`   Page ${pageCount}: Found ${messages.length} messages (Total: ${allMessages.length})`);
      
      // Small delay between pagination requests
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
      console.log('\n✅ All emails from last 30 days already synced!');
      return;
    }
    
    console.log('\n🚀 Starting import...\n');
    
    let synced = 0;
    let errors = 0;
    const startTime = Date.now();
    
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
        
        // Progress updates
        if (synced % 10 === 0 || synced === newMessages.length) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (synced / parseFloat(elapsed)).toFixed(1);
          const remaining = Math.ceil((newMessages.length - synced) / parseFloat(rate));
          console.log(`   ✓ ${synced}/${newMessages.length} emails (${rate}/sec, ~${remaining}s remaining)`);
        }
        
        // Rate limiting - Gmail API has quotas
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err: any) {
        errors++;
        if (errors <= 5) {
          console.error(`   ✗ Error on message ${message.id}: ${err.message}`);
        } else if (errors === 6) {
          console.error('   ... suppressing further errors');
        }
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ GMAIL SYNC COMPLETE');
    console.log('='.repeat(50));
    console.log(`   📥 Synced: ${synced} new emails`);
    console.log(`   ⏭️  Skipped: ${existingSet.size} existing emails`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   ⏱️  Time: ${totalTime} seconds`);
    console.log(`   📅 Date Range: Last ${DAYS_BACK} days`);
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('Error syncing Gmail:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncGmailLast30Days().catch(console.error);

