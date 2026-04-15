import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getSession } from '@/lib/session';

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

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getPool();

    await db.query(`
      CREATE TABLE IF NOT EXISTS "SupportChatSession" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "visitorId" TEXT NOT NULL,
        "customerName" TEXT,
        "customerEmail" TEXT,
        "propertyName" TEXT,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        title TEXT NOT NULL DEFAULT 'New Conversation',
        status TEXT NOT NULL DEFAULT 'active',
        channel TEXT NOT NULL DEFAULT 'chat',
        "ticketId" TEXT,
        "escalatedAt" TIMESTAMP,
        "escalatedTo" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const result = await db.query(
      `SELECT s.id, s.title, s.status, s."customerName", s."propertyName", s."isVerified",
              s."createdAt", s."updatedAt",
              (SELECT COUNT(*) FROM "SupportChatMessage" WHERE "sessionId" = s.id) as "messageCount"
       FROM "SupportChatSession" s
       WHERE s."visitorId" = $1
       ORDER BY s."updatedAt" DESC
       LIMIT 50`,
      [session.userId]
    );

    return NextResponse.json({ success: true, sessions: result.rows });
  } catch (error) {
    console.error('[Support Sessions] GET error:', error);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title = 'New Conversation' } = body;

    const db = getPool();

    await db.query(`
      CREATE TABLE IF NOT EXISTS "SupportChatSession" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "visitorId" TEXT NOT NULL,
        "customerName" TEXT,
        "customerEmail" TEXT,
        "propertyName" TEXT,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        title TEXT NOT NULL DEFAULT 'New Conversation',
        status TEXT NOT NULL DEFAULT 'active',
        channel TEXT NOT NULL DEFAULT 'chat',
        "ticketId" TEXT,
        "escalatedAt" TIMESTAMP,
        "escalatedTo" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS "SupportChatMessage" (
        id SERIAL PRIMARY KEY,
        "sessionId" TEXT NOT NULL REFERENCES "SupportChatSession"(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources JSONB,
        intent TEXT,
        confidence FLOAT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const result = await db.query(
      `INSERT INTO "SupportChatSession" (id, "visitorId", title)
       VALUES (gen_random_uuid()::text, $1, $2)
       RETURNING id, title, status, "createdAt", "updatedAt"`,
      [session.userId, title]
    );

    return NextResponse.json({ success: true, session: { ...result.rows[0], messageCount: 0 } });
  } catch (error) {
    console.error('[Support Sessions] POST error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
