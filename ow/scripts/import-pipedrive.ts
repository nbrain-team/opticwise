#!/usr/bin/env tsx
/**
 * Import Pipedrive CSV exports into Opticwise CRM database
 * 
 * Usage:
 *   DATABASE_URL="..." tsx scripts/import-pipedrive.ts
 * 
 * Expects CSVs in workspace root:
 *   - organizations-23955722-70.csv
 *   - people-23955722-71.csv
 *   - deals-23955722-69.csv
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface CSVRow {
  [key: string]: string;
}

function parseCSV(filePath: string): CSVRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  // Parse header
  const headerLine = lines[0];
  const headers: string[] = [];
  let inQuote = false;
  let current = '';
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      headers.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current) headers.push(current.trim());
  
  // Parse rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    inQuote = false;
    current = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) values.push(current);
    
    const row: CSVRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

async function importOrganizations(rows: CSVRow[]) {
  console.log(`Importing ${rows.length} organizations...`);
  let created = 0;
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
          address: row['Full/combined address of Address'] || null,
          websiteUrl: row['Website'] || null,
          domain: row['Website']?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || null,
          customFields: {
            linkedInProfile: row['LinkedIn profile'] || null,
            industry: row['Industry'] || null,
            annualRevenue: row['Annual revenue'] || null,
            numberOfEmployees: row['Number of employees'] || null,
            doors: row['Doors'] || null,
          }
        },
        create: {
          name,
          address: row['Full/combined address of Address'] || null,
          websiteUrl: row['Website'] || null,
          domain: row['Website']?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || null,
          customFields: {
            linkedInProfile: row['LinkedIn profile'] || null,
            industry: row['Industry'] || null,
            annualRevenue: row['Annual revenue'] || null,
            numberOfEmployees: row['Number of employees'] || null,
            doors: row['Doors'] || null,
          }
        }
      });
      created++;
    } catch (err: any) {
      console.warn(`Failed to import org "${name}": ${err.message}`);
      skipped++;
    }
  }
  
  console.log(`Organizations: ${created} created/updated, ${skipped} skipped`);
}

async function importPeople(rows: CSVRow[]) {
  console.log(`Importing ${rows.length} people...`);
  let created = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const email = row['Email - Work']?.trim() || row['Email - Home']?.trim();
    const firstName = row['First name']?.trim();
    const lastName = row['Last name']?.trim();
    const name = row['Name']?.trim();
    
    if (!email && !name) {
      skipped++;
      continue;
    }
    
    const orgName = row['Organization']?.trim();
    let organizationId: string | null = null;
    
    if (orgName) {
      const org = await prisma.organization.findUnique({ where: { name: orgName } });
      organizationId = org?.id || null;
    }
    
    try {
      const person = await prisma.person.create({
        data: {
          name: name || `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown',
          email: email || null,
          phone: row['Phone - Work'] || row['Phone - Mobile'] || null,
          organizationId,
          customFields: {
            firstName,
            lastName,
            jobTitle: row['Job title'] || null,
            linkedInProfile: row['LinkedIn profile'] || null,
            contactType: row['Contact Type'] || null,
            postalAddress: row['Full/combined address of Postal address'] || null,
          }
        }
      });
      created++;
    } catch (err: any) {
      // Likely duplicate; skip
      skipped++;
    }
  }
  
  console.log(`People: ${created} created, ${skipped} skipped`);
}

async function importDeals(rows: CSVRow[]) {
  console.log(`Importing ${rows.length} deals...`);
  let created = 0;
  let skipped = 0;
  
  // Get the default pipeline and user
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
    
    // If no exact match, default to first stage
    if (!stage) {
      stage = await prisma.stage.findFirst({ where: { pipelineId: pipeline.id }, orderBy: { orderIndex: 'asc' } });
    }
    
    if (!stage) {
      console.warn(`No stage found for deal "${title}"`);
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
    if (personName) {
      // Person model uses firstName/lastName, not name field for search
      const person = await prisma.person.findFirst({ 
        where: { 
          OR: [
            { firstName: { contains: personName, mode: 'insensitive' } },
            { lastName: { contains: personName, mode: 'insensitive' } },
            { email: { contains: personName, mode: 'insensitive' } }
          ]
        } 
      });
      personId = person?.id || null;
    }
    
    const valueStr = row['Value']?.trim();
    const value = valueStr ? parseFloat(valueStr) : 0;
    
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
          pipelineId: pipeline.id,
          stageId: stage.id,
          organizationId,
          personId,
          ownerId: user.id,
          customFields: {
            propertyType: row['Property Type'] || null,
            qty: row['Qty (clarify; units, beds, sqft)'] || null,
            arrForecast: row['ARR forecast'] || null,
            capexRom: row['CapEx ROM:'] || null,
            printsPlansExternal: row['Prints/Plans External link'] || null,
            printsPlansDropbox: row['Prints/Plans OW DropBox Link'] || null,
            leadSource: row['Lead Source'] || null,
            sourceChannel: row['Source channel'] || null,
            sourceChannelId: row['Source channel ID'] || null,
          }
        }
      });
      created++;
    } catch (err: any) {
      console.warn(`Failed to import deal "${title}": ${err.message}`);
      skipped++;
    }
  }
  
  console.log(`Deals: ${created} created, ${skipped} skipped`);
}

async function main() {
  const rootDir = join(__dirname, '..', '..');
  
  console.log('Starting Pipedrive import...\n');
  
  // Import organizations first (referenced by people and deals)
  const orgsPath = join(rootDir, 'organizations-23955722-70.csv');
  const orgRows = parseCSV(orgsPath);
  await importOrganizations(orgRows);
  
  // Import people (referenced by deals)
  const peoplePath = join(rootDir, 'people-23955722-71.csv');
  const peopleRows = parseCSV(peoplePath);
  await importPeople(peopleRows);
  
  // Import deals
  const dealsPath = join(rootDir, 'deals-23955722-69.csv');
  const dealRows = parseCSV(dealsPath);
  await importDeals(dealRows);
  
  console.log('\nImport complete!');
  
  // Summary
  const orgCount = await prisma.organization.count();
  const personCount = await prisma.person.count();
  const dealCount = await prisma.deal.count();
  
  console.log(`\nDatabase totals:`);
  console.log(`  Organizations: ${orgCount}`);
  console.log(`  People: ${personCount}`);
  console.log(`  Deals: ${dealCount}`);
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});

