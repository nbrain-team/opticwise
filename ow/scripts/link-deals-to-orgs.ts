/**
 * Link Deals to Organizations
 * 
 * Uses the Pipedrive deals CSV to find the correct organization for each deal,
 * creates the org if it doesn't exist, and links the deal.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function linkDeals() {
  console.log('\n🔗 LINKING DEALS TO ORGANIZATIONS');
  console.log('='.repeat(60));

  // Read Pipedrive CSV
  const csvPath = path.join(process.cwd(), '..', 'deals-23955722-69.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvDeals = parse(csvContent, { columns: true, skip_empty_lines: true, relax_column_count: true });

  console.log(`📄 Read ${csvDeals.length} deals from Pipedrive CSV`);

  // Build title -> org mapping from CSV
  const titleToOrg = new Map<string, string>();
  for (const csvDeal of csvDeals) {
    const title = csvDeal['Title']?.trim();
    const org = csvDeal['Organization']?.trim();
    if (title && org) {
      titleToOrg.set(title.toLowerCase(), org);
    }
  }

  console.log(`📋 Built ${titleToOrg.size} title-to-org mappings`);

  // Get all deals from database
  const dbDeals = await prisma.deal.findMany({
    select: { id: true, title: true, organizationId: true },
  });

  console.log(`🏢 Found ${dbDeals.length} deals in database`);

  let linked = 0;
  let created = 0;
  let alreadyLinked = 0;
  let noMatch = 0;

  for (const deal of dbDeals) {
    if (deal.organizationId) {
      alreadyLinked++;
      continue;
    }

    // Try to find org name from CSV mapping
    let orgName = titleToOrg.get(deal.title.toLowerCase());

    // If no CSV match, try extracting from title pattern "OrgName: Property"
    if (!orgName && deal.title.includes(':')) {
      orgName = deal.title.split(':')[0].trim();
    }

    if (!orgName) {
      noMatch++;
      continue;
    }

    // Find or create organization
    try {
      let org = await prisma.organization.findFirst({
        where: { name: { equals: orgName, mode: 'insensitive' } },
      });

      if (!org) {
        org = await prisma.organization.create({
          data: { name: orgName },
        });
        created++;
      }

      await prisma.deal.update({
        where: { id: deal.id },
        data: { organizationId: org.id },
      });

      linked++;
    } catch (error: any) {
      if (error.message?.includes('Unique constraint')) {
        // Org name already exists with different casing, find it
        const existingOrg = await prisma.organization.findFirst({
          where: { name: { contains: orgName, mode: 'insensitive' } },
        });
        if (existingOrg) {
          await prisma.deal.update({
            where: { id: deal.id },
            data: { organizationId: existingOrg.id },
          });
          linked++;
        }
      } else {
        console.error(`   Error linking "${deal.title}": ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ DEAL LINKING COMPLETE');
  console.log('='.repeat(60));
  console.log(`   📊 Total deals: ${dbDeals.length}`);
  console.log(`   🔗 Linked to org: ${linked}`);
  console.log(`   🏢 New orgs created: ${created}`);
  console.log(`   ✅ Already linked: ${alreadyLinked}`);
  console.log(`   ❌ No match found: ${noMatch}`);

  // Show unmatched deals
  if (noMatch > 0) {
    const unmatched = dbDeals.filter(d => !d.organizationId && !titleToOrg.get(d.title.toLowerCase()) && !d.title.includes(':'));
    console.log(`\n   Unmatched deals:`);
    for (const d of unmatched.slice(0, 10)) {
      console.log(`     - ${d.title}`);
    }
  }

  console.log('='.repeat(60) + '\n');
}

linkDeals()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
