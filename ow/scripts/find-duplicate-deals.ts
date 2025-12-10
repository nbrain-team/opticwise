#!/usr/bin/env tsx
/**
 * Find duplicate deals based on title + organization
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding duplicate deals...\n');
  
  // Get all deals
  const allDeals = await prisma.deal.findMany({
    select: {
      id: true,
      title: true,
      value: true,
      currency: true,
      status: true,
      organizationId: true,
      personId: true,
      organization: {
        select: { name: true }
      },
      person: {
        select: { firstName: true, lastName: true }
      },
      stage: {
        select: { name: true }
      },
      expectedCloseDate: true,
      addTime: true,
      totalActivities: true,
      emailMessagesCount: true,
    },
    orderBy: { addTime: 'desc' }
  });
  
  console.log(`Total deals: ${allDeals.length.toLocaleString()}\n`);
  
  // Group by title + organizationId (case-insensitive title)
  const duplicateGroups = new Map<string, typeof allDeals>();
  
  allDeals.forEach(deal => {
    const title = (deal.title || '').toLowerCase().trim();
    const orgId = deal.organizationId || 'NO_ORG';
    
    // Skip if title is too short (likely corrupted)
    if (title.length < 3) return;
    
    const key = `${title}|||${orgId}`;
    
    if (!duplicateGroups.has(key)) {
      duplicateGroups.set(key, []);
    }
    duplicateGroups.get(key)!.push(deal);
  });
  
  // Filter to only groups with duplicates
  const actualDuplicates = Array.from(duplicateGroups.entries())
    .filter(([_, deals]) => deals.length > 1)
    .sort((a, b) => b[1].length - a[1].length); // Sort by most duplicates first
  
  console.log(`📊 Duplicate Statistics:`);
  console.log(`=`.repeat(80));
  console.log(`Unique deals: ${duplicateGroups.size.toLocaleString()}`);
  console.log(`Deals with duplicates: ${actualDuplicates.length.toLocaleString()}`);
  console.log(`Total duplicate records: ${actualDuplicates.reduce((sum, [_, deals]) => sum + deals.length, 0).toLocaleString()}`);
  console.log(`Records that will remain after merge: ${actualDuplicates.length.toLocaleString()}`);
  console.log(`Records to be merged/deleted: ${actualDuplicates.reduce((sum, [_, deals]) => sum + (deals.length - 1), 0).toLocaleString()}\n`);
  
  // Show top 20 duplicate groups
  console.log(`📋 Top 20 Duplicate Groups:`);
  console.log(`=`.repeat(80));
  
  actualDuplicates.slice(0, 20).forEach(([key, deals], idx) => {
    const [title] = key.split('|||');
    console.log(`\n${idx + 1}. "${title}" - ${deals.length} duplicates`);
    
    deals.forEach((d, i) => {
      const value = d.value.toNumber();
      const activity = (d.totalActivities || 0) + (d.emailMessagesCount || 0);
      
      console.log(`   ${i + 1}) ID: ${d.id.slice(0, 12)}...`);
      console.log(`      Value: ${d.currency} ${value.toLocaleString()}`);
      console.log(`      Status: ${d.status} | Stage: ${d.stage.name}`);
      console.log(`      Org: ${d.organization?.name || 'N/A'}`);
      console.log(`      Person: ${d.person ? `${d.person.firstName} ${d.person.lastName}` : 'N/A'}`);
      console.log(`      Activity: ${activity} | Created: ${d.addTime.toISOString().split('T')[0]}`);
    });
  });
  
  // Analyze merge strategy
  console.log(`\n\n📈 Merge Strategy Analysis:`);
  console.log(`=`.repeat(80));
  
  let sameStatus = 0;
  let differentStatus = 0;
  let sameValue = 0;
  let differentValue = 0;
  
  actualDuplicates.forEach(([_, deals]) => {
    const uniqueStatuses = new Set(deals.map(d => d.status));
    const uniqueValues = new Set(deals.map(d => d.value.toString()));
    
    if (uniqueStatuses.size === 1) sameStatus++;
    else differentStatus++;
    
    if (uniqueValues.size === 1) sameValue++;
    else differentValue++;
  });
  
  console.log(`Same status across duplicates: ${sameStatus.toLocaleString()}`);
  console.log(`Different statuses (needs review): ${differentStatus.toLocaleString()}`);
  console.log(`Same value across duplicates: ${sameValue.toLocaleString()}`);
  console.log(`Different values (needs review): ${differentValue.toLocaleString()}`);
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
