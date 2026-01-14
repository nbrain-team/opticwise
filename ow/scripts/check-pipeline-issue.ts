import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPipelines() {
  console.log('\n🔍 Checking Pipeline Configuration\n');

  const pipelines = await prisma.pipeline.findMany({
    include: {
      _count: {
        select: { deals: true },
      },
      stages: {
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${pipelines.length} pipelines:\n`);

  pipelines.forEach((pipeline, idx) => {
    console.log(`${idx + 1}. ${pipeline.name}`);
    console.log(`   ID: ${pipeline.id}`);
    console.log(`   Created: ${pipeline.createdAt}`);
    console.log(`   Deals: ${pipeline._count.deals}`);
    console.log(`   Stages: ${pipeline.stages.length}`);
    console.log('');
  });

  // Check which pipeline the deals page would select
  const firstPipeline = await prisma.pipeline.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n⚠️  The deals page selects: "${firstPipeline?.name}"`);
  console.log(`   This pipeline has ${pipelines.find(p => p.id === firstPipeline?.id)?._count.deals || 0} deals\n`);

  // Show where the actual deals are
  const dealsInSalesPipeline = await prisma.deal.count({
    where: {
      pipeline: {
        name: 'Sales Pipeline',
      },
    },
  });

  console.log(`✅ Deals in "Sales Pipeline": ${dealsInSalesPipeline}`);
  console.log(`\n💡 Solution: We need to either:`);
  console.log(`   1. Delete "New Projects Pipeline" so "Sales Pipeline" is first`);
  console.log(`   2. Update the deals page to use "Sales Pipeline" by default\n`);

  await prisma.$disconnect();
}

checkPipelines().catch(console.error);

