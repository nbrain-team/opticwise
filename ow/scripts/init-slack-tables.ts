/**
 * Initialize Slack Integration Tables
 * 
 * Creates tables for Slack user mapping and session management
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function initSlackTables() {
  console.log('🔧 Initializing Slack Integration Tables...\n');
  
  try {
    // Create SlackUser table
    console.log('Creating SlackUser table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SlackUser" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "slackUserId" TEXT UNIQUE NOT NULL,
        "slackTeamId" TEXT NOT NULL,
        "slackUserName" TEXT,
        "slackUserEmail" TEXT,
        "ownetUserId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS "SlackUser_slackUserId_idx" ON "SlackUser"("slackUserId");
      CREATE INDEX IF NOT EXISTS "SlackUser_slackTeamId_idx" ON "SlackUser"("slackTeamId");
    `);
    console.log('✅ SlackUser table created\n');
    
    // Create SlackSession table
    console.log('Creating SlackSession table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SlackSession" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "slackUserId" TEXT NOT NULL REFERENCES "SlackUser"(id) ON DELETE CASCADE,
        "slackChannelId" TEXT NOT NULL,
        "slackThreadTs" TEXT,
        "ownetSessionId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("slackUserId", "slackThreadTs")
      );
      
      CREATE INDEX IF NOT EXISTS "SlackSession_slackUserId_idx" ON "SlackSession"("slackUserId");
      CREATE INDEX IF NOT EXISTS "SlackSession_slackThreadTs_idx" ON "SlackSession"("slackThreadTs");
      CREATE INDEX IF NOT EXISTS "SlackSession_ownetSessionId_idx" ON "SlackSession"("ownetSessionId");
    `);
    console.log('✅ SlackSession table created\n');
    
    // Create SlackMessageLog table (for analytics)
    console.log('Creating SlackMessageLog table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SlackMessageLog" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "slackUserId" TEXT NOT NULL REFERENCES "SlackUser"(id),
        "slackChannelId" TEXT NOT NULL,
        "slackThreadTs" TEXT,
        "slackMessageTs" TEXT NOT NULL,
        question TEXT NOT NULL,
        response TEXT,
        "responseTime" INTEGER,
        error TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS "SlackMessageLog_slackUserId_idx" ON "SlackMessageLog"("slackUserId");
      CREATE INDEX IF NOT EXISTS "SlackMessageLog_createdAt_idx" ON "SlackMessageLog"("createdAt");
    `);
    console.log('✅ SlackMessageLog table created\n');
    
    // Verify tables
    console.log('Verifying tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('SlackUser', 'SlackSession', 'SlackMessageLog')
      ORDER BY table_name
    `);
    
    console.log('\n✅ Slack integration tables verified:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Show counts
    const userCount = await pool.query('SELECT COUNT(*) as count FROM "SlackUser"');
    const sessionCount = await pool.query('SELECT COUNT(*) as count FROM "SlackSession"');
    const logCount = await pool.query('SELECT COUNT(*) as count FROM "SlackMessageLog"');
    
    console.log('\n📊 Current Counts:');
    console.log(`   - Slack Users: ${userCount.rows[0].count}`);
    console.log(`   - Slack Sessions: ${sessionCount.rows[0].count}`);
    console.log(`   - Message Logs: ${logCount.rows[0].count}`);
    
    console.log('\n🎉 Slack integration tables initialized successfully!\n');
    
  } catch (error) {
    console.error('❌ Error initializing Slack tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initSlackTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initSlackTables };
