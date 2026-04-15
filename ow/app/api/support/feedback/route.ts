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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, messageId, rating, comment, category } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const db = getPool();

    await db.query(`
      CREATE TABLE IF NOT EXISTS "SupportFeedback" (
        id SERIAL PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "messageId" INT,
        rating INT,
        comment TEXT,
        category TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.query(
      `INSERT INTO "SupportFeedback" ("sessionId", "messageId", rating, comment, category)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, messageId || null, rating || null, comment || null, category || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Support Feedback] Error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
