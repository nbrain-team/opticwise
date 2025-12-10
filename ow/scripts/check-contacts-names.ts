#!/usr/bin/env tsx
/**
 * Check contacts first/last names in database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking contacts names in database...\n');
  
  // Total counts
  const total = await prisma.person.count();
  const withFirstName = await prisma.person.count({ where: { firstName: { not: '' } } });
  const withLastName = await prisma.person.count({ where: { lastName: { not: '' } } });
  const withBothNames = await prisma.person.count({ 
    where: { 
      AND: [
        { firstName: { not: '' } },
        { lastName: { not: '' } }
      ]
    } 
  });
  
  console.log(`📊 Database Statistics:`);
  console.log(`  Total People: ${total.toLocaleString()}`);
  console.log(`  With First Name: ${withFirstName.toLocaleString()} (${((withFirstName/total)*100).toFixed(1)}%)`);
  console.log(`  With Last Name: ${withLastName.toLocaleString()} (${((withLastName/total)*100).toFixed(1)}%)`);
  console.log(`  With BOTH Names: ${withBothNames.toLocaleString()} (${((withBothNames/total)*100).toFixed(1)}%)`);
  
  // Sample people without last names
  const noLastName = await prisma.person.findMany({
    where: { 
      lastName: ''
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      organization: {
        select: { name: true }
      }
    },
    take: 10
  });
  
  console.log(`\n📋 Sample people without last names (first 10):`);
  noLastName.forEach((p, i) => {
    console.log(`  ${i+1}. Name: "${p.name}" | First: "${p.firstName}" | Last: "${p.lastName || '(empty)'}" | Email: ${p.email || 'N/A'}`);
  });
  
  // Sample people WITH both names
  const withNames = await prisma.person.findMany({
    where: { 
      AND: [
        { firstName: { not: '' } },
        { lastName: { not: '' } }
      ]
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    take: 10
  });
  
  console.log(`\n✅ Sample people WITH both names (first 10):`);
  withNames.forEach((p, i) => {
    console.log(`  ${i+1}. Name: "${p.name}" | First: "${p.firstName}" | Last: "${p.lastName}" | Email: ${p.email || 'N/A'}`);
  });
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
