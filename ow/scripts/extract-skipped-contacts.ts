/**
 * Extract Skipped Contacts to CSV
 * 
 * Creates a CSV of contacts that were skipped during CRM import
 * (contacts with no first name and no full name)
 */

import fs from 'fs';
import path from 'path';

function extractSkippedContacts() {
  console.log('\n📋 EXTRACTING SKIPPED CONTACTS');
  console.log('='.repeat(60));
  
  const csvPath = path.join(process.cwd(), 'extracted-contacts.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0];
  
  console.log(`\n📄 Reading: ${csvPath}`);
  console.log(`   Total lines: ${lines.length - 1}`);
  
  const skippedLines: string[] = [headers]; // Include header
  let skippedCount = 0;
  let importedCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handling quoted fields)
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);
    
    const email = values[0]?.trim();
    const fullName = values[1]?.trim();
    const firstName = values[2]?.trim();
    
    // Check if would be skipped (no email OR no name)
    if (!email || (!firstName && !fullName)) {
      skippedLines.push(line);
      skippedCount++;
    } else {
      importedCount++;
    }
  }
  
  // Write skipped contacts to new CSV
  const skippedPath = path.join(process.cwd(), 'skipped-contacts.csv');
  fs.writeFileSync(skippedPath, skippedLines.join('\n'), 'utf-8');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ EXTRACTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`   ✅ Would be imported: ${importedCount}`);
  console.log(`   ⏭️  Would be skipped: ${skippedCount}`);
  console.log(`   📄 Skipped CSV: ${skippedPath}`);
  console.log('='.repeat(60) + '\n');
  
  // Show sample of skipped contacts
  console.log('📋 Sample Skipped Contacts (first 10):');
  console.log('-'.repeat(60));
  
  for (let i = 1; i < Math.min(11, skippedLines.length); i++) {
    const line = skippedLines[i];
    const email = line.split(',')[0];
    console.log(`   ${i}. ${email}`);
  }
  
  console.log('\n');
}

extractSkippedContacts();
