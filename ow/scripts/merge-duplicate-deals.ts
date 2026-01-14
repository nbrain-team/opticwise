#!/usr/bin/env tsx
/**
 * Merge duplicate deals intelligently
 * Strategy: Keep most complete/recent record, merge data, delete duplicates
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function scoreCompleteness(deal: any): number {
  let score = 0;
  
  // Value and financial data (higher weight)
  if (deal.value && deal.value.toNumber() > 0) score += 20;
  if (deal.arrForecast && deal.arrForecast.toNumber() > 0) score += 15;
  if (deal.capexRom && deal.capexRom.toNumber() > 0) score += 15;
  if (deal.mrr && deal.mrr.toNumber() > 0) score += 10;
  if (deal.arr && deal.arr.toNumber() > 0) score += 10;
  
  // Activity metrics
  if (deal.totalActivities && deal.totalActivities > 0) score += 20;
  if (deal.emailMessagesCount && deal.emailMessagesCount > 0) score += 10;
  if (deal.doneActivities && deal.doneActivities > 0) score += 5;
  
  // Linked entities
  if (deal.personId) score += 10;
  if (deal.organizationId) score += 10;
  
  // Property details
  if (deal.propertyAddress) score += 8;
  if (deal.propertyType) score += 5;
  if (deal.qty) score += 5;
  
  // Sales qualification
  if (deal.leadSource) score += 5;
  if (deal.technicalPOC) score += 5;
  if (deal.icpSegment) score += 5;
  if (deal.readinessScore) score += 5;
  
  // Dates (prefer more recent)
  if (deal.expectedCloseDate) score += 5;
  if (deal.nextActivityDate) score += 3;
  
  // Status (won deals are more valuable)
  if (deal.status === 'won') score += 30;
  else if (deal.status === 'open') score += 10;
  
  return score;
}

function mergeDealsData(deals: any[]): any {
  // Sort by completeness score (highest first)
  const sorted = deals.sort((a, b) => {
    const scoreA = scoreCompleteness(a);
    const scoreB = scoreCompleteness(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    // If same score, prefer more recent
    return new Date(b.addTime).getTime() - new Date(a.addTime).getTime();
  });
  
  // Start with the most complete record
  const merged = { ...sorted[0] };
  
  // Merge in data from other records (fill gaps)
  for (const deal of sorted.slice(1)) {
    // Merge financial data (take highest values)
    if (deal.value && (!merged.value || deal.value.toNumber() > merged.value.toNumber())) {
      merged.value = deal.value;
    }
    if (deal.arrForecast && (!merged.arrForecast || deal.arrForecast.toNumber() > merged.arrForecast.toNumber())) {
      merged.arrForecast = deal.arrForecast;
    }
    if (deal.capexRom && (!merged.capexRom || deal.capexRom.toNumber() > merged.capexRom.toNumber())) {
      merged.capexRom = deal.capexRom;
    }
    
    // Fill gaps in other fields
    if (!merged.personId && deal.personId) merged.personId = deal.personId;
    if (!merged.propertyAddress && deal.propertyAddress) merged.propertyAddress = deal.propertyAddress;
    if (!merged.propertyType && deal.propertyType) merged.propertyType = deal.propertyType;
    if (!merged.qty && deal.qty) merged.qty = deal.qty;
    if (!merged.goLiveTarget && deal.goLiveTarget) merged.goLiveTarget = deal.goLiveTarget;
    if (!merged.leadSource && deal.leadSource) merged.leadSource = deal.leadSource;
    if (!merged.technicalPOC && deal.technicalPOC) merged.technicalPOC = deal.technicalPOC;
    if (!merged.icpSegment && deal.icpSegment) merged.icpSegment = deal.icpSegment;
    if (!merged.readinessScore && deal.readinessScore) merged.readinessScore = deal.readinessScore;
    if (!merged.ddiAuditStatus && deal.ddiAuditStatus) merged.ddiAuditStatus = deal.ddiAuditStatus;
    if (!merged.expectedCloseDate && deal.expectedCloseDate) merged.expectedCloseDate = deal.expectedCloseDate;
    
    // Sum activity metrics
    if (deal.totalActivities) {
      merged.totalActivities = (merged.totalActivities || 0) + deal.totalActivities;
    }
    if (deal.emailMessagesCount) {
      merged.emailMessagesCount = (merged.emailMessagesCount || 0) + deal.emailMessagesCount;
    }
    if (deal.doneActivities) {
      merged.doneActivities = (merged.doneActivities || 0) + deal.doneActivities;
    }
    if (deal.activitiesToDo) {
      merged.activitiesToDo = (merged.activitiesToDo || 0) + deal.activitiesToDo;
    }
  }
  
  return merged;
}

async function main() {
  console.log('🔄 Starting intelligent deal duplicate merge...\n');
  
  const DRY_RUN = process.env.DRY_RUN !== 'false';
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No actual changes will be made');
    console.log('   Set DRY_RUN=false to execute actual merge\n');
  }
  
  // Get all deals
  const allDeals = await prisma.deal.findMany({
    include: {
      organization: { select: { name: true } },
      person: { select: { firstName: true, lastName: true } },
      stage: { select: { name: true } },
    },
  });
  
  // Group duplicates by title + organizationId
  const duplicateGroups = new Map<string, typeof allDeals>();
  
  allDeals.forEach(deal => {
    const title = (deal.title || '').toLowerCase().trim();
    const orgId = deal.organizationId || 'NO_ORG';
    
    if (title.length < 3) return;
    
    const key = `${title}|||${orgId}`;
    
    if (!duplicateGroups.has(key)) {
      duplicateGroups.set(key, []);
    }
    duplicateGroups.get(key)!.push(deal);
  });
  
  const actualDuplicates = Array.from(duplicateGroups.entries())
    .filter(([_, deals]) => deals.length > 1);
  
  console.log(`Found ${actualDuplicates.length.toLocaleString()} duplicate groups`);
  console.log(`Total records to merge: ${actualDuplicates.reduce((sum, [_, d]) => sum + d.length, 0).toLocaleString()}`);
  console.log(`Will delete: ${actualDuplicates.reduce((sum, [_, d]) => sum + (d.length - 1), 0).toLocaleString()} duplicate records\n`);
  
  let merged = 0;
  let deleted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const [key, deals] of actualDuplicates) {
    const [title] = key.split('|||');
    
    try {
      // Check if has different statuses (be cautious with won/lost)
      const uniqueStatuses = new Set(deals.map(d => d.status));
      
      // Skip if has both won and lost (needs manual review)
      if (uniqueStatuses.has('won') && uniqueStatuses.has('lost')) {
        skipped++;
        if (skipped <= 5) {
          console.log(`⏭️  Skipped: ${title} - has both won and lost status (needs review)`);
        }
        continue;
      }
      
      // Merge the data
      const mergedData = mergeDealsData(deals);
      const keepId = mergedData.id;
      const deleteIds = deals.filter(d => d.id !== keepId).map(d => d.id);
      
      if (!DRY_RUN) {
        // Update the kept record with merged data
        await prisma.deal.update({
          where: { id: keepId },
          data: {
            value: mergedData.value,
            personId: mergedData.personId,
            propertyAddress: mergedData.propertyAddress,
            propertyType: mergedData.propertyType,
            qty: mergedData.qty,
            goLiveTarget: mergedData.goLiveTarget,
            arrForecast: mergedData.arrForecast,
            capexRom: mergedData.capexRom,
            leadSource: mergedData.leadSource,
            technicalPOC: mergedData.technicalPOC,
            icpSegment: mergedData.icpSegment,
            readinessScore: mergedData.readinessScore,
            ddiAuditStatus: mergedData.ddiAuditStatus,
            expectedCloseDate: mergedData.expectedCloseDate,
            totalActivities: mergedData.totalActivities,
            emailMessagesCount: mergedData.emailMessagesCount,
            doneActivities: mergedData.doneActivities,
            activitiesToDo: mergedData.activitiesToDo,
          },
        });
        
        // Delete duplicates
        await prisma.deal.deleteMany({
          where: { id: { in: deleteIds } },
        });
      }
      
      merged++;
      deleted += deleteIds.length;
      
      if (merged <= 10 || merged % 50 === 0) {
        console.log(`✅ ${merged}. Merged: ${title} (kept 1, deleted ${deleteIds.length})`);
      }
      
    } catch (err) {
      errors++;
      if (errors <= 5) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`❌ Error merging ${title}: ${message}`);
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
    const finalCount = await prisma.deal.count();
    console.log(`\n📊 Final deal count: ${finalCount.toLocaleString()}`);
  }
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});





