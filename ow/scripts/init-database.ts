/**
 * Initialize database - create agent and Google Workspace tables
 * Safe to run multiple times (uses IF NOT EXISTS)
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Initializing database...');

    // Read and run agent tables migration
    const agentTablesSQL = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/002_agent_tables.sql'),
      'utf8'
    );
    
    console.log('Creating Agent tables...');
    await pool.query(agentTablesSQL);
    console.log('✓ Agent tables created/verified');

    // Read and run Google Workspace tables migration
    const googleTablesSQL = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/003_google_workspace_tables.sql'),
      'utf8'
    );
    
    console.log('Creating Google Workspace tables...');
    await pool.query(googleTablesSQL);
    console.log('✓ Google Workspace tables created/verified');

    console.log('\n✅ Database initialization complete!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initDatabase();




