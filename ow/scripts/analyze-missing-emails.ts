#!/usr/bin/env tsx
/**
 * Analyze contacts without emails and CSV data
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
  console.log('📊 Analyzing missing emails...\n');
  
  // Get people without email in DB
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
    },
    take: 20, // Just analyze first 20
  });
  
  // Load CSV
  const rootDir = join(__dirname, '..', '..');
  const csvPath = join(rootDir, 'people-23955722-71.csv');
  const csvRows = parseCSV(csvPath);
  
  console.log(`Analyzing first 20 contacts without emails:\n`);
  
  for (const person of peopleWithoutEmail) {
    const firstName = (person.firstName || '').toLowerCase().trim();
    const lastName = (person.lastName || '').toLowerCase().trim();
    
    // Find in CSV
    const csvMatch = csvRows.find(row => {
      const csvFirst = (row['First name'] || '').toLowerCase().trim();
      const csvLast = (row['Last name'] || '').toLowerCase().trim();
      return csvFirst === firstName && csvLast === lastName;
    });
    
    console.log(`${person.firstName} ${person.lastName}:`);
    
    if (!csvMatch) {
      console.log(`  ❌ Not found in CSV\n`);
      continue;
    }
    
    const emailWork = csvMatch['Email - Work'];
    const emailHome = csvMatch['Email - Home'];
    const emailOther = csvMatch['Email - Other'];
    
    console.log(`  ✅ Found in CSV:`);
    console.log(`     Email - Work: ${emailWork || '(empty)'}`);
    console.log(`     Email - Home: ${emailHome || '(empty)'}`);
    console.log(`     Email - Other: ${emailOther || '(empty)'}`);
    console.log(`     Name in CSV: "${csvMatch['Name']}"`);
    console.log('');
  }
  
  // Count how many in DB vs CSV have emails
  const dbWithoutEmail = await prisma.person.count({
    where: {
      AND: [
        { email: null },
        { emailWork: null },
        { emailHome: null },
      ]
    }
  });
  
  const csvWithoutEmail = csvRows.filter(row => {
    const emailWork = row['Email - Work'];
    const emailHome = row['Email - Home'];
    const emailOther = row['Email - Other'];
    return !isValidEmail(emailWork) && !isValidEmail(emailHome) && !isValidEmail(emailOther);
  }).length;
  
  console.log(`\n📊 Summary:`);
  console.log(`=`.repeat(80));
  console.log(`DB contacts without email: ${dbWithoutEmail.toLocaleString()}`);
  console.log(`CSV rows without email: ${csvWithoutEmail.toLocaleString()}`);
  console.log(`CSV total rows: ${csvRows.length.toLocaleString()}`);
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});





