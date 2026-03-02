import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function POST(request: NextRequest) {
  const authKey = request.headers.get('x-admin-key');
  if (!authKey || authKey !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getPool();
  const results: string[] = [];

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS "SlackUser" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "slackUserId" TEXT UNIQUE NOT NULL,
        "slackTeamId" TEXT NOT NULL,
        "slackUserName" TEXT,
        "slackUserEmail" TEXT,
        "ownetUserId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS "SlackUser_slackUserId_idx" ON "SlackUser"("slackUserId")');
    await db.query('CREATE INDEX IF NOT EXISTS "SlackUser_slackTeamId_idx" ON "SlackUser"("slackTeamId")');
    results.push('SlackUser table created');

    await db.query(`
      CREATE TABLE IF NOT EXISTS "SlackSession" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "slackUserId" TEXT NOT NULL REFERENCES "SlackUser"(id) ON DELETE CASCADE,
        "slackChannelId" TEXT NOT NULL,
        "slackThreadTs" TEXT,
        "ownetSessionId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("slackUserId", "slackThreadTs")
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS "SlackSession_slackUserId_idx" ON "SlackSession"("slackUserId")');
    await db.query('CREATE INDEX IF NOT EXISTS "SlackSession_slackThreadTs_idx" ON "SlackSession"("slackThreadTs")');
    await db.query('CREATE INDEX IF NOT EXISTS "SlackSession_ownetSessionId_idx" ON "SlackSession"("ownetSessionId")');
    results.push('SlackSession table created');

    await db.query(`
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
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS "SlackMessageLog_slackUserId_idx" ON "SlackMessageLog"("slackUserId")');
    await db.query('CREATE INDEX IF NOT EXISTS "SlackMessageLog_createdAt_idx" ON "SlackMessageLog"("createdAt")');
    results.push('SlackMessageLog table created');

    const tables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('SlackUser', 'SlackSession', 'SlackMessageLog')
      ORDER BY table_name
    `);

    return NextResponse.json({
      success: true,
      results,
      tables: tables.rows.map(r => r.table_name)
    });
  } catch (error) {
    console.error('Error initializing Slack tables:', error);
    return NextResponse.json({
      error: 'Failed to initialize tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
