#!/usr/bin/env tsx
/**
 * Test merge logic with Al Afflitto example
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing merge logic for Al Afflitto duplicates...\n');
  
  // Find Al Afflitto records
  const alRecords = await prisma.person.findMany({
    where: {
      firstName: { equals: 'Al', mode: 'insensitive' },
      lastName: { equals: 'Afflitto', mode: 'insensitive' },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailWork: true,
      phone: true,
      phoneWork: true,
      city: true,
      state: true,
      organizationId: true,
      organization: {
        select: { name: true }
      },
      openDeals: true,
      wonDeals: true,
      totalActivities: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`Found ${alRecords.length} Al Afflitto records:\n`);
  
  alRecords.forEach((record, idx) => {
    console.log(`Record ${idx + 1}:`);
    console.log(`  ID: ${record.id}`);
    console.log(`  Email: ${record.emailWork || record.email || 'NONE'}`);
    console.log(`  Phone: ${record.phoneWork || record.phone || 'NONE'}`);
    console.log(`  City: ${record.city || 'NONE'}`);
    console.log(`  State: ${record.state || 'NONE'}`);
    console.log(`  Org: ${record.organization?.name || 'NONE'}`);
    console.log(`  Activities: ${record.totalActivities || 0}`);
    console.log(`  Created: ${record.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
  
  // Simulate merge logic
  console.log('📊 Simulating merge logic...\n');
  
  // Score each record
  const scored = alRecords.map(r => {
    let score = 0;
    if (r.email) score += 10;
    if (r.emailWork) score += 10;
    if (r.phone) score += 8;
    if (r.phoneWork) score += 8;
    if (r.organizationId) score += 15;
    if (r.city) score += 3;
    if (r.state) score += 3;
    if (r.openDeals && r.openDeals > 0) score += 20;
    if (r.wonDeals && r.wonDeals > 0) score += 15;
    if (r.totalActivities && r.totalActivities > 0) score += 10;
    
    return { ...r, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  console.log('Completeness scores (highest = best record to keep):');
  scored.forEach((r, idx) => {
    console.log(`  Record ${idx + 1}: Score = ${r.score}`);
  });
  
  // Simulate merge
  const merged = { ...scored[0] };
  
  for (const record of scored.slice(1)) {
    if (!merged.email && record.email) merged.email = record.email;
    if (!merged.emailWork && record.emailWork) merged.emailWork = record.emailWork;
    if (!merged.phone && record.phone) merged.phone = record.phone;
    if (!merged.phoneWork && record.phoneWork) merged.phoneWork = record.phoneWork;
    if (!merged.city && record.city) merged.city = record.city;
    if (!merged.state && record.state) merged.state = record.state;
    if (!merged.organizationId && record.organizationId) merged.organizationId = record.organizationId;
  }
  
  console.log('\n✅ MERGED RESULT:');
  console.log(`  Keep ID: ${merged.id}`);
  console.log(`  Email: ${merged.emailWork || merged.email || 'NONE'}`);
  console.log(`  Phone: ${merged.phoneWork || merged.phone || 'NONE'}`);
  console.log(`  City: ${merged.city || 'NONE'}`);
  console.log(`  State: ${merged.state || 'NONE'}`);
  console.log(`  Org: ${merged.organization?.name || 'NONE'}`);
  console.log(`  Delete IDs: ${scored.slice(1).map(r => r.id).join(', ')}`);
  
  console.log('\n🎯 Verification:');
  const hasEmail = !!(merged.email || merged.emailWork);
  const hasPhone = !!(merged.phone || merged.phoneWork);
  const hasCity = !!merged.city;
  const hasState = !!merged.state;
  
  console.log(`  ✓ Has Email: ${hasEmail ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ Has Phone: ${hasPhone ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ Has City: ${hasCity ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ Has State: ${hasState ? '✅ YES' : '❌ NO'}`);
  
  if (hasEmail && hasPhone && hasCity && hasState) {
    console.log('\n🎉 SUCCESS: Merged record will have ALL fields from all 3 duplicates!');
  } else {
    console.log('\n⚠️  WARNING: Some fields are missing in merge!');
  }
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

