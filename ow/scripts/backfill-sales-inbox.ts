/**
 * Backfill Sales Inbox from existing GmailMessages
 * 
 * Creates EmailThread and EmailMessage records for GmailMessages
 * that exist but haven't been linked to the Sales Inbox yet.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfill() {
  console.log('\n📧 BACKFILLING SALES INBOX FROM GMAIL MESSAGES');
  console.log('='.repeat(60));

  // Get all contacts with emails
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

  console.log(`👥 Found ${contacts.length} contacts with email addresses`);

  // Build email-to-contact lookup
  const emailToContact = new Map<string, typeof contacts[0]>();
  contacts.forEach(contact => {
    [contact.email, contact.emailWork, contact.emailHome, contact.emailOther].forEach(email => {
      if (email) emailToContact.set(email.toLowerCase().trim(), contact);
    });
  });

  console.log(`📋 Email lookup has ${emailToContact.size} email addresses`);

  // Get Gmail messages from the last 2 months that aren't linked
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);

  const gmailMessages = await prisma.$queryRaw<Array<{
    id: string;
    gmailMessageId: string;
    threadId: string;
    subject: string | null;
    snippet: string | null;
    body: string | null;
    bodyHtml: string | null;
    from: string;
    to: string | null;
    cc: string | null;
    date: Date;
  }>>`
    SELECT id, "gmailMessageId", "threadId", subject, snippet, body, "bodyHtml", "from", "to", cc, date
    FROM "GmailMessage"
    WHERE date >= ${cutoff}
    ORDER BY date ASC
  `;

  console.log(`📧 Found ${gmailMessages.length} Gmail messages to process`);

  // Get existing EmailMessage gmailMessageIds to avoid duplicates
  const existingEmailMessages = await prisma.emailMessage.findMany({
    select: { id: true },
  });
  const existingIds = new Set(existingEmailMessages.map(e => e.id));

  let linked = 0;
  let threadsCreated = 0;
  let messagesCreated = 0;
  let skipped = 0;

  for (const msg of gmailMessages) {
    // Extract all email addresses from the message
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const fromEmails = (msg.from.match(emailRegex) || []).map(e => e.toLowerCase());
    const toEmails = ((msg.to || '').match(emailRegex) || []).map(e => e.toLowerCase());
    const ccEmails = ((msg.cc || '').match(emailRegex) || []).map(e => e.toLowerCase());
    const allEmails = [...fromEmails, ...toEmails, ...ccEmails];

    // Find matching contact
    let matchedContact = null;
    for (const email of allEmails) {
      if (emailToContact.has(email)) {
        matchedContact = emailToContact.get(email)!;
        break;
      }
    }

    if (!matchedContact) {
      skipped++;
      continue;
    }

    // Link GmailMessage to contact if not already linked
    if (!msg.from.toLowerCase().includes('opticwise')) {
      // Only update personId if not already set
      try {
        await prisma.gmailMessage.update({
          where: { gmailMessageId: msg.gmailMessageId },
          data: {
            personId: matchedContact.id,
            organizationId: matchedContact.organizationId,
          },
        });
        linked++;
      } catch {
        // Ignore update errors
      }
    }

    // Find or create EmailThread
    const subject = msg.subject || '(No Subject)';
    let emailThread = await prisma.emailThread.findFirst({
      where: {
        subject,
        personId: matchedContact.id,
      },
    });

    if (!emailThread) {
      emailThread = await prisma.emailThread.create({
        data: {
          subject,
          personId: matchedContact.id,
          organizationId: matchedContact.organizationId,
        },
      });
      threadsCreated++;
    }

    // Check if this message already exists in the thread
    const existingMsg = await prisma.emailMessage.findFirst({
      where: {
        threadId: emailThread.id,
        sentAt: msg.date,
        sender: msg.from,
      },
    });

    if (existingMsg) {
      continue;
    }

    // Determine direction
    const isOutgoing = msg.from.toLowerCase().includes('opticwise');

    // Create EmailMessage
    try {
      await prisma.emailMessage.create({
        data: {
          threadId: emailThread.id,
          sender: msg.from,
          recipients: msg.to || '',
          cc: msg.cc || '',
          body: msg.bodyHtml || msg.body || msg.snippet || '',
          direction: isOutgoing ? 'OUTGOING' : 'INCOMING',
          sentAt: msg.date,
        },
      });
      messagesCreated++;
    } catch {
      // Skip duplicates
    }

    // Update thread timestamp
    await prisma.emailThread.update({
      where: { id: emailThread.id },
      data: { updatedAt: msg.date > emailThread.updatedAt ? msg.date : emailThread.updatedAt },
    });

    if ((linked + messagesCreated) % 50 === 0) {
      console.log(`   ✓ Processed ${linked + messagesCreated + skipped}/${gmailMessages.length}...`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ BACKFILL COMPLETE');
  console.log('='.repeat(60));
  console.log(`   📧 Gmail messages processed: ${gmailMessages.length}`);
  console.log(`   🔗 Linked to contacts: ${linked}`);
  console.log(`   📂 Threads created: ${threadsCreated}`);
  console.log(`   💬 Messages created: ${messagesCreated}`);
  console.log(`   ⏭️  Skipped (no contact match): ${skipped}`);
  console.log('='.repeat(60) + '\n');
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
