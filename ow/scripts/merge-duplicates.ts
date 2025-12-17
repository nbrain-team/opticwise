#!/usr/bin/env tsx
/**
 * Merge duplicate contacts intelligently
 * Strategy: Keep most complete record, merge data, delete duplicates
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PersonData {
  id: string;
  name: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  emailWork: string | null;
  emailHome: string | null;
  emailOther: string | null;
  phone: string | null;
  phoneWork: string | null;
  phoneMobile: string | null;
  phoneHome: string | null;
  phoneOther: string | null;
  organizationId: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  [key: string]: any;
}

function scoreCompleteness(person: PersonData): number {
  let score = 0;
  
  // Email scoring (higher weight)
  if (person.email) score += 10;
  if (person.emailWork) score += 10;
  if (person.emailHome) score += 5;
  
  // Phone scoring
  if (person.phone) score += 8;
  if (person.phoneWork) score += 8;
  if (person.phoneMobile) score += 6;
  
  // Organization
  if (person.organizationId) score += 15;
  
  // Location
  if (person.city) score += 3;
  if (person.state) score += 3;
  
  // Notes
  if (person.notes) score += 5;
  
  // Activity metrics
  if (person.openDeals && person.openDeals > 0) score += 20;
  if (person.wonDeals && person.wonDeals > 0) score += 15;
  if (person.totalActivities && person.totalActivities > 0) score += 10;
  
  return score;
}

function mergePeopleData(people: PersonData[]): PersonData {
  // Sort by completeness score (highest first)
  const sorted = people.sort((a, b) => scoreCompleteness(b) - scoreCompleteness(a));
  
  // Start with the most complete record
  const merged = { ...sorted[0] };
  
  // Merge in data from other records (fill gaps)
  for (const person of sorted.slice(1)) {
    // Merge emails
    if (!merged.email && person.email) merged.email = person.email;
    if (!merged.emailWork && person.emailWork) merged.emailWork = person.emailWork;
    if (!merged.emailHome && person.emailHome) merged.emailHome = person.emailHome;
    if (!merged.emailOther && person.emailOther) merged.emailOther = person.emailOther;
    
    // Merge phones
    if (!merged.phone && person.phone) merged.phone = person.phone;
    if (!merged.phoneWork && person.phoneWork) merged.phoneWork = person.phoneWork;
    if (!merged.phoneMobile && person.phoneMobile) merged.phoneMobile = person.phoneMobile;
    if (!merged.phoneHome && person.phoneHome) merged.phoneHome = person.phoneHome;
    if (!merged.phoneOther && person.phoneOther) merged.phoneOther = person.phoneOther;
    
    // Merge location
    if (!merged.city && person.city) merged.city = person.city;
    if (!merged.state && person.state) merged.state = person.state;
    if (!merged.country && person.country) merged.country = person.country;
    if (!merged.zipCode && person.zipCode) merged.zipCode = person.zipCode;
    if (!merged.postalAddress && person.postalAddress) merged.postalAddress = person.postalAddress;
    
    // Merge notes (concatenate if both have notes)
    if (person.notes) {
      if (merged.notes && merged.notes !== person.notes) {
        merged.notes = `${merged.notes}\n\n[Merged from duplicate]: ${person.notes}`;
      } else if (!merged.notes) {
        merged.notes = person.notes;
      }
    }
    
    // Keep organization if not set
    if (!merged.organizationId && person.organizationId) {
      merged.organizationId = person.organizationId;
    }
  }
  
  return merged;
}

async function main() {
  console.log('🔄 Starting intelligent duplicate merge...\n');
  
  const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry run for safety
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No actual changes will be made');
    console.log('   Set DRY_RUN=false to execute actual merge\n');
  }
  
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
      emailOther: true,
      phone: true,
      phoneWork: true,
      phoneMobile: true,
      phoneHome: true,
      phoneOther: true,
      title: true,
      organizationId: true,
      city: true,
      state: true,
      country: true,
      zipCode: true,
      postalAddress: true,
      notes: true,
      birthday: true,
      linkedInProfile: true,
      openDeals: true,
      wonDeals: true,
      lostDeals: true,
      totalActivities: true,
      emailMessagesCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  // Group duplicates
  const duplicateGroups = new Map<string, typeof allPeople>();
  
  allPeople.forEach(person => {
    const firstName = (person.firstName || '').toLowerCase().trim();
    const lastName = (person.lastName || '').toLowerCase().trim();
    
    if (!firstName && !lastName) return;
    if (firstName.length < 2 && lastName.length < 2) return;
    
    const key = `${firstName}|||${lastName}`;
    
    if (!duplicateGroups.has(key)) {
      duplicateGroups.set(key, []);
    }
    duplicateGroups.get(key)!.push(person);
  });
  
  const actualDuplicates = Array.from(duplicateGroups.entries())
    .filter(([_, people]) => people.length > 1);
  
  console.log(`Found ${actualDuplicates.length.toLocaleString()} duplicate groups`);
  console.log(`Total records to merge: ${actualDuplicates.reduce((sum, [_, p]) => sum + p.length, 0).toLocaleString()}`);
  console.log(`Will delete: ${actualDuplicates.reduce((sum, [_, p]) => sum + (p.length - 1), 0).toLocaleString()} duplicate records\n`);
  
  let merged = 0;
  let deleted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const [key, people] of actualDuplicates) {
    const [firstName, lastName] = key.split('|||');
    
    try {
      // Check if has different organizations (be cautious)
      const uniqueOrgs = new Set(people.map(p => p.organizationId).filter(id => id));
      
      // Skip if more than 2 different organizations (needs manual review)
      if (uniqueOrgs.size > 2) {
        skipped++;
        if (skipped <= 5) {
          console.log(`⏭️  Skipped: ${firstName} ${lastName} - ${uniqueOrgs.size} different orgs (needs review)`);
        }
        continue;
      }
      
      // Merge the data
      const mergedData = mergePeopleData(people);
      const keepId = mergedData.id;
      const deleteIds = people.filter(p => p.id !== keepId).map(p => p.id);
      
      if (!DRY_RUN) {
        // First, delete duplicates to free up any email constraints
        await prisma.person.deleteMany({
          where: { id: { in: deleteIds } },
        });
        
        // Then update the kept record with merged data
        // Only update email if it's different and not null
        const updateData: any = {
          emailWork: mergedData.emailWork,
          emailHome: mergedData.emailHome,
          emailOther: mergedData.emailOther,
          phone: mergedData.phone,
          phoneWork: mergedData.phoneWork,
          phoneMobile: mergedData.phoneMobile,
          phoneHome: mergedData.phoneHome,
          phoneOther: mergedData.phoneOther,
          city: mergedData.city,
          state: mergedData.state,
          country: mergedData.country,
          zipCode: mergedData.zipCode,
          postalAddress: mergedData.postalAddress,
          notes: mergedData.notes,
          organizationId: mergedData.organizationId,
        };
        
        // Only update email if it's changing and not empty
        if (mergedData.email && mergedData.email !== people.find(p => p.id === keepId)?.email) {
          updateData.email = mergedData.email;
        }
        
        await prisma.person.update({
          where: { id: keepId },
          data: updateData,
        });
      }
      
      merged++;
      deleted += deleteIds.length;
      
      if (merged <= 10 || merged % 100 === 0) {
        console.log(`✅ ${merged}. Merged: ${firstName} ${lastName} (kept 1, deleted ${deleteIds.length})`);
      }
      
    } catch (err: any) {
      errors++;
      if (errors <= 5) {
        console.error(`❌ Error merging ${firstName} ${lastName}: ${err.message}`);
      }
    }
  }
  
  console.log(`\n✅ Merge Complete!`);
  console.log(`=`.repeat(80));
  console.log(`Merged groups: ${merged.toLocaleString()}`);
  console.log(`Deleted duplicates: ${deleted.toLocaleString()}`);
  console.log(`Skipped (needs review): ${skipped.toLocaleString()}`);
  console.log(`Errors: ${errors.toLocaleString()}`);
  
  if (DRY_RUN) {
    console.log(`\n⚠️  This was a DRY RUN - no actual changes were made`);
    console.log(`   Run with DRY_RUN=false to execute the merge`);
  } else {
    const finalCount = await prisma.person.count();
    console.log(`\n📊 Final contact count: ${finalCount.toLocaleString()}`);
  }
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

