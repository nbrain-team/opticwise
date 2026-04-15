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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getPool();

    const sessionResult = await db.query(
      `SELECT * FROM "SupportChatSession" WHERE id = $1 AND "visitorId" = $2`,
      [id, session.userId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messagesResult = await db.query(
      `SELECT id, role, content, sources, intent, confidence, "createdAt"
       FROM "SupportChatMessage"
       WHERE "sessionId" = $1
       ORDER BY "createdAt" ASC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      session: sessionResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error('[Support Session] GET error:', error);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getPool();

    await db.query(
      `DELETE FROM "SupportChatSession" WHERE id = $1 AND "visitorId" = $2`,
      [id, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Support Session] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
