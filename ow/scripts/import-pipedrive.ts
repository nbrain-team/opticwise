#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CSVRow {
  [key: string]: string;
}

function parseCSV(filePath: string): CSVRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  });
  return records;
}

function parseDecimal(value: string): number | null {
  if (!value || value === '' || value === '-') return null;
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

function parseDate(value: string): Date | null {
  if (!value || value === '' || value === '-') return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

async function importOrganizations(rows: CSVRow[]) {
  console.log(`\nImporting ${rows.length} organizations...`);
  let updated = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const name = row['Name']?.trim();
    if (!name) {
      skipped++;
      continue;
    }
    
    try {
      await prisma.organization.upsert({
        where: { name },
        update: {
          address: row['Address'] || null,
          websiteUrl: row['Website'] || null,
          domain: row['Website']?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || null,
          linkedInProfile: row['LinkedIn profile'] || null,
          industry: row['Industry'] || null,
          annualRevenue: row['Annual revenue'] || null,
          numberOfEmployees: row['Number of employees'] || null,
          doors: row['Doors'] || null,
          labels: row['Labels'] || row['Label'] || null,
          profilePicture: row['Profile picture'] || null,
          latitude: row['Latitude of Address'] || null,
          longitude: row['Longitude of Address'] || null,
        },
        create: {
          name,
          address: row['Address'] || null,
          websiteUrl: row['Website'] || null,
          domain: row['Website']?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || null,
          linkedInProfile: row['LinkedIn profile'] || null,
          industry: row['Industry'] || null,
          annualRevenue: row['Annual revenue'] || null,
          numberOfEmployees: row['Number of employees'] || null,
          doors: row['Doors'] || null,
          labels: row['Labels'] || row['Label'] || null,
          profilePicture: row['Profile picture'] || null,
          latitude: row['Latitude of Address'] || null,
          longitude: row['Longitude of Address'] || null,
        }
      });
      updated++;
    } catch (err: any) {
      console.warn(`Failed to import org "${name}": ${err.message}`);
      skipped++;
    }
    
    if (updated % 500 === 0) {
      console.log(`  Updated ${updated} organizations...`);
    }
  }
  
  console.log(`Organizations: ${updated} created/updated, ${skipped} skipped`);
}

async function importPeople(rows: CSVRow[]) {
  console.log(`\nImporting ${rows.length} people...`);
  let created = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const firstName = row['First name']?.trim() || '';
    const lastName = row['Last name']?.trim() || '';
    const name = row['Name']?.trim() || `${firstName} ${lastName}`.trim();
    
    if (!name && !firstName && !lastName) {
      skipped++;
      continue;
    }
    
    const orgName = row['Organization']?.trim();
    let organizationId: string | null = null;
    
    if (orgName) {
      const org = await prisma.organization.findUnique({ where: { name: orgName } });
      organizationId = org?.id || null;
    }
    
    const emailWork = row['Email - Work']?.trim() || null;
    const emailHome = row['Email - Home']?.trim() || null;
    const emailOther = row['Email - Other']?.trim() || null;
    const primaryEmail = emailWork || emailHome || emailOther || null;
    
    // Skip if no unique identifier
    if (!primaryEmail && !name) {
      skipped++;
      continue;
    }
    
    try {
      const data = {
        name: name || `${firstName} ${lastName}`.trim(),
        firstName: firstName || name.split(' ')[0] || 'Unknown',
        lastName: lastName || name.split(' ').slice(1).join(' ') || '',
        email: primaryEmail,
        phone: row['Phone - Work'] || row['Phone - Mobile'] || row['Phone - Home'] || null,
        phoneWork: row['Phone - Work'] || null,
        phoneHome: row['Phone - Home'] || null,
        phoneMobile: row['Phone - Mobile'] || null,
        phoneOther: row['Phone - Other'] || null,
        emailWork,
        emailHome,
        emailOther,
        title: row['Job title'] || null,
        labels: row['Labels'] || row['Label'] || null,
        contactType: row['Contact Type'] || null,
        organizationId,
        postalAddress: row['Full/combined address of Postal address'] || null,
        birthday: parseDate(row['Birthday']),
        notes: row['Notes'] || null,
        linkedInProfile: row['LinkedIn profile'] || null,
        qwilrProposal: row['Qwilr Proposal'] || null,
        classification: row['Classification'] || null,
        instantMessenger: row['Instant messenger'] || null,
        marketingStatus: row['Marketing status'] || null,
        doubleOptIn: row['Double opt-in'] || null,
        profilePicture: row['Profile picture'] || null,
        latitude: row['Latitude of Postal address'] || null,
        longitude: row['Longitude of Postal address'] || null,
      };
      
      if (primaryEmail) {
        await prisma.person.upsert({
          where: { email: primaryEmail },
          update: data,
          create: data,
        });
      } else {
        await prisma.person.create({ data });
      }
      created++;
    } catch (err: any) {
      skipped++;
    }
    
    if (created % 1000 === 0) {
      console.log(`  Processed ${created} people...`);
    }
  }
  
  console.log(`People: ${created} created/updated, ${skipped} skipped`);
}

async function importDeals(rows: CSVRow[]) {
  console.log(`\nImporting ${rows.length} deals...`);
  let created = 0;
  let skipped = 0;
  
  const pipeline = await prisma.pipeline.findFirst();
  const user = await prisma.user.findFirst();
  
  if (!pipeline || !user) {
    console.error('No pipeline or user found. Run seed first.');
    return;
  }
  
  for (const row of rows) {
    const title = row['Title']?.trim();
    if (!title) {
      skipped++;
      continue;
    }
    
    const stageName = row['Stage']?.trim();
    let stage = stageName 
      ? await prisma.stage.findFirst({ where: { pipelineId: pipeline.id, name: stageName } })
      : null;
    
    if (!stage) {
      stage = await prisma.stage.findFirst({ where: { pipelineId: pipeline.id }, orderBy: { orderIndex: 'asc' } });
    }
    
    if (!stage) {
      skipped++;
      continue;
    }
    
    const orgName = row['Organization']?.trim();
    let organizationId: string | null = null;
    if (orgName) {
      const org = await prisma.organization.findUnique({ where: { name: orgName } });
      organizationId = org?.id || null;
    }
    
    const personName = row['Contact person']?.trim();
    let personId: string | null = null;
    if (personName && organizationId) {
      const person = await prisma.person.findFirst({ 
        where: { 
          organizationId,
          OR: [
            { name: { contains: personName, mode: 'insensitive' } },
            { firstName: { contains: personName, mode: 'insensitive' } },
            { lastName: { contains: personName, mode: 'insensitive' } },
          ]
        } 
      });
      personId = person?.id || null;
    }
    
    const value = parseDecimal(row['Value']) || 0;
    const probability = parseDecimal(row['Probability']);
    
    const status = row['Status']?.toLowerCase() === 'won' ? 'won' 
                 : row['Status']?.toLowerCase() === 'lost' ? 'lost' 
                 : 'open';
    
    try {
      await prisma.deal.create({
        data: {
          title,
          value,
          currency: row['Currency of Value'] || 'USD',
          status,
          probability: probability ? Math.round(probability) : null,
          expectedCloseDate: parseDate(row['Expected close date']),
          wonTime: parseDate(row['Won time']),
          lostTime: parseDate(row['Lost time']),
          lostReason: row['Lost reason'] || null,
          label: row['Label'] || null,
          labels: row['Label'] || null,
          nextActivityDate: parseDate(row['Next activity date']),
          lastActivityDate: parseDate(row['Last activity date']),
          totalActivities: parseDecimal(row['Total activities']) ? Math.round(parseDecimal(row['Total activities'])!) : null,
          doneActivities: parseDecimal(row['Done activities']) ? Math.round(parseDecimal(row['Done activities'])!) : null,
          activitiesToDo: parseDecimal(row['Activities to do']) ? Math.round(parseDecimal(row['Activities to do'])!) : null,
          lastEmailReceived: parseDate(row['Last email received']),
          lastEmailSent: parseDate(row['Last email sent']),
          emailMessagesCount: parseDecimal(row['Email messages count']) ? Math.round(parseDecimal(row['Email messages count'])!) : null,
          productQuantity: row['Product quantity'] || null,
          productAmount: parseDecimal(row['Product amount']),
          productName: row['Product name'] || null,
          mrr: parseDecimal(row['MRR']),
          mrrCurrency: row['Currency of MRR'] || null,
          arr: parseDecimal(row['ARR']),
          arrCurrency: row['Currency of ARR'] || null,
          acv: parseDecimal(row['ACV']),
          acvCurrency: row['Currency of ACV'] || null,
          sourceOrigin: row['Source origin'] || null,
          sourceOriginId: row['Source origin ID'] || null,
          sourceChannel: row['Source channel'] || null,
          sourceChannelId: row['Source channel ID'] || null,
          goLiveTarget: row['Go-Live Target'] || null,
          propertyAddress: row['Full/combined address of Property Address'] || null,
          propertyType: row['Property Type'] || null,
          qty: row['Qty (clarify; units, beds, sqft)'] || null,
          arrForecast: parseDecimal(row['ARR forecast']),
          arrForecastCurrency: row['Currency of ARR forecast'] || null,
          capexRom: parseDecimal(row['CapEx ROM:']),
          capexRomCurrency: row['Currency of CapEx ROM:'] || null,
          roiNoiBomSheet: row['ROI/NOI/BOM sheet'] || null,
          printsPlansExternal: row['Prints/Plans External link'] || null,
          printsPlansDropbox: row['Prints/Plans OW DropBox Link'] || null,
          leadSource: row['Lead Source'] || null,
          technicalPOC: row['Technical POC'] || null,
          icpSegment: row['ICP Segment'] || null,
          leadSourcePPP: row['Lead Source PPP'] || null,
          readinessScore: row['Readiness Score'] || null,
          ddiAuditStatus: row['DDI Audit Status'] || null,
          auditValue: parseDecimal(row['Audit Value']),
          auditValueCurrency: row['Currency of Audit Value'] || null,
          arrExpansionPotential: parseDecimal(row['ARR Expansion Potential']),
          arrExpansionCurrency: row['Currency of ARR Expansion Potential'] || null,
          pipelineId: pipeline.id,
          stageId: stage.id,
          organizationId,
          personId,
          ownerId: user.id,
          addTime: parseDate(row['Deal created']) || new Date(),
          updateTime: parseDate(row['Update time']) || new Date(),
        }
      });
      created++;
    } catch (err: any) {
      console.warn(`Failed to import deal "${title}": ${err.message}`);
      skipped++;
    }
    
    if (created % 50 === 0) {
      console.log(`  Processed ${created} deals...`);
    }
  }
  
  console.log(`Deals: ${created} created, ${skipped} skipped`);
}

async function main() {
  const rootDir = join(__dirname, '..', '..');
  
  console.log('Starting Pipedrive import with proper CSV parsing...\n');
  
  // Import organizations first
  const orgsPath = join(rootDir, 'organizations-23955722-70.csv');
  console.log(`Reading ${orgsPath}...`);
  const orgRows = parseCSV(orgsPath);
  await importOrganizations(orgRows);
  
  // Import people
  const peoplePath = join(rootDir, 'people-23955722-71.csv');
  console.log(`Reading ${peoplePath}...`);
  const peopleRows = parseCSV(peoplePath);
  await importPeople(peopleRows);
  
  // Import deals
  const dealsPath = join(rootDir, 'deals-23955722-69.csv');
  console.log(`Reading ${dealsPath}...`);
  const dealRows = parseCSV(dealsPath);
  await importDeals(dealRows);
  
  console.log('\n✅ Import complete!');
  
  // Summary
  const orgCount = await prisma.organization.count();
  const personCount = await prisma.person.count();
  const dealCount = await prisma.deal.count();
  const openDeals = await prisma.deal.count({ where: { status: 'open' } });
  
  console.log(`\n📊 Database totals:`);
  console.log(`  Organizations: ${orgCount.toLocaleString()}`);
  console.log(`  People: ${personCount.toLocaleString()}`);
  console.log(`  Deals: ${dealCount.toLocaleString()} (${openDeals} open)`);
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('\n❌ Import failed:', err);
  process.exit(1);
});
