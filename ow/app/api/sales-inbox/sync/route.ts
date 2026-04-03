import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServiceAccountClient, getGmailClient } from '@/lib/google';
import { updateActivityCounters } from '@/lib/activity-counters';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

/**
 * Sync Gmail for a single user.
 * Impersonates the user's @opticwise.com email via Google Workspace delegation.
 * All synced emails are tagged with syncUserId for data isolation.
 */
async function syncUserEmails(userId: string, userEmail: string, hoursBack: number) {
  console.log(`🔄 Syncing emails for ${userEmail} (userId: ${userId})...`);

  await prisma.user.update({
    where: { id: userId },
    data: { emailSyncStatus: 'syncing' },
  });

  try {
    const auth = getServiceAccountClient(userEmail);
    const gmail = await getGmailClient(auth);

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hoursBack);
    const afterDate = startDate.toISOString().split('T')[0].replace(/-/g, '/');
    const query = `after:${afterDate}`;

    console.log(`  📅 Fetching emails from last ${hoursBack} hours (after ${afterDate})`);

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

    console.log(`  ✅ Found ${allMessages.length} messages for ${userEmail}`);

    const existingGmailIds = await prisma.$queryRaw<Array<{ gmailMessageId: string }>>`
      SELECT "gmailMessageId" FROM "GmailMessage"
      WHERE "gmailMessageId" = ANY(${allMessages.map(m => m.id)}::text[])
    `;
    const existingSet = new Set(existingGmailIds.map(e => e.gmailMessageId));

    const newMessages = allMessages.filter(m => !existingSet.has(m.id));
    console.log(`  📥 New messages to process: ${newMessages.length}`);

    if (newMessages.length === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastEmailSync: new Date(), emailSyncStatus: 'ok' },
      });
      return { synced: 0, linked: 0, errors: 0, total: allMessages.length, skipped: existingSet.size };
    }

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
        id: true, email: true, emailWork: true, emailHome: true, emailOther: true,
        firstName: true, lastName: true, organizationId: true,
        deals: { where: { status: 'open' }, select: { id: true }, take: 1 },
      },
    });

    const emailToContact = new Map<string, typeof contacts[0]>();
    contacts.forEach(contact => {
      [contact.email, contact.emailWork, contact.emailHome, contact.emailOther].forEach(email => {
        if (email) emailToContact.set(email.toLowerCase(), contact);
      });
    });

    let synced = 0;
    let linked = 0;
    let errors = 0;
    const userEmailLower = userEmail.toLowerCase();

    for (const message of newMessages) {
      if (!message.id) continue;

      try {
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

        const extractEmails = (header: string): string[] => {
          const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
          return (header.match(emailRegex) || []).map(e => e.toLowerCase());
        };

        const fromEmails = extractEmails(from);
        const toEmails = extractEmails(to);
        const ccEmails = extractEmails(cc);
        const allEmails = [...fromEmails, ...toEmails, ...ccEmails];

        let matchedContact = null;
        for (const email of allEmails) {
          if (emailToContact.has(email)) {
            matchedContact = emailToContact.get(email);
            break;
          }
        }

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
          if (part.parts) part.parts.forEach(extractBody);
        };

        if (fullMessage.data.payload) {
          extractBody(fullMessage.data.payload as MessagePart);
        }

        let embedding: number[] | null = null;
        try {
          const textForEmbedding = `Subject: ${subject}\nFrom: ${from}\nBody: ${body || bodyHtml}`.slice(0, 8000);
          embedding = await generateEmbedding(textForEmbedding);
          if (embedding && embedding.length !== 1024) {
            console.warn(`  ⚠️ Unexpected embedding dimensions: ${embedding.length} (expected 1024), discarding`);
            embedding = null;
          }
        } catch {
          console.error(`  ⚠️ Embedding failed for message ${message.id}, storing without embedding`);
        }

        type AttachmentPart = {
          filename?: string;
          mimeType?: string;
          body?: { size?: number; attachmentId?: string };
          parts?: AttachmentPart[];
        };

        const attachments: Array<{ filename: string; mimeType: string; size: number; attachmentId: string }> = [];
        const extractAttachments = (part: AttachmentPart): void => {
          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType || '',
              size: part.body.size || 0,
              attachmentId: part.body.attachmentId,
            });
          }
          if (part.parts) part.parts.forEach(extractAttachments);
        };

        if (fullMessage.data.payload) {
          extractAttachments(fullMessage.data.payload as AttachmentPart);
        }

        const isOutgoing = from.toLowerCase().includes(userEmailLower);

        await prisma.$executeRawUnsafe(
          `INSERT INTO "GmailMessage" ("id", "gmailMessageId", "threadId", "subject", "snippet", "body", "bodyHtml", "from", "to", "cc", "date", "labels", "attachments", "vectorized", "embedding", "personId", "organizationId", "syncUserId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15::vector, $16, $17, $18, NOW(), NOW())
           ON CONFLICT ("gmailMessageId") DO UPDATE SET
             "syncUserId" = COALESCE("GmailMessage"."syncUserId", EXCLUDED."syncUserId"),
             "personId" = COALESCE(EXCLUDED."personId", "GmailMessage"."personId"),
             "organizationId" = COALESCE(EXCLUDED."organizationId", "GmailMessage"."organizationId"),
             "updatedAt" = NOW()`,
          crypto.randomUUID().replace(/-/g, '').slice(0, 25),
          message.id,
          fullMessage.data.threadId || '',
          subject,
          fullMessage.data.snippet || '',
          body,
          bodyHtml,
          from,
          to || null,
          cc || null,
          date ? new Date(date) : new Date(),
          JSON.stringify(fullMessage.data.labelIds || []),
          attachments.length > 0 ? JSON.stringify(attachments) : null,
          embedding ? true : false,
          embedding ? `[${embedding.join(',')}]` : null,
          matchedContact?.id || null,
          matchedContact?.organizationId || null,
          userId,
        );

        if (matchedContact) {
          let emailThread = await prisma.emailThread.findFirst({
            where: { subject, personId: matchedContact.id, syncUserId: userId },
          });

          if (!emailThread) {
            emailThread = await prisma.emailThread.create({
              data: {
                subject: subject || '(No Subject)',
                personId: matchedContact.id,
                organizationId: matchedContact.organizationId,
                syncUserId: userId,
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

          const emailDate = date ? new Date(date) : new Date();
          const activityDealId = matchedContact.deals?.[0]?.id || null;

          const existingActivity = await prisma.activity.findFirst({
            where: {
              type: 'email',
              subject: subject || '(No Subject)',
              personId: matchedContact.id,
              doneTime: emailDate,
            },
          });

          if (!existingActivity) {
            await prisma.activity.create({
              data: {
                subject: subject || '(No Subject)',
                note: `${isOutgoing ? 'Sent to' : 'Received from'}: ${isOutgoing ? to : from}`,
                type: 'email',
                status: 'done',
                dueDate: emailDate,
                doneTime: emailDate,
                personId: matchedContact.id,
                organizationId: matchedContact.organizationId || null,
                dealId: activityDealId,
                createdBy: `email-sync:${userEmail}`,
              },
            });

            await updateActivityCounters({
              personId: matchedContact.id,
              organizationId: matchedContact.organizationId,
              dealId: activityDealId,
            });
          }

          linked++;
        }

        synced++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        errors++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Error processing message ${message.id}:`, errorMessage);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastEmailSync: new Date(),
        emailSyncStatus: errors > 0 && synced === 0 ? 'error' : 'ok',
      },
    });

    console.log(`  ✅ Sync complete for ${userEmail}: ${synced} synced, ${linked} linked, ${errors} errors`);
    return { synced, linked, errors, total: allMessages.length, skipped: existingSet.size };
  } catch (error) {
    console.error(`  ❌ Sync failed for ${userEmail}:`, error);
    await prisma.user.update({
      where: { id: userId },
      data: { emailSyncStatus: 'error' },
    });
    throw error;
  }
}

/**
 * POST /api/sales-inbox/sync
 * 
 * Sync a specific user's emails or all enabled users.
 * Body: { userId?: string, hoursBack?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const hoursBack = body.hoursBack || 24;
    const targetUserId = body.userId;

    let usersToSync;

    if (targetUserId) {
      const user = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user || !user.isActive) {
        return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
      }
      if (!user.email.endsWith('@opticwise.com')) {
        return NextResponse.json({ error: 'Only @opticwise.com emails can be synced' }, { status: 400 });
      }
      usersToSync = [user];
    } else {
      usersToSync = await prisma.user.findMany({
        where: { emailSyncEnabled: true, isActive: true },
      });
    }

    if (usersToSync.length === 0) {
      return NextResponse.json({ success: true, message: 'No users with email sync enabled' });
    }

    const results: Record<string, unknown> = {};

    for (const user of usersToSync) {
      try {
        results[user.email] = await syncUserEmails(user.id, user.email, hoursBack);
      } catch (err) {
        results[user.email] = { error: err instanceof Error ? err.message : String(err) };
      }
    }

    return NextResponse.json({
      success: true,
      usersSynced: usersToSync.length,
      results,
      completedAt: new Date().toISOString(),
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
 * Trigger sync for all enabled users via cron
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ hoursBack: 24 }),
  });

  return POST(mockRequest);
}
