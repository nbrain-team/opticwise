/**
 * Replace CRM Contacts with Clean Email-Based Contact List
 * 
 * This script:
 * 1. Backs up existing contacts to a JSON file
 * 2. Clears all current Person records
 * 3. Imports the clean contact list from extracted-contacts.csv
 * 
 * Usage:
 *   npx tsx scripts/replace-crm-contacts.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function replaceContacts() {
  console.log('\n🔄 CRM CONTACT REPLACEMENT');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Backup existing contacts
    console.log('\n📦 Step 1: Backing up existing contacts...');
    
    const existingContacts = await prisma.person.findMany();
    const backupPath = path.join(process.cwd(), `crm-contacts-backup-${Date.now()}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify(existingContacts, null, 2));
    console.log(`   ✓ Backed up ${existingContacts.length} contacts to: ${backupPath}`);
    
    // Step 2: Clear existing contacts
    console.log('\n🗑️  Step 2: Clearing existing contacts...');
    
    const deletedCount = await prisma.person.deleteMany();
    console.log(`   ✓ Deleted ${deletedCount.count} existing contacts`);
    
    // Step 3: Read new contact CSV
    console.log('\n📄 Step 3: Reading new contact list...');
    
    const csvPath = path.join(process.cwd(), 'extracted-contacts.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    console.log(`   ✓ Found ${lines.length - 1} contacts in CSV`);
    
    // Step 4: Parse and import contacts
    console.log('\n📥 Step 4: Importing new contacts...');
    
    let imported = 0;
    let skipped = 0;
    
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
      values.push(currentValue); // Add last value
      
      // Map CSV columns to data
      const email = values[0]?.trim();
      const fullName = values[1]?.trim();
      const firstName = values[2]?.trim();
      const lastName = values[3]?.trim();
      const company = values[4]?.trim();
      const jobTitle = values[5]?.trim();
      const phone = values[6]?.trim();
      const linkedin = values[7]?.trim();
      const address = values[8]?.trim();
      
      // Skip if no email or no first name
      if (!email || (!firstName && !fullName)) {
        skipped++;
        continue;
      }
      
      try {
        // Find or create organization if company exists
        let organizationId: string | undefined;
        
        if (company) {
          const org = await prisma.organization.upsert({
            where: { name: company },
            update: {},
            create: {
              name: company,
            },
          });
          organizationId = org.id;
        }
        
        // Create contact
        await prisma.person.create({
          data: {
            email: email,
            name: fullName || `${firstName} ${lastName}`.trim(),
            firstName: firstName || fullName?.split(' ')[0] || 'Unknown',
            lastName: lastName || fullName?.split(' ').slice(1).join(' ') || '',
            title: jobTitle || undefined,
            phone: phone || undefined,
            organizationId: organizationId,
            postalAddress: address || undefined,
            labels: linkedin ? `LinkedIn: ${linkedin}` : undefined,
          },
        });
        
        imported++;
        
        if (imported % 25 === 0) {
          console.log(`   ✓ Imported ${imported} contacts...`);
        }
        
      } catch (error: any) {
        console.error(`   ✗ Error importing ${email}: ${error.message}`);
        skipped++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CRM CONTACT REPLACEMENT COMPLETE');
    console.log('='.repeat(60));
    console.log(`   📦 Backup: ${backupPath}`);
    console.log(`   🗑️  Deleted: ${deletedCount.count} old contacts`);
    console.log(`   ✅ Imported: ${imported} new contacts`);
    console.log(`   ⏭️  Skipped: ${skipped} contacts`);
    console.log('='.repeat(60) + '\n');
    
    // Verify final count
    const finalCount = await prisma.person.count();
    console.log(`📊 Final contact count: ${finalCount}`);
    
  } catch (error) {
    console.error('Error replacing contacts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the replacement
replaceContacts().catch(console.error);
