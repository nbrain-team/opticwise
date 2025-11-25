/**
 * OWnet Agent - Session Detail API
 */

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
  request: NextRequest,
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
      'SELECT * FROM "AgentChatSession" WHERE id = $1 AND "userId" = $2',
      [id, session.userId]
    );

    if (sessionResult.rowCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messagesResult = await db.query(
      'SELECT * FROM "AgentChatMessage" WHERE "sessionId" = $1 ORDER BY "createdAt" ASC',
      [id]
    );

    return NextResponse.json({
      success: true,
      session: sessionResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error('[Session Detail API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
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
      'DELETE FROM "AgentChatSession" WHERE id = $1 AND "userId" = $2',
      [id, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Session Delete API] Error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

