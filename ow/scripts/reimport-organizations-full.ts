#!/usr/bin/env tsx
/**
 * Full Organizations Re-import Script
 * 
 * This script re-imports organizations from Pipedrive CSV with ALL fields including
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
  });
  return records;
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

function cleanValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') return null;
  // Check for corruption
  if (/,,,,/.test(trimmed)) return null;
  return trimmed;
}

function isValidOrgName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/^\d{5}(-\d{4})?$/.test(trimmed)) return false;
  // Reject state abbreviations
  if (/^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|ON|QC)$/i.test(trimmed)) return false;
  // Reject if contains corruption patterns
  if (/,,,,/.test(trimmed)) return false;
  return true;
}

function extractDomain(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null;
  try {
    const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function reimportOrganizations() {
  const rootDir = join(__dirname, '..', '..');
  const orgsPath = join(rootDir, 'organizations-23955722-70.csv');
  
  console.log('🔧 Starting Full Organizations Re-import...\n');
  console.log(`Reading ${orgsPath}...`);
  
  const rows = parseCSV(orgsPath);
  console.log(`Found ${rows.length} rows in CSV\n`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    const name = row['Name']?.trim();
    
    // Skip invalid names
    if (!isValidOrgName(name)) {
      skipped++;
      continue;
    }
    
    // Get website and domain
    const websiteUrl = cleanValue(row['Website']);
    const domain = extractDomain(websiteUrl);
    
    // Prepare data with ALL fields
    const data = {
      name: name!,
      address: cleanValue(row['Address']),
      websiteUrl,
      domain,
      linkedInProfile: cleanValue(row['LinkedIn profile']),
      industry: cleanValue(row['Industry']),
      annualRevenue: cleanValue(row['Annual revenue']),
      numberOfEmployees: cleanValue(row['Number of employees']),
      doors: cleanValue(row['Doors']),
      labels: cleanValue(row['Labels']) || cleanValue(row['Label']),
      profilePicture: cleanValue(row['Profile picture']),
      
      // Detailed address fields
      streetAddress: cleanValue(row['Street/road name of Address']),
      houseNumber: cleanValue(row['House number of Address']),
      apartmentSuite: cleanValue(row['Apartment/suite no of Address']),
      district: cleanValue(row['District/sublocality of Address']),
      city: cleanValue(row['City/town/village/locality of Address']),
      state: cleanValue(row['State/county of Address']),
      region: cleanValue(row['Region of Address']),
      country: cleanValue(row['Country of Address']),
      zipCode: cleanValue(row['ZIP/Postal code of Address']),
      fullAddress: cleanValue(row['Full/combined address of Address']),
      latitude: cleanValue(row['Latitude of Address']),
      longitude: cleanValue(row['Longitude of Address']),
      
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
    };
    
    try {
      const existing = await prisma.organization.findUnique({ where: { name: name! } });
      
      if (existing) {
        await prisma.organization.update({
          where: { name: name! },
          data,
        });
      } else {
        await prisma.organization.create({ data });
      }
      updated++;
    } catch (err: unknown) {
      errors++;
      if (errors <= 5) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Error with "${name}": ${message}`);
      }
    }
    
    if (updated % 500 === 0 && updated > 0) {
      console.log(`  Processed ${updated} organizations...`);
    }
  }
  
  console.log(`\n✅ Organizations import complete!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

async function main() {
  try {
    await reimportOrganizations();
    
    // Summary
    const orgCount = await prisma.organization.count();
    const withCity = await prisma.organization.count({ where: { city: { not: null } } });
    const withState = await prisma.organization.count({ where: { state: { not: null } } });
    const withWebsite = await prisma.organization.count({ where: { websiteUrl: { not: null } } });
    const withLinkedIn = await prisma.organization.count({ where: { linkedInProfile: { not: null } } });
    const withIndustry = await prisma.organization.count({ where: { industry: { not: null } } });
    
    console.log(`\n📊 Final Database Stats:`);
    console.log(`  Total Organizations: ${orgCount.toLocaleString()}`);
    console.log(`  With Website: ${withWebsite.toLocaleString()}`);
    console.log(`  With LinkedIn: ${withLinkedIn.toLocaleString()}`);
    console.log(`  With Industry: ${withIndustry.toLocaleString()}`);
    console.log(`  With City: ${withCity.toLocaleString()}`);
    console.log(`  With State: ${withState.toLocaleString()}`);
    
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();




