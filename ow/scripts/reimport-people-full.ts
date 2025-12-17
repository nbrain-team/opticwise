#!/usr/bin/env tsx
/**
 * Full People Re-import Script
 * 
 * This script re-imports people from Pipedrive CSV with ALL fields including
 * city, state, country, activity tracking, etc.
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
    relax_column_count: true,
    trim: true,
    quote: '"',
    on_record: (record: CSVRow) => {
      if (record['First name'] || record['Last name'] || record['Name']) {
        return record;
      }
      return null;
    }
  });
  return records.filter((r: CSVRow | null) => r !== null);
}

function parseDate(value: string): Date | null {
  if (!value || value === '' || value === '-') return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function parseInt2(value: string): number | null {
  if (!value || value === '' || value === '-') return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function cleanPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.trim();
  // If it looks like a phone number (contains digits), keep it
  const digitCount = (cleaned.match(/\d/g) || []).length;
  if (digitCount >= 7 && cleaned.length < 30) {
    return cleaned;
  }
  return null;
}

function isValidName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/^\d{5}(-\d{4})?$/.test(trimmed)) return false;
  if (/^\d+\s+(st|nd|rd|th|Street|Ave|Road|Dr|Lane|Blvd)/i.test(trimmed)) return false;
  // Reject state abbreviations
  if (/^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|ON|QC)$/i.test(trimmed)) return false;
  // Reject if contains corruption patterns
  if (/,,,,/.test(trimmed)) return false;
  if (/No consent,Not confirmed/i.test(trimmed)) return false;
  return true;
}

function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function cleanValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') return null;
  // Check for corruption
  if (/,,,,/.test(trimmed)) return null;
  if (/No consent,Not confirmed/i.test(trimmed)) return null;
  return trimmed;
}

async function reimportPeople() {
  const rootDir = join(__dirname, '..', '..');
  const peoplePath = join(rootDir, 'people-23955722-71.csv');
  
  console.log('🔧 Starting Full People Re-import...\n');
  console.log(`Reading ${peoplePath}...`);
  
  const rows = parseCSV(peoplePath);
  console.log(`Found ${rows.length} rows in CSV\n`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    const firstName = row['First name']?.trim() || '';
    const lastName = row['Last name']?.trim() || '';
    const fullName = row['Name']?.trim() || '';
    
    // Skip invalid names
    if (!isValidName(firstName) && !isValidName(lastName) && !isValidName(fullName)) {
      skipped++;
      continue;
    }
    
    // Get email fields
    const emailWork = isValidEmail(row['Email - Work']) ? row['Email - Work']?.trim() : null;
    const emailHome = isValidEmail(row['Email - Home']) ? row['Email - Home']?.trim() : null;
    const emailOther = isValidEmail(row['Email - Other']) ? row['Email - Other']?.trim() : null;
    const primaryEmail = emailWork || emailHome || emailOther || null;
    
    // Get phone fields
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
    
    // Prepare data with ALL fields
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
      emailWork,
      emailHome,
      emailOther,
      title: cleanValue(row['Job title']),
      labels: cleanValue(row['Labels']) || cleanValue(row['Label']),
      contactType: cleanValue(row['Contact Type']),
      organizationId,
      
      // Address fields
      postalAddress: cleanValue(row['Full/combined address of Postal address']),
      streetAddress: cleanValue(row['Street/road name of Postal address']),
      houseNumber: cleanValue(row['House number of Postal address']),
      apartmentSuite: cleanValue(row['Apartment/suite no of Postal address']),
      city: cleanValue(row['City/town/village/locality of Postal address']),
      state: cleanValue(row['State/county of Postal address']),
      region: cleanValue(row['Region of Postal address']),
      country: cleanValue(row['Country of Postal address']),
      zipCode: cleanValue(row['ZIP/Postal code of Postal address']),
      latitude: cleanValue(row['Latitude of Postal address']),
      longitude: cleanValue(row['Longitude of Postal address']),
      
      // Personal info
      birthday: parseDate(row['Birthday']),
      notes: cleanValue(row['Notes']),
      linkedInProfile: cleanValue(row['LinkedIn profile']),
      qwilrProposal: cleanValue(row['Qwilr Proposal']),
      classification: cleanValue(row['Classification']),
      instantMessenger: cleanValue(row['Instant messenger']),
      marketingStatus: cleanValue(row['Marketing status']),
      doubleOptIn: cleanValue(row['Double opt-in']),
      profilePicture: cleanValue(row['Profile picture']),
      
      // Activity tracking
      openDeals: parseInt2(row['Open deals']),
      wonDeals: parseInt2(row['Won deals']),
      lostDeals: parseInt2(row['Lost deals']),
      closedDeals: parseInt2(row['Closed deals']),
      totalActivities: parseInt2(row['Total activities']),
      doneActivities: parseInt2(row['Done activities']),
      activitiesToDo: parseInt2(row['Activities to do']),
      emailMessagesCount: parseInt2(row['Email messages count']),
      nextActivityDate: parseDate(row['Next activity date']),
      lastActivityDate: parseDate(row['Last activity date']),
      lastEmailReceived: parseDate(row['Last email received']),
      lastEmailSent: parseDate(row['Last email sent']),
    };
    
    try {
      if (primaryEmail) {
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
    } catch (err: unknown) {
      errors++;
      if (errors <= 5) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Error with "${cleanFullName}": ${message}`);
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

async function main() {
  try {
    await reimportPeople();
    
    // Summary
    const personCount = await prisma.person.count();
    const withCity = await prisma.person.count({ where: { city: { not: null } } });
    const withState = await prisma.person.count({ where: { state: { not: null } } });
    const withEmail = await prisma.person.count({ where: { email: { not: null } } });
    const withOrg = await prisma.person.count({ where: { organizationId: { not: null } } });
    
    console.log(`\n📊 Final Database Stats:`);
    console.log(`  Total People: ${personCount.toLocaleString()}`);
    console.log(`  With Email: ${withEmail.toLocaleString()}`);
    console.log(`  With Organization: ${withOrg.toLocaleString()}`);
    console.log(`  With City: ${withCity.toLocaleString()}`);
    console.log(`  With State: ${withState.toLocaleString()}`);
    
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();





