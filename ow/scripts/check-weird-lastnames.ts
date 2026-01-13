#!/usr/bin/env tsx
/**
 * Check for contacts with non-alphabetic last names
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for weird last names...\n');
  
  // Get people with non-empty lastName that contains special characters
  const people = await prisma.person.findMany({
    where: {
      lastName: { not: '' }
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: { lastName: 'asc' },
    take: 30
  });
  
  console.log('First 30 contacts sorted by lastName ASC:');
  console.log('='.repeat(80));
  
  people.forEach((p, i) => {
    const hasAlpha = /[a-zA-Z]/.test(p.lastName);
    const hasSpecial = /[^a-zA-Z\s'-]/.test(p.lastName);
    const flag = !hasAlpha || hasSpecial ? ' ⚠️  SPECIAL' : '';
    
    console.log(`${i+1}. "${p.firstName}" | "${p.lastName}"${flag}`);
    console.log(`   Full Name: "${p.name}" | Email: ${p.email || 'N/A'}`);
  });
  
  // Count by pattern
  const allPeople = await prisma.person.findMany({
    select: { lastName: true }
  });
  
  let empty = 0;
  let alphaOnly = 0;
  let hasSpecialChars = 0;
  let nonAlpha = 0;
  
  allPeople.forEach(p => {
    if (!p.lastName || p.lastName === '') {
      empty++;
    } else if (!/[a-zA-Z]/.test(p.lastName)) {
      nonAlpha++;
    } else if (/[^a-zA-Z\s'-]/.test(p.lastName)) {
      hasSpecialChars++;
    } else {
      alphaOnly++;
    }
  });
  
  console.log('\n📊 Last Name Patterns:');
  console.log('='.repeat(80));
  console.log(`Empty: ${empty}`);
  console.log(`Alpha only (normal): ${alphaOnly}`);
  console.log(`Has special characters: ${hasSpecialChars}`);
  console.log(`Non-alphabetic (symbols only): ${nonAlpha}`);
  console.log(`Total: ${allPeople.length}`);
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});




