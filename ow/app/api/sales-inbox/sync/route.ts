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

// =============================================================
// Sprint 2 / 3.6 (iii) — auto-create Person rows from new senders
// -------------------------------------------------------------
// Background: until now, contact creation from Gmail was a manual CLI
// (`scripts/extract-contacts-from-emails.ts`) that never ran on production.
// As a result, every email from a sender who wasn't already a Contact was
// stored with `personId = null` and effectively invisible to CRM views.
//
// This block adds an in-sync auto-create step: after the existing
// `emailToContact` lookup fails for a message, we pick the most-informative
// external email on the message (sender for inbound, first recipient for
// outbound), apply the same deny-list the CLI script uses, and upsert a
// Person row. The freshly-created Person then becomes the message's
// `matchedContact` so the rest of the existing flow (EmailThread create,
// Activity insert, counters update) runs naturally.
//
// Patterns lifted verbatim from `scripts/extract-contacts-from-emails.ts`
// so the dashboard view and the auto-sync behave identically.
// =============================================================

const INTERNAL_DOMAINS = ['opticwise.com', 'nbrain.team', 'nbrain.ai', 'nbrain.io'];

function isInternalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return INTERNAL_DOMAINS.includes(domain);
}

function isSpamOrAutomation(email: string): boolean {
  const e = email.toLowerCase();
  if (e.includes('bounce')) return true;
  if (e.split('@')[0]?.includes('+')) return true;
  if (e.includes('noreply') || e.includes('no-reply') || e.includes('donotreply')) return true;
  if (e.includes('spamproc')) return true;
  if (e.startsWith('receipts@')) return true;
  if (e.startsWith('notifications@')) return true;
  if (e.includes('conversiondocuments@')) return true;
  if (e.includes('offboarding@')) return true;
  if (e.match(/@em\d+\./)) return true;
  if (e.match(/@e\d?\./)) return true;
  const spamDomains = [
    'fbl.en25.com',
    'mail.beehiiv.com',
    'email.upwork.com',
    'news.credaily.com',
  ];
  if (spamDomains.some((d) => e.includes(d))) return true;
  return false;
}

/**
 * Parse "Display Name <email@domain>" headers. Returns { firstName, lastName }
 * if a display name was present, else null. Quotes around the name are
 * tolerated.
 */
function parseDisplayName(headerValue: string): { firstName: string; lastName: string } | null {
  const m = headerValue.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>\s*$/);
  if (!m) return null;
  const name = m[1].trim();
  if (name.length === 0) return null;
  if (name.includes('@')) return null;
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

type ContactLike = {
  id: string;
  email: string | null;
  emailWork: string | null;
  emailHome: string | null;
  emailOther: string | null;
  firstName: string | null;
  lastName: string | null;
  organizationId: string | null;
  deals: { id: string }[];
};

/**
 * Try to upsert a Person for the most-informative external email on a Gmail
 * message. Returns the contact (existing-or-fresh) when one is created or
 * found, or null when every candidate is filtered out (internal team,
 * spam/automation, or matches the syncing user).
 *
 * Idempotency: keyed on `Person.email` (which is @unique). A second call with
 * the same email will return the existing row without creating a duplicate.
 */
async function tryAutoCreateContact(opts: {
  fromHeader: string;
  isOutgoing: boolean;
  fromEmails: string[];
  toEmails: string[];
  ccEmails: string[];
  userEmailLower: string;
}): Promise<ContactLike | null> {
  const externalCandidates = opts.isOutgoing
    ? [...opts.toEmails, ...opts.ccEmails]
    : opts.fromEmails;

  const candidate = externalCandidates
    .map((e) => e.toLowerCase())
    .find(
      (e) =>
        e !== opts.userEmailLower &&
        !isInternalEmail(e) &&
        !isSpamOrAutomation(e)
    );

  if (!candidate) return null;

  // Prefer the From header's display name when this is an inbound message
  // (sender's name lives there). For outbound messages we don't have a
  // reliable display name for the To recipient on this header, so we fall
  // back to the email username.
  const display = opts.isOutgoing ? null : parseDisplayName(opts.fromHeader);
  const username = candidate.split('@')[0] ?? '';
  const firstName = display?.firstName ?? username;
  const lastName = display?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || username;

  try {
    const person = await prisma.person.upsert({
      where: { email: candidate },
      update: {},
      create: {
        email: candidate,
        firstName,
        lastName,
        name: fullName,
        contactType: 'auto-extracted',
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
    return { ...person, deals: [] };
  } catch (err) {
    // Most likely cause is a unique-constraint race against a sibling sync
    // process. Re-fetch and use the existing row.
    console.warn(
      `  ⚠️ Auto-create raced or failed for ${candidate}:`,
      err instanceof Error ? err.message : err
    );
    try {
      const existing = await prisma.person.findUnique({
        where: { email: candidate },
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
      if (existing) return { ...existing, deals: [] };
    } catch {
      // fall through
    }
    return null;
  }
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
    let autoCreated = 0; // 3.6 (iii) — Person rows created in this run
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

        let matchedContact: ContactLike | null | undefined = null;
        for (const email of allEmails) {
          if (emailToContact.has(email)) {
            matchedContact = emailToContact.get(email);
            break;
          }
        }

        // 3.6 (iii) — when no existing contact matches, auto-create a Person
        // for the most-informative external party on this message. The new
        // Person is added to `emailToContact` so subsequent messages in this
        // run reuse it without another DB round-trip.
        if (!matchedContact) {
          const fromIsUser = from.toLowerCase().includes(userEmailLower);
          const created = await tryAutoCreateContact({
            fromHeader: from,
            isOutgoing: fromIsUser,
            fromEmails,
            toEmails,
            ccEmails,
            userEmailLower,
          });
          if (created) {
            matchedContact = created;
            autoCreated++;
            // Cache by every email field so subsequent messages hit the cache.
            for (const e of [
              created.email,
              created.emailWork,
              created.emailHome,
              created.emailOther,
            ]) {
              if (e) emailToContact.set(e.toLowerCase(), created);
            }
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
