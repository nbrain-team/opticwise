import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function initMarketingTables() {
  console.log('🚀 Initializing Marketing Automation Tables...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, '..', 'prisma', 'migrations', '006_marketing_automation.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Reading migration file...');
    console.log(`   File: ${migrationPath}\n`);

    // Execute the migration
    console.log('🔄 Executing migration...');
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'Campaign', 'CampaignLead', 'CampaignTouchpoint', 'CampaignSequence', 
        'CampaignAnalytics', 'AuditRequest', 'BookRequest', 'BookEngagement',
        'Conference', 'ConferenceAttendee', 'EmailTemplate', 
        'ChatbotConversation', 'ChatbotMessage'
      )
      ORDER BY table_name;
    `);

    console.log(`\n✅ Found ${result.rows.length} marketing automation tables:`);
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    if (result.rows.length === 13) {
      console.log('\n🎉 All 13 marketing automation tables created successfully!');
    } else {
      console.log(`\n⚠️  Warning: Expected 13 tables, found ${result.rows.length}`);
    }

  } catch (error) {
    console.error('❌ Error initializing marketing tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initMarketingTables()
  .then(() => {
    console.log('\n✅ Marketing automation tables initialized successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to initialize marketing tables:', error);
    process.exit(1);
  });


