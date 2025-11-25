/**
 * OWnet Agent - Sessions API
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getSession } from '@/lib/session';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// GET - List sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM "AgentChatMessage" WHERE "sessionId" = s.id) as "messageCount"
       FROM "AgentChatSession" s
       WHERE "userId" = $1
       ORDER BY "updatedAt" DESC
       LIMIT 50`,
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      sessions: result.rows,
    });
  } catch (error) {
    console.error('[Sessions API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST - Create session
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title = 'New Chat', dealId = null } = body;

    const result = await pool.query(
      'INSERT INTO "AgentChatSession" ("userId", "dealId", title) VALUES ($1, $2, $3) RETURNING *',
      [session.userId, dealId, title]
    );

    return NextResponse.json({
      success: true,
      session: result.rows[0],
    });
  } catch (error) {
    console.error('[Sessions API] Error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

