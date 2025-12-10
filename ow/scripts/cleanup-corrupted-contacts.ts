#!/usr/bin/env tsx
/**
 * Cleanup Corrupted Contacts Script
 * 
 * This script identifies and removes/fixes contacts with corrupted data
 * caused by multiline CSV fields during import.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Patterns that indicate corrupted data
const CORRUPTED_PATTERNS = [
  /^(India|USA|UK|Canada|Netherlands|Belgium|Denmark|Australia|Germany|France|Spain|Italy|China|Japan|Brazil|Mexico),/i,
  /,,,,/,  // Multiple commas indicate CSV parsing issues
  /No consent,Not confirmed/i,
  /^\d{5}$/,  // ZIP codes as names
  /^[A-Z]{2}\s+\d{5}$/,  // State + ZIP as phone
  /^(Maharashtra|Andhra Pradesh|Karnataka|Tamil Nadu|Gujarat|Rajasthan|Punjab|Kerala|West Bengal)/i,  // Indian states
  /^(Colorado|Florida|London|Surrey|Amsterdam|Boulder|Golden|Westminster|Louisville|Lafayette|Lakewood|Independence|Painesville|Englewood|Vonore|Fenton|Dallas)/i,  // Cities as names
];

// Names that are clearly not person names
const INVALID_NAMES = [
  'Maharashtra', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Gujarat',
  'Colorado', 'Florida', 'London', 'Surrey', 'Amsterdam', 'Boulder', 
  'Golden', 'Westminster', 'Louisville', 'Lafayette', 'Lakewood',
  'Independence', 'Painesville', 'Englewood', 'Vonore', 'Fenton', 'Dallas',
  'Australien,,,,Founder', 'Work', 'TMMI', 'Ambavaram', 'Langbourn',
];

function isCorruptedValue(value: string | null): boolean {
  if (!value) return false;
  return CORRUPTED_PATTERNS.some(pattern => pattern.test(value));
}

function isInvalidName(name: string | null): boolean {
  if (!name) return true;
  // Check against invalid names list
  if (INVALID_NAMES.some(invalid => name.toLowerCase() === invalid.toLowerCase())) {
    return true;
  }
  // Check if name contains corrupted patterns
  if (isCorruptedValue(name)) {
    return true;
  }
  return false;
}

function cleanPhoneNumber(phone: string | null): string | null {
  if (!phone) return null;
  
  // If it contains corrupted patterns, return null
  if (isCorruptedValue(phone)) return null;
  
  // If it doesn't look like a phone number at all, return null
  // Valid phones should have mostly digits
  const digitCount = (phone.match(/\d/g) || []).length;
  if (digitCount < 7) return null;
  
  // If it's a state + zip code, return null
  if (/^[A-Z]{2}\s+\d{5}/.test(phone)) return null;
  
  // If it contains letters that aren't part of phone formatting, return null
  const cleanedForCheck = phone.replace(/[\s\-\(\)\+\']/g, '');
  if (/[a-zA-Z]/.test(cleanedForCheck) && !/^[\d]+$/.test(cleanedForCheck.replace(/[a-zA-Z]/g, ''))) {
    // Allow things like "800-AAA-help" but not "India,,,,Senior Research"
    if (phone.length > 20) return null;
  }
  
  return phone;
}

async function analyzeCorruptedRecords() {
  console.log('🔍 Analyzing corrupted records...\n');
  
  // Find records with corrupted phone numbers
  const allPeople = await prisma.person.findMany({
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      phoneWork: true,
      phoneMobile: true,
      email: true,
      emailWork: true,
      organizationId: true,
    }
  });
  
  const corruptedByPhone: typeof allPeople = [];
  const corruptedByName: typeof allPeople = [];
  const cleanRecords: typeof allPeople = [];
  
  for (const person of allPeople) {
    const hasCorruptedPhone = isCorruptedValue(person.phone) || 
                              isCorruptedValue(person.phoneWork) || 
                              isCorruptedValue(person.phoneMobile);
    const hasInvalidName = isInvalidName(person.name) || isInvalidName(person.firstName);
    
    if (hasInvalidName) {
      corruptedByName.push(person);
    } else if (hasCorruptedPhone) {
      corruptedByPhone.push(person);
    } else {
      cleanRecords.push(person);
    }
  }
  
  console.log(`📊 Analysis Results:`);
  console.log(`  Total records: ${allPeople.length}`);
  console.log(`  Clean records: ${cleanRecords.length}`);
  console.log(`  Corrupted by name: ${corruptedByName.length}`);
  console.log(`  Corrupted by phone only: ${corruptedByPhone.length}`);
  
  return { corruptedByPhone, corruptedByName, cleanRecords };
}

async function cleanupPhoneFields() {
  console.log('\n🧹 Cleaning corrupted phone fields...\n');
  
  const peopleWithPhones = await prisma.person.findMany({
    where: {
      OR: [
        { phone: { not: null } },
        { phoneWork: { not: null } },
        { phoneMobile: { not: null } },
      ]
    },
    select: {
      id: true,
      phone: true,
      phoneWork: true,
      phoneMobile: true,
    }
  });
  
  let cleaned = 0;
  
  for (const person of peopleWithPhones) {
    const cleanedPhone = cleanPhoneNumber(person.phone);
    const cleanedPhoneWork = cleanPhoneNumber(person.phoneWork);
    const cleanedPhoneMobile = cleanPhoneNumber(person.phoneMobile);
    
    // Check if any cleaning is needed
    if (cleanedPhone !== person.phone || 
        cleanedPhoneWork !== person.phoneWork || 
        cleanedPhoneMobile !== person.phoneMobile) {
      
      await prisma.person.update({
        where: { id: person.id },
        data: {
          phone: cleanedPhone,
          phoneWork: cleanedPhoneWork,
          phoneMobile: cleanedPhoneMobile,
        }
      });
      cleaned++;
    }
  }
  
  console.log(`  Cleaned phone fields for ${cleaned} records`);
  return cleaned;
}

async function deleteCorruptedNameRecords() {
  console.log('\n🗑️ Deleting records with corrupted names...\n');
  
  // Get all people and filter in JS for complex patterns
  const allPeople = await prisma.person.findMany({
    select: {
      id: true,
      name: true,
      firstName: true,
      email: true,
      organizationId: true,
    }
  });
  
  const toDelete: string[] = [];
  
  for (const person of allPeople) {
    // Skip if they have a valid email - might be recoverable
    if (person.email && person.email.includes('@')) {
      continue;
    }
    
    // Check if name is invalid
    if (isInvalidName(person.name) || isInvalidName(person.firstName)) {
      toDelete.push(person.id);
    }
  }
  
  console.log(`  Found ${toDelete.length} records with corrupted names to delete`);
  
  if (toDelete.length > 0) {
    // Delete in batches
    const batchSize = 100;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      await prisma.person.deleteMany({
        where: { id: { in: batch } }
      });
      console.log(`  Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(toDelete.length/batchSize)}`);
    }
  }
  
  return toDelete.length;
}

async function main() {
  console.log('🚀 Starting Corrupted Contacts Cleanup\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Analyze current state
    const { corruptedByPhone, corruptedByName } = await analyzeCorruptedRecords();
    
    // Step 2: Clean phone fields (fix corrupted phone data)
    const phonesClean = await cleanupPhoneFields();
    
    // Step 3: Delete records with corrupted names (unfixable)
    const deleted = await deleteCorruptedNameRecords();
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Cleanup Complete!\n');
    
    const finalCount = await prisma.person.count();
    const withEmail = await prisma.person.count({ where: { email: { not: null } } });
    const withOrg = await prisma.person.count({ where: { organizationId: { not: null } } });
    const withPhone = await prisma.person.count({ 
      where: { 
        OR: [
          { phone: { not: null } },
          { phoneWork: { not: null } },
          { phoneMobile: { not: null } },
        ]
      } 
    });
    
    console.log(`📊 Final Database Stats:`);
    console.log(`  Total People: ${finalCount.toLocaleString()}`);
    console.log(`  With Email: ${withEmail.toLocaleString()}`);
    console.log(`  With Organization: ${withOrg.toLocaleString()}`);
    console.log(`  With Phone: ${withPhone.toLocaleString()}`);
    console.log(`\n  Phone fields cleaned: ${phonesClean}`);
    console.log(`  Corrupted records deleted: ${deleted}`);
    
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();




