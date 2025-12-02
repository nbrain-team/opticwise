#!/usr/bin/env tsx
/**
 * Fix People Import Script
 * 
 * This script re-imports people from the Pipedrive CSV with proper handling
 * for multiline address fields that were causing data corruption.
 */
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
    relax_column_count: true,  // Handle rows with varying column counts
    trim: true,
    quote: '"',
    on_record: (record: CSVRow) => {
      // Validate record has expected fields
      if (record['First name'] || record['Last name'] || record['Name']) {
        return record;
      }
      return null; // Skip invalid records
    }
  });
  return records.filter((r: CSVRow | null) => r !== null);
}

function parseDate(value: string): Date | null {
  if (!value || value === '' || value === '-') return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function cleanPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove any non-phone characters but keep the number
  const cleaned = phone.trim();
  // If it looks like a phone number (contains digits), keep it
  if (/\d/.test(cleaned) && cleaned.length >= 7) {
    return cleaned;
  }
  return null;
}

function isValidName(name: string | null | undefined): boolean {
  if (!name) return false;
  // Valid names should start with a letter and not be just numbers or zip codes
  const trimmed = name.trim();
  if (!trimmed) return false;
  // Reject if it's just numbers, zip codes, or addresses
  if (/^\d+$/.test(trimmed)) return false;
  if (/^\d{5}(-\d{4})?$/.test(trimmed)) return false; // ZIP code
  if (/^\d+\s+(st|nd|rd|th|Street|Ave|Road|Dr|Lane|Blvd)/i.test(trimmed)) return false;
  // Reject state abbreviations used as names
  if (/^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|ON|QC)$/i.test(trimmed)) return false;
  return true;
}

function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  // Basic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function fixPeopleImport() {
  const rootDir = join(__dirname, '..', '..');
  const peoplePath = join(rootDir, 'people-23955722-71.csv');
  
  console.log('🔧 Starting People Data Fix...\n');
  console.log(`Reading ${peoplePath}...`);
  
  const rows = parseCSV(peoplePath);
  console.log(`Found ${rows.length} rows in CSV\n`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    // Get the clean data from CSV
    const firstName = row['First name']?.trim() || '';
    const lastName = row['Last name']?.trim() || '';
    const fullName = row['Name']?.trim() || '';
    const jobTitle = row['Job title']?.trim() || null;
    
    // Skip if no valid name data
    if (!isValidName(firstName) && !isValidName(lastName) && !isValidName(fullName)) {
      skipped++;
      continue;
    }
    
    // Get email fields
    const emailWork = row['Email - Work']?.trim() || null;
    const emailHome = row['Email - Home']?.trim() || null;
    const emailOther = row['Email - Other']?.trim() || null;
    
    // Find valid email
    const validEmailWork = isValidEmail(emailWork) ? emailWork : null;
    const validEmailHome = isValidEmail(emailHome) ? emailHome : null;
    const validEmailOther = isValidEmail(emailOther) ? emailOther : null;
    const primaryEmail = validEmailWork || validEmailHome || validEmailOther || null;
    
    // Get phone fields - clean them
    const phoneWork = cleanPhoneNumber(row['Phone - Work']);
    const phoneHome = cleanPhoneNumber(row['Phone - Home']);
    const phoneMobile = cleanPhoneNumber(row['Phone - Mobile']);
    const phoneOther = cleanPhoneNumber(row['Phone - Other']);
    
    // Get organization
    const orgName = row['Organization']?.trim();
    let organizationId: string | null = null;
    if (orgName) {
      const org = await prisma.organization.findUnique({ where: { name: orgName } });
      organizationId = org?.id || null;
    }
    
    // Build proper name
    const cleanFirstName = isValidName(firstName) ? firstName : (fullName.split(' ')[0] || 'Unknown');
    const cleanLastName = isValidName(lastName) ? lastName : (fullName.split(' ').slice(1).join(' ') || '');
    const cleanFullName = fullName || `${cleanFirstName} ${cleanLastName}`.trim();
    
    // Prepare data
    const data = {
      name: cleanFullName,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: primaryEmail,
      phone: phoneWork || phoneMobile || phoneHome || null,
      phoneWork,
      phoneHome,
      phoneMobile,
      phoneOther,
      emailWork: validEmailWork,
      emailHome: validEmailHome,
      emailOther: validEmailOther,
      title: jobTitle,
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
    
    try {
      if (primaryEmail) {
        // Try to find existing person by email
        const existing = await prisma.person.findUnique({ where: { email: primaryEmail } });
        if (existing) {
          await prisma.person.update({
            where: { email: primaryEmail },
            data,
          });
        } else {
          await prisma.person.create({ data });
        }
      } else {
        // For people without email, try to find by name and org
        const existing = await prisma.person.findFirst({
          where: {
            name: cleanFullName,
            organizationId: organizationId || undefined,
          }
        });
        
        if (existing) {
          await prisma.person.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await prisma.person.create({ data });
        }
      }
      updated++;
    } catch (err: any) {
      errors++;
      if (errors <= 10) {
        console.warn(`Error with "${cleanFullName}": ${err.message}`);
      }
    }
    
    if (updated % 1000 === 0 && updated > 0) {
      console.log(`  Processed ${updated} people...`);
    }
  }
  
  console.log(`\n✅ People import complete!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

async function cleanupBadRecords() {
  console.log('\n🧹 Cleaning up corrupted records...\n');
  
  // State abbreviations that shouldn't be first names
  const stateAbbreviations = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','ON','QC'];
  
  // Delete records where firstName looks like a state abbreviation
  const badStateRecords = await prisma.person.findMany({
    where: {
      firstName: { in: stateAbbreviations }
    },
    select: { id: true, name: true, firstName: true }
  });
  
  console.log(`Found ${badStateRecords.length} records with state abbreviation as firstName`);
  
  // Find records with numeric first names using raw query
  const numericRecords = await prisma.$queryRaw<{id: string}[]>`
    SELECT id FROM "Person" WHERE "firstName" ~ '^[0-9]+$'
  `;
  
  console.log(`Found ${numericRecords.length} records with numeric firstName`);
  
  const allBadIds = [...badStateRecords.map(r => r.id), ...numericRecords.map(r => r.id)];
  
  if (allBadIds.length > 0) {
    // Delete these bad records
    const result = await prisma.person.deleteMany({
      where: {
        id: { in: allBadIds }
      }
    });
    console.log(`Deleted ${result.count} corrupted records`);
  }
}

async function main() {
  try {
    // First clean up bad records
    await cleanupBadRecords();
    
    // Then re-import with correct data
    await fixPeopleImport();
    
    // Summary
    const personCount = await prisma.person.count();
    const withEmail = await prisma.person.count({ where: { email: { not: null } } });
    const withOrg = await prisma.person.count({ where: { organizationId: { not: null } } });
    
    console.log(`\n📊 Final Database Stats:`);
    console.log(`  Total People: ${personCount.toLocaleString()}`);
    console.log(`  With Email: ${withEmail.toLocaleString()}`);
    console.log(`  With Organization: ${withOrg.toLocaleString()}`);
    
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

