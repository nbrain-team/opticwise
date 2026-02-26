/**
 * Re-link GmailMessages to new CRM contacts
 * 
 * After a CRM refresh, all personId/organizationId links on GmailMessages
 * are cleared. This script re-links them by matching email addresses.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function relinkEmails() {
  console.log('\n🔗 RE-LINKING GMAIL MESSAGES TO CRM CONTACTS');
  console.log('='.repeat(60));

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
      organizationId: true,
    },
  });

  console.log(`👥 Found ${contacts.length} contacts with email addresses`);

  const emailToContact = new Map<string, { personId: string; organizationId: string | null }>();
  for (const contact of contacts) {
    const emails = [contact.email, contact.emailWork, contact.emailHome, contact.emailOther];
    for (const email of emails) {
      if (email) {
        emailToContact.set(email.toLowerCase().trim(), {
          personId: contact.id,
          organizationId: contact.organizationId,
        });
      }
    }
  }

  console.log(`📋 Built lookup with ${emailToContact.size} email addresses`);

  const totalMessages = await prisma.gmailMessage.count();
  console.log(`📧 Total GmailMessages: ${totalMessages}`);

  let linked = 0;
  let batchSize = 500;
  let offset = 0;

  while (offset < totalMessages) {
    const messages = await prisma.$queryRaw<Array<{
      id: string;
      from: string;
      to: string | null;
      cc: string | null;
    }>>`
      SELECT id, "from", "to", cc 
      FROM "GmailMessage" 
      ORDER BY date DESC 
      LIMIT ${batchSize} OFFSET ${offset}
    `;

    if (messages.length === 0) break;

    for (const msg of messages) {
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const allAddresses = [
        ...(msg.from.match(emailRegex) || []),
        ...((msg.to || '').match(emailRegex) || []),
        ...((msg.cc || '').match(emailRegex) || []),
      ].map(e => e.toLowerCase());

      for (const addr of allAddresses) {
        const match = emailToContact.get(addr);
        if (match) {
          try {
            await prisma.gmailMessage.update({
              where: { id: msg.id },
              data: {
                personId: match.personId,
                organizationId: match.organizationId,
              },
            });
            linked++;
          } catch {
            // skip errors
          }
          break;
        }
      }
    }

    offset += batchSize;
    console.log(`   Processed ${Math.min(offset, totalMessages)}/${totalMessages} messages (${linked} linked so far)`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ RE-LINKING COMPLETE');
  console.log('='.repeat(60));
  console.log(`   📧 Total messages: ${totalMessages}`);
  console.log(`   🔗 Linked to contacts: ${linked}`);
  console.log('='.repeat(60) + '\n');
}

relinkEmails()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
