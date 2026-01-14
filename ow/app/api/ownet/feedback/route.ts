/**
 * OWnet Agent - Chat Feedback API
 * Stores user feedback on AI responses for training/tuning
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

// POST - Submit feedback for a chat message
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, messageId, comment, rating } = body;

    if (!sessionId || !messageId || !comment) {
      return NextResponse.json(
        { error: 'sessionId, messageId, and comment are required' },
        { status: 400 }
      );
    }

    const db = getPool();

    // Get conversation context up to and including this message
    const contextResult = await db.query(
      `SELECT role, content, "createdAt" 
       FROM "AgentChatMessage" 
       WHERE "sessionId" = $1 
       AND "createdAt" <= (SELECT "createdAt" FROM "AgentChatMessage" WHERE id = $2)
       ORDER BY "createdAt" ASC`,
      [sessionId, messageId]
    );

    const conversationContext = contextResult.rows;

    // Insert the feedback
    const result = await db.query(
      `INSERT INTO "ChatFeedback" 
       ("sessionId", "messageId", "userId", comment, "conversationContext", rating) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [sessionId, messageId, session.userId, comment, JSON.stringify(conversationContext), rating || null]
    );

    return NextResponse.json({
      success: true,
      feedback: result.rows[0],
    });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

// GET - List all feedback (for admin/export purposes)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getPool();
    const result = await db.query(
      `SELECT f.*, 
              s.title as "sessionTitle",
              m.content as "messageContent"
       FROM "ChatFeedback" f
       JOIN "AgentChatSession" s ON f."sessionId" = s.id
       JOIN "AgentChatMessage" m ON f."messageId" = m.id
       ORDER BY f."createdAt" DESC
       LIMIT 100`
    );

    return NextResponse.json({
      success: true,
      feedback: result.rows,
    });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}





