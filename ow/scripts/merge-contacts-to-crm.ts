/**
 * Merge new contacts into CRM (upsert - add new, update existing)
 * 
 * Reads extracted-contacts-all-users.csv and merges into Person table.
 * Existing contacts are updated with richer data if available.
 * New contacts are created.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
    else { current += char; }
  }
  values.push(current);
  return values;
}

async function mergeContacts() {
  console.log('\n🔄 MERGING CONTACTS INTO CRM');
  console.log('='.repeat(60));

  const csvPath = path.join(process.cwd(), 'extracted-contacts-all-users.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  console.log(`📄 Reading ${lines.length - 1} contacts from CSV`);

  const existingBefore = await prisma.person.count();
  console.log(`👥 Current CRM contacts: ${existingBefore}`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const email = values[0]?.trim();
    const fullName = values[1]?.trim();
    const firstName = values[2]?.trim();
    const lastName = values[3]?.trim();
    const company = values[4]?.trim();
    const jobTitle = values[5]?.trim();
    const phone = values[6]?.trim();
    const linkedin = values[7]?.trim();
    const address = values[8]?.trim();

    if (!email || (!firstName && !fullName)) {
      skipped++;
      continue;
    }

    const resolvedFirst = firstName || fullName?.split(' ')[0] || 'Unknown';
    const resolvedLast = lastName || fullName?.split(' ').slice(1).join(' ') || '';
    const resolvedName = fullName || `${resolvedFirst} ${resolvedLast}`.trim();

    try {
      // Check if contact exists
      const existing = await prisma.person.findUnique({ where: { email } });

      let organizationId: string | undefined;
      if (company) {
        const org = await prisma.organization.upsert({
          where: { name: company },
          update: {},
          create: { name: company },
        });
        organizationId = org.id;
      }

      if (existing) {
        // Update with richer data (only fill in blanks)
        const updateData: Record<string, string | undefined> = {};
        if (!existing.name && resolvedName) updateData.name = resolvedName;
        if (existing.firstName === 'Unknown' && resolvedFirst !== 'Unknown') updateData.firstName = resolvedFirst;
        if (!existing.lastName && resolvedLast) updateData.lastName = resolvedLast;
        if (!existing.title && jobTitle) updateData.title = jobTitle;
        if (!existing.phone && phone) updateData.phone = phone;
        if (!existing.postalAddress && address) updateData.postalAddress = address;
        if (!existing.organizationId && organizationId) updateData.organizationId = organizationId;
        if (!existing.labels && linkedin) updateData.labels = `LinkedIn: ${linkedin}`;

        if (Object.keys(updateData).length > 0) {
          await prisma.person.update({ where: { email }, data: updateData });
          updated++;
        }
      } else {
        await prisma.person.create({
          data: {
            email,
            name: resolvedName,
            firstName: resolvedFirst,
            lastName: resolvedLast,
            title: jobTitle || undefined,
            phone: phone || undefined,
            organizationId,
            postalAddress: address || undefined,
            labels: linkedin ? `LinkedIn: ${linkedin}` : undefined,
          },
        });
        created++;
      }

      if ((created + updated) % 50 === 0 && (created + updated) > 0) {
        console.log(`   ✓ Processed ${created + updated + skipped}... (${created} new, ${updated} updated)`);
      }
    } catch (error: any) {
      if (!error.message?.includes('Unique constraint')) {
        console.error(`   ✗ Error for ${email}: ${error.message}`);
      }
      skipped++;
    }
  }

  const existingAfter = await prisma.person.count();

  console.log('\n' + '='.repeat(60));
  console.log('✅ CRM MERGE COMPLETE');
  console.log('='.repeat(60));
  console.log(`   📊 Before: ${existingBefore} contacts`);
  console.log(`   ✅ Created: ${created} new contacts`);
  console.log(`   🔄 Updated: ${updated} existing contacts`);
  console.log(`   ⏭️  Skipped: ${skipped} (no name or error)`);
  console.log(`   📊 After: ${existingAfter} contacts`);
  console.log(`   📈 Net new: ${existingAfter - existingBefore}`);
  console.log('='.repeat(60) + '\n');
}

mergeContacts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
