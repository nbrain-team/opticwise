import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Delete in order to respect foreign key constraints
    
    // 1. Delete all Deals (this will cascade to related records)
    console.log('Deleting Deals...');
    const dealsDeleted = await prisma.deal.deleteMany({});
    console.log(`✅ Deleted ${dealsDeleted.count} deals\n`);

    // 2. Delete all People (this will cascade to related records)
    console.log('Deleting People...');
    const peopleDeleted = await prisma.person.deleteMany({});
    console.log(`✅ Deleted ${peopleDeleted.count} people\n`);

    // 3. Delete all Organizations (this will cascade to related records)
    console.log('Deleting Organizations...');
    const orgsDeleted = await prisma.organization.deleteMany({});
    console.log(`✅ Deleted ${orgsDeleted.count} organizations\n`);

    console.log('✨ Database cleanup complete!\n');
    console.log('Summary:');
    console.log(`  - Deals: ${dealsDeleted.count}`);
    console.log(`  - People: ${peopleDeleted.count}`);
    console.log(`  - Organizations: ${orgsDeleted.count}`);
    console.log(`  - Total records deleted: ${dealsDeleted.count + peopleDeleted.count + orgsDeleted.count}\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

