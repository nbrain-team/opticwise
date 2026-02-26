/**
 * Full CRM Refresh from Apollo Export
 * 
 * Clears and replaces both Person (contacts) and Organization (companies)
 * tables with data from the Apollo-fixed CSV.
 * 
 * Maps ALL Apollo columns to the Prisma schema fields.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const CSV_PATH = path.join(process.cwd(), 'apollo-contacts-fixed.csv');

async function fullRefresh() {
  console.log('\n🔄 FULL CRM REFRESH FROM APOLLO EXPORT');
  console.log('='.repeat(60));

  // Read CSV
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, relax_column_count: true });
  console.log(`📄 Read ${records.length} contacts from Apollo CSV`);

  // Step 1: Backup
  console.log('\n📦 Step 1: Backing up current data...');
  const existingContacts = await prisma.person.count();
  const existingOrgs = await prisma.organization.count();
  console.log(`   Current: ${existingContacts} contacts, ${existingOrgs} organizations`);

  const backupContacts = await prisma.person.findMany();
  const backupOrgs = await prisma.organization.findMany();
  const backupPath = path.join(process.cwd(), `crm-full-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ contacts: backupContacts, organizations: backupOrgs }, null, 2));
  console.log(`   ✓ Backed up to: ${backupPath}`);

  // Step 2: Clear existing data
  console.log('\n🗑️  Step 2: Clearing existing data...');

  // Unlink GmailMessages from persons/orgs to avoid FK issues
  await prisma.gmailMessage.updateMany({
    where: { personId: { not: null } },
    data: { personId: null },
  });
  await prisma.gmailMessage.updateMany({
    where: { organizationId: { not: null } },
    data: { organizationId: null },
  });

  // Clear EmailThreads links
  await prisma.emailMessage.deleteMany();
  await prisma.emailThread.deleteMany();

  // Clear activities linked to persons
  await prisma.activity.deleteMany({
    where: { personId: { not: null } },
  });

  // Clear persons
  const deletedContacts = await prisma.person.deleteMany();
  console.log(`   ✓ Deleted ${deletedContacts.count} contacts`);

  // Clear organizations
  const deletedOrgs = await prisma.organization.deleteMany();
  console.log(`   ✓ Deleted ${deletedOrgs.count} organizations`);

  // Step 3: Build unique companies and create organizations
  console.log('\n🏢 Step 3: Creating organizations...');

  const companyMap = new Map<string, Record<string, string>>();

  for (const record of records) {
    const companyName = record['Company Name']?.trim();
    if (!companyName) continue;

    if (!companyMap.has(companyName)) {
      companyMap.set(companyName, {
        name: companyName,
        website: record['Website'] || '',
        companyLinkedin: record['Company Linkedin Url'] || '',
        industry: record['Industry'] || '',
        employees: record['# Employees'] || '',
        revenue: record['Annual Revenue'] || '',
        address: record['Company Address'] || '',
        city: record['Company City'] || '',
        state: record['Company State'] || '',
        country: record['Company Country'] || '',
        phone: record['Company Phone'] || '',
      });
    }
  }

  console.log(`   Found ${companyMap.size} unique companies`);

  const orgIdMap = new Map<string, string>();
  let orgCreated = 0;

  for (const [name, data] of companyMap.entries()) {
    try {
      const org = await prisma.organization.create({
        data: {
          name: data.name,
          websiteUrl: data.website || null,
          linkedInProfile: data.companyLinkedin || null,
          industry: data.industry || null,
          numberOfEmployees: data.employees || null,
          annualRevenue: data.revenue || null,
          fullAddress: data.address || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
        },
      });
      orgIdMap.set(name, org.id);
      orgCreated++;
    } catch (error: any) {
      if (!error.message?.includes('Unique constraint')) {
        console.error(`   ✗ Error creating org "${name}": ${error.message}`);
      }
    }
  }

  console.log(`   ✓ Created ${orgCreated} organizations`);

  // Step 4: Import contacts
  console.log('\n👥 Step 4: Importing contacts...');

  let contactsCreated = 0;
  let contactsSkipped = 0;

  for (const record of records) {
    const email = record['Email']?.trim();
    const firstName = record['First Name']?.trim();
    const lastName = record['Last Name']?.trim();

    if (!email) { contactsSkipped++; continue; }
    if (!firstName && !lastName) { contactsSkipped++; continue; }

    const companyName = record['Company Name']?.trim();
    const organizationId = companyName ? orgIdMap.get(companyName) : null;

    // Pick best phone number
    const phone = record['Work Direct Phone']?.trim() ||
                  record['Mobile Phone']?.trim() ||
                  record['Corporate Phone']?.trim() ||
                  record['Home Phone']?.trim() ||
                  record['Other Phone']?.trim() || null;

    try {
      await prisma.person.create({
        data: {
          firstName: firstName || 'Unknown',
          lastName: lastName || '',
          name: `${firstName || ''} ${lastName || ''}`.trim() || email,
          email: email,
          title: record['Title']?.trim() || null,
          phone: phone,
          phoneWork: record['Work Direct Phone']?.trim()?.replace(/^'/, '') || null,
          phoneHome: record['Home Phone']?.trim()?.replace(/^'/, '') || null,
          phoneMobile: record['Mobile Phone']?.trim()?.replace(/^'/, '') || null,
          phoneOther: record['Other Phone']?.trim()?.replace(/^'/, '') || null,
          emailWork: record['Secondary Email']?.trim() || null,
          emailOther: record['Tertiary Email']?.trim() || null,
          linkedInProfile: record['Person Linkedin Url']?.trim() || null,
          city: record['City']?.trim() || null,
          state: record['State']?.trim() || null,
          country: record['Country']?.trim() || null,
          organizationId: organizationId || null,
          contactType: record['Seniority']?.trim() || null,
          labels: record['Departments']?.trim() || null,
          marketingStatus: record['Stage']?.trim() || null,
        },
      });
      contactsCreated++;

      if (contactsCreated % 100 === 0) {
        console.log(`   ✓ Imported ${contactsCreated} contacts...`);
      }
    } catch (error: any) {
      if (error.message?.includes('Unique constraint')) {
        contactsSkipped++;
      } else {
        console.error(`   ✗ Error importing ${email}: ${error.message}`);
        contactsSkipped++;
      }
    }
  }

  // Step 5: Verify
  const finalContacts = await prisma.person.count();
  const finalOrgs = await prisma.organization.count();
  const linkedContacts = await prisma.person.count({ where: { organizationId: { not: null } } });

  console.log('\n' + '='.repeat(60));
  console.log('✅ FULL CRM REFRESH COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n   BEFORE:`);
  console.log(`      Contacts: ${existingContacts}`);
  console.log(`      Organizations: ${existingOrgs}`);
  console.log(`\n   AFTER:`);
  console.log(`      Contacts: ${finalContacts} (${contactsCreated} created, ${contactsSkipped} skipped)`);
  console.log(`      Organizations: ${finalOrgs}`);
  console.log(`      Contacts linked to companies: ${linkedContacts}`);
  console.log(`\n   BACKUP: ${backupPath}`);
  console.log('='.repeat(60) + '\n');
}

fullRefresh()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
