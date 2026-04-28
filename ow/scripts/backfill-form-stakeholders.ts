/**
 * Backfill DealContact (Stakeholder) rows for deals previously created by
 * website form submissions. The form-intake processor used to set
 * Deal.personId only — but the Stakeholders section on the deal page is
 * powered by the DealContact junction table.
 *
 * Run on Render:
 *   cd /opt/render/project/src && npx tsx scripts/backfill-form-stakeholders.ts
 *
 * Idempotent: safe to run multiple times (uses unique [dealId, personId] key).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.deal.findMany({
    where: {
      sourceChannel: "website_form",
      personId: { not: null },
    },
    select: {
      id: true,
      title: true,
      personId: true,
      sourceChannelId: true,
      addTime: true,
    },
    orderBy: { addTime: "asc" },
  });

  console.log(`Found ${deals.length} form-sourced deals with a personId.`);

  let created = 0;
  let alreadyLinked = 0;

  for (const deal of deals) {
    if (!deal.personId) continue;
    const existing = await prisma.dealContact.findUnique({
      where: { dealId_personId: { dealId: deal.id, personId: deal.personId } },
    });
    if (existing) {
      alreadyLinked++;
      continue;
    }
    await prisma.dealContact.create({
      data: {
        dealId: deal.id,
        personId: deal.personId,
        isPrimary: true,
        notes: `Backfilled from website form (slug: ${deal.sourceChannelId ?? "unknown"})`,
      },
    });
    created++;
    console.log(`  + ${deal.title} (${deal.id})`);
  }

  console.log("");
  console.log(`Created ${created} new stakeholder rows.`);
  console.log(`Skipped ${alreadyLinked} deals that were already linked.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
