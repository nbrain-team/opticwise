#!/usr/bin/env tsx
/**
 * Analyze CSV to check first/last name data quality
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

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

async function main() {
  const rootDir = join(__dirname, '..', '..');
  const peoplePath = join(rootDir, 'people-23955722-71.csv');
  
  console.log('📊 Analyzing CSV Name Data...\n');
  console.log(`Reading: ${peoplePath}\n`);
  
  const rows = parseCSV(peoplePath);
  
  let total = 0;
  let withFirstName = 0;
  let withLastName = 0;
  let withBothNames = 0;
  let missingLastName: Array<{name: string, firstName: string, lastName: string, email: string}> = [];
  
  for (const row of rows) {
    total++;
    const firstName = row['First name']?.trim() || '';
    const lastName = row['Last name']?.trim() || '';
    const name = row['Name']?.trim() || '';
    const email = row['Email - Work']?.trim() || row['Email - Home']?.trim() || '';
    
    if (firstName) withFirstName++;
    if (lastName) withLastName++;
    if (firstName && lastName) withBothNames++;
    
    if (!lastName && missingLastName.length < 20) {
      missingLastName.push({
        name,
        firstName,
        lastName,
        email
      });
    }
  }
  
  console.log(`📈 CSV Statistics:`);
  console.log(`  Total Rows: ${total.toLocaleString()}`);
  console.log(`  With First Name: ${withFirstName.toLocaleString()} (${((withFirstName/total)*100).toFixed(1)}%)`);
  console.log(`  With Last Name: ${withLastName.toLocaleString()} (${((withLastName/total)*100).toFixed(1)}%)`);
  console.log(`  With BOTH Names: ${withBothNames.toLocaleString()} (${((withBothNames/total)*100).toFixed(1)}%)`);
  console.log(`  Missing Last Name: ${(total - withLastName).toLocaleString()}`);
  
  console.log(`\n📋 Sample CSV Records Missing Last Name (first 20):`);
  missingLastName.forEach((p, i) => {
    console.log(`  ${i+1}. Name: "${p.name}" | First: "${p.firstName}" | Last: "${p.lastName || '(empty)'}" | Email: ${p.email || 'N/A'}`);
  });
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

