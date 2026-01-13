#!/usr/bin/env tsx
/**
 * Find contacts without emails in DB and populate from CSV
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
    trim: true,
  });
  return records;
}

function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function main() {
  const DRY_RUN = process.env.DRY_RUN !== 'false';
  
  console.log('📧 Finding contacts without emails and populating from CSV...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No actual changes will be made');
    console.log('   Set DRY_RUN=false to execute actual updates\n');
  }
  
  // Get all people without ANY email
  const peopleWithoutEmail = await prisma.person.findMany({
    where: {
      AND: [
        { email: null },
        { emailWork: null },
        { emailHome: null },
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      email: true,
      emailWork: true,
      emailHome: true,
      organizationId: true,
      organization: {
        select: { name: true }
      },
    },
  });
  
  console.log(`Found ${peopleWithoutEmail.length.toLocaleString()} contacts without any email\n`);
  
  // Load CSV
  const rootDir = join(__dirname, '..', '..');
  const csvPath = join(rootDir, 'people-23955722-71.csv');
  console.log(`Reading CSV: ${csvPath}...`);
  
  const csvRows = parseCSV(csvPath);
  console.log(`CSV has ${csvRows.length.toLocaleString()} rows\n`);
  
  // Create lookup map by first+last name (case insensitive)
  const csvByName = new Map<string, CSVRow[]>();
  
  csvRows.forEach(row => {
    const firstName = (row['First name'] || '').toLowerCase().trim();
    const lastName = (row['Last name'] || '').toLowerCase().trim();
    const key = `${firstName}|||${lastName}`;
    
    if (!csvByName.has(key)) {
      csvByName.set(key, []);
    }
    csvByName.get(key)!.push(row);
  });
  
  console.log('📊 Starting email population...\n');
  
  let matched = 0;
  let updated = 0;
  let notFound = 0;
  let multipleMatches = 0;
  let noEmailInCSV = 0;
  
  for (const person of peopleWithoutEmail) {
    const firstName = (person.firstName || '').toLowerCase().trim();
    const lastName = (person.lastName || '').toLowerCase().trim();
    const key = `${firstName}|||${lastName}`;
    
    const csvMatches = csvByName.get(key);
    
    if (!csvMatches || csvMatches.length === 0) {
      notFound++;
      continue;
    }
    
    matched++;
    
    // If multiple CSV matches, try to narrow down by organization
    let bestMatch = csvMatches[0];
    
    if (csvMatches.length > 1) {
      multipleMatches++;
      
      // Try to find match by organization
      if (person.organization?.name) {
        const orgMatch = csvMatches.find(row => 
          row['Organization']?.toLowerCase().includes(person.organization!.name.toLowerCase())
        );
        if (orgMatch) {
          bestMatch = orgMatch;
        }
      }
    }
    
    // Extract emails from CSV (handle comma-separated lists)
    const extractFirstEmail = (emailField: string | null): string | null => {
      if (!emailField) return null;
      const emails = emailField.split(',').map(e => e.trim()).filter(e => isValidEmail(e));
      return emails.length > 0 ? emails[0] : null;
    };
    
    const emailWork = extractFirstEmail(bestMatch['Email - Work']);
    const emailHome = extractFirstEmail(bestMatch['Email - Home']);
    const emailOther = extractFirstEmail(bestMatch['Email - Other']);
    
    const primaryEmail = emailWork || emailHome || emailOther;
    
    if (!primaryEmail) {
      noEmailInCSV++;
      if (noEmailInCSV <= 5) {
        console.log(`⚠️  No email in CSV for: ${person.firstName} ${person.lastName}`);
      }
      continue;
    }
    
    // Check if this email is already used by another person
    const existingPerson = await prisma.person.findUnique({
      where: { email: primaryEmail },
    });
    
    if (existingPerson && existingPerson.id !== person.id) {
      // Email already in use, skip
      if (updated <= 5) {
        console.log(`⚠️  Email ${primaryEmail} already in use by another contact, skipping ${person.firstName} ${person.lastName}`);
      }
      continue;
    }
    
    if (!DRY_RUN) {
      await prisma.person.update({
        where: { id: person.id },
        data: {
          email: primaryEmail,
          emailWork: emailWork,
          emailHome: emailHome,
          emailOther: emailOther,
        },
      });
    }
    
    updated++;
    
    if (updated <= 10 || updated % 100 === 0) {
      console.log(`✅ ${updated}. Updated: ${person.firstName} ${person.lastName} → ${primaryEmail}`);
    }
  }
  
  console.log(`\n✅ Email Population Complete!`);
  console.log(`=`.repeat(80));
  console.log(`Matched in CSV: ${matched.toLocaleString()}`);
  console.log(`Updated with email: ${updated.toLocaleString()}`);
  console.log(`Multiple CSV matches: ${multipleMatches.toLocaleString()}`);
  console.log(`Not found in CSV: ${notFound.toLocaleString()}`);
  console.log(`No email in CSV: ${noEmailInCSV.toLocaleString()}`);
  
  if (DRY_RUN) {
    console.log(`\n⚠️  This was a DRY RUN - no actual changes were made`);
    console.log(`   Run with DRY_RUN=false to execute the updates`);
  } else {
    const stillWithoutEmail = await prisma.person.count({
      where: {
        AND: [
          { email: null },
          { emailWork: null },
          { emailHome: null },
        ]
      }
    });
    console.log(`\n📊 Contacts still without email: ${stillWithoutEmail.toLocaleString()}`);
  }
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});




