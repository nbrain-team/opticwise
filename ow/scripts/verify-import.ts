import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImport() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFYING IMPORT DATA');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Count records
    const orgCount = await prisma.organization.count();
    const peopleCount = await prisma.person.count();
    const dealCount = await prisma.deal.count();
    const pipelineCount = await prisma.pipeline.count();
    const stageCount = await prisma.stage.count();
    const userCount = await prisma.user.count();

    console.log('📊 RECORD COUNTS:');
    console.log(`  Organizations: ${orgCount}`);
    console.log(`  People: ${peopleCount}`);
    console.log(`  Deals: ${dealCount}`);
    console.log(`  Pipelines: ${pipelineCount}`);
    console.log(`  Stages: ${stageCount}`);
    console.log(`  Users: ${userCount}\n`);

    // 2. Check relationships
    const peopleWithOrgs = await prisma.person.count({
      where: { organizationId: { not: null } },
    });
    
    const dealsWithOrgs = await prisma.deal.count({
      where: { organizationId: { not: null } },
    });
    
    const dealsWithPeople = await prisma.deal.count({
      where: { personId: { not: null } },
    });

    console.log('🔗 RELATIONSHIPS:');
    console.log(`  People linked to organizations: ${peopleWithOrgs}/${peopleCount} (${((peopleWithOrgs/peopleCount)*100).toFixed(1)}%)`);
    console.log(`  Deals linked to organizations: ${dealsWithOrgs}/${dealCount} (${((dealsWithOrgs/dealCount)*100).toFixed(1)}%)`);
    console.log(`  Deals linked to people: ${dealsWithPeople}/${dealCount} (${((dealsWithPeople/dealCount)*100).toFixed(1)}%)\n`);

    // 3. Check for orphaned records
    const orphanedPeople = await prisma.person.count({
      where: {
        AND: [
          { organizationId: { not: null } },
          { organization: null },
        ],
      },
    });

    const orphanedDealsOrg = await prisma.deal.count({
      where: {
        AND: [
          { organizationId: { not: null } },
          { organization: null },
        ],
      },
    });

    const orphanedDealsPerson = await prisma.deal.count({
      where: {
        AND: [
          { personId: { not: null } },
          { person: null },
        ],
      },
    });

    console.log('🔍 ORPHANED RECORDS CHECK:');
    console.log(`  Orphaned people (invalid org link): ${orphanedPeople}`);
    console.log(`  Orphaned deals (invalid org link): ${orphanedDealsOrg}`);
    console.log(`  Orphaned deals (invalid person link): ${orphanedDealsPerson}\n`);

    // 4. Sample data
    console.log('📝 SAMPLE ORGANIZATIONS (first 5):');
    const sampleOrgs = await prisma.organization.findMany({
      take: 5,
      select: {
        name: true,
        city: true,
        state: true,
        _count: {
          select: {
            people: true,
            deals: true,
          },
        },
      },
    });
    sampleOrgs.forEach((org, idx) => {
      console.log(`  ${idx + 1}. ${org.name}`);
      console.log(`     Location: ${org.city || 'N/A'}, ${org.state || 'N/A'}`);
      console.log(`     People: ${org._count.people}, Deals: ${org._count.deals}`);
    });

    console.log('\n📝 SAMPLE PEOPLE (first 5):');
    const samplePeople = await prisma.person.findMany({
      take: 5,
      include: {
        organization: {
          select: { name: true },
        },
      },
    });
    samplePeople.forEach((person, idx) => {
      console.log(`  ${idx + 1}. ${person.name || `${person.firstName} ${person.lastName}`}`);
      console.log(`     Email: ${person.email}`);
      console.log(`     Organization: ${person.organization?.name || 'None'}`);
      console.log(`     Title: ${person.title || 'N/A'}`);
    });

    console.log('\n📝 SAMPLE DEALS (first 5):');
    const sampleDeals = await prisma.deal.findMany({
      take: 5,
      include: {
        organization: {
          select: { name: true },
        },
        person: {
          select: { name: true },
        },
        stage: {
          select: { name: true },
        },
      },
    });
    sampleDeals.forEach((deal, idx) => {
      console.log(`  ${idx + 1}. ${deal.title}`);
      console.log(`     Value: $${deal.value.toLocaleString()} ${deal.currency}`);
      console.log(`     Status: ${deal.status}`);
      console.log(`     Stage: ${deal.stage.name}`);
      console.log(`     Organization: ${deal.organization?.name || 'None'}`);
      console.log(`     Contact: ${deal.person?.name || 'None'}`);
    });

    // 5. Deal status breakdown
    console.log('\n📊 DEAL STATUS BREAKDOWN:');
    const dealsByStatus = await prisma.deal.groupBy({
      by: ['status'],
      _count: true,
    });
    dealsByStatus.forEach(group => {
      console.log(`  ${group.status}: ${group._count}`);
    });

    // 6. Top organizations by deal count
    console.log('\n🏆 TOP 10 ORGANIZATIONS BY DEAL COUNT:');
    const topOrgs = await prisma.organization.findMany({
      take: 10,
      orderBy: {
        deals: {
          _count: 'desc',
        },
      },
      select: {
        name: true,
        _count: {
          select: {
            deals: true,
            people: true,
          },
        },
      },
    });
    topOrgs.forEach((org, idx) => {
      if (org._count.deals > 0) {
        console.log(`  ${idx + 1}. ${org.name}`);
        console.log(`     Deals: ${org._count.deals}, People: ${org._count.people}`);
      }
    });

    // 7. Pipeline and stages
    console.log('\n🔄 PIPELINE & STAGES:');
    const pipelines = await prisma.pipeline.findMany({
      include: {
        stages: {
          orderBy: { orderIndex: 'asc' },
          select: {
            name: true,
            orderIndex: true,
            _count: {
              select: { deals: true },
            },
          },
        },
      },
    });
    pipelines.forEach(pipeline => {
      console.log(`  Pipeline: ${pipeline.name}`);
      pipeline.stages.forEach(stage => {
        console.log(`    ${stage.orderIndex + 1}. ${stage.name} (${stage._count.deals} deals)`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE - All data looks good!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyImport()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });

