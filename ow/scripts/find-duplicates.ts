#!/usr/bin/env tsx
/**
 * Find duplicate contacts based on first name + last name
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding duplicate contacts...\n');
  
  // Get all people
  const allPeople = await prisma.person.findMany({
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      emailWork: true,
      emailHome: true,
      phone: true,
      phoneWork: true,
      phoneMobile: true,
      organizationId: true,
      organization: {
        select: { name: true }
      },
      city: true,
      state: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      openDeals: true,
      wonDeals: true,
      lostDeals: true,
      totalActivities: true,
      emailMessagesCount: true,
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' }
    ]
  });
  
  console.log(`Total contacts: ${allPeople.length.toLocaleString()}\n`);
  
  // Group by firstName + lastName (case-insensitive)
  const duplicateGroups = new Map<string, typeof allPeople>();
  
  allPeople.forEach(person => {
    const firstName = (person.firstName || '').toLowerCase().trim();
    const lastName = (person.lastName || '').toLowerCase().trim();
    
    // Skip if both names are empty or very short (likely corrupted)
    if (!firstName && !lastName) return;
    if (firstName.length < 2 && lastName.length < 2) return;
    
    const key = `${firstName}|||${lastName}`;
    
    if (!duplicateGroups.has(key)) {
      duplicateGroups.set(key, []);
    }
    duplicateGroups.get(key)!.push(person);
  });
  
  // Filter to only groups with duplicates
  const actualDuplicates = Array.from(duplicateGroups.entries())
    .filter(([_, people]) => people.length > 1)
    .sort((a, b) => b[1].length - a[1].length); // Sort by most duplicates first
  
  console.log(`📊 Duplicate Statistics:`);
  console.log(`=`.repeat(80));
  console.log(`Unique names: ${duplicateGroups.size.toLocaleString()}`);
  console.log(`Names with duplicates: ${actualDuplicates.length.toLocaleString()}`);
  console.log(`Total duplicate records: ${actualDuplicates.reduce((sum, [_, people]) => sum + people.length, 0).toLocaleString()}`);
  console.log(`Records that will remain after merge: ${actualDuplicates.length.toLocaleString()}`);
  console.log(`Records to be merged/deleted: ${actualDuplicates.reduce((sum, [_, people]) => sum + (people.length - 1), 0).toLocaleString()}\n`);
  
  // Show top 20 duplicate groups
  console.log(`📋 Top 20 Duplicate Groups:`);
  console.log(`=`.repeat(80));
  
  actualDuplicates.slice(0, 20).forEach(([key, people], idx) => {
    const [firstName, lastName] = key.split('|||');
    console.log(`\n${idx + 1}. ${firstName} ${lastName} - ${people.length} duplicates`);
    
    people.forEach((p, i) => {
      const emailCount = [p.email, p.emailWork, p.emailHome].filter(e => e).length;
      const phoneCount = [p.phone, p.phoneWork, p.phoneMobile].filter(ph => ph).length;
      const hasData = emailCount + phoneCount + (p.city ? 1 : 0) + (p.state ? 1 : 0);
      const activity = (p.openDeals || 0) + (p.wonDeals || 0) + (p.totalActivities || 0);
      
      console.log(`   ${i + 1}) ID: ${p.id.slice(0, 12)}...`);
      console.log(`      Email: ${p.emailWork || p.email || 'N/A'}`);
      console.log(`      Org: ${p.organization?.name || 'N/A'}`);
      console.log(`      Data richness: ${hasData} fields | Activity: ${activity}`);
      console.log(`      Created: ${p.createdAt.toISOString().split('T')[0]}`);
    });
  });
  
  // Analyze merge strategy
  console.log(`\n\n📈 Merge Strategy Analysis:`);
  console.log(`=`.repeat(80));
  
  let autoMergeable = 0;
  let needsReview = 0;
  let hasDifferentOrgs = 0;
  let hasDifferentEmails = 0;
  
  actualDuplicates.forEach(([_, people]) => {
    const uniqueOrgs = new Set(people.map(p => p.organizationId).filter(id => id));
    const uniqueEmails = new Set(
      people.flatMap(p => [p.email, p.emailWork, p.emailHome].filter(e => e))
    );
    
    if (uniqueOrgs.size > 1) hasDifferentOrgs++;
    if (uniqueEmails.size > 1) hasDifferentEmails++;
    
    // Auto-mergeable: same org or no org, and same/compatible emails
    if (uniqueOrgs.size <= 1 && uniqueEmails.size <= 3) {
      autoMergeable++;
    } else {
      needsReview++;
    }
  });
  
  console.log(`Auto-mergeable (safe): ${autoMergeable.toLocaleString()}`);
  console.log(`Needs review (different orgs/emails): ${needsReview.toLocaleString()}`);
  console.log(`Has different organizations: ${hasDifferentOrgs.toLocaleString()}`);
  console.log(`Has different emails: ${hasDifferentEmails.toLocaleString()}`);
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});





