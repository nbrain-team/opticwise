#!/usr/bin/env tsx
/**
 * Check how contacts display in UI vs database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking UI Display vs Database...\n');
  
  // Get first 20 people as they would appear in UI (sorted by lastName)
  const people = await prisma.person.findMany({
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      emailWork: true,
      organization: {
        select: { name: true }
      }
    },
    orderBy: { lastName: 'asc' },
    take: 20
  });
  
  console.log('📊 First 20 Contacts (as shown in UI, sorted by lastName):');
  console.log('='.repeat(80));
  
  people.forEach((person, i) => {
    const displayEmail = person.emailWork || person.email || 'N/A';
    const orgName = person.organization?.name || 'N/A';
    
    console.log(`${i+1}. ${person.firstName} | ${person.lastName || '(empty)'}`);
    console.log(`   Full Name: "${person.name}"`);
    console.log(`   Email: ${displayEmail}`);
    console.log(`   Org: ${orgName}`);
    console.log('');
  });
  
  // Check if empty lastName appear first
  const emptyLastNames = await prisma.person.findMany({
    where: { lastName: '' },
    select: {
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      emailWork: true,
    },
    orderBy: { lastName: 'asc' },
    take: 5
  });
  
  console.log('\n📋 Contacts with EMPTY Last Names (first 5):');
  console.log('='.repeat(80));
  emptyLastNames.forEach((person, i) => {
    console.log(`${i+1}. First: "${person.firstName}" | Last: "${person.lastName || '(empty)'}"`);
    console.log(`   Full Name: "${person.name}"`);
    console.log(`   Email: ${person.emailWork || person.email || 'N/A'}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

