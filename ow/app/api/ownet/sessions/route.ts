/**
 * OWnet Agent - Sessions API
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

// GET - List sessions
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getPool();
    const result = await db.query(
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
    
    // Check if tables exist, if not create them
    const db = getPool();
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS "AgentChatSession" (
          id TEXT PRIMARY KEY DEFAULT ('ags_' || gen_random_uuid()::text),
          "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
          "dealId" TEXT REFERENCES "Deal"(id) ON DELETE SET NULL,
          title TEXT NOT NULL DEFAULT 'New Chat',
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS "AgentChatMessage" (
          id TEXT PRIMARY KEY DEFAULT ('agm_' || gen_random_uuid()::text),
          "sessionId" TEXT NOT NULL REFERENCES "AgentChatSession"(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          sources JSONB,
          "createdAt" TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS "AgentChatSession_userId_idx" ON "AgentChatSession"("userId");
        CREATE INDEX IF NOT EXISTS "AgentChatMessage_sessionId_idx" ON "AgentChatMessage"("sessionId");
      `);
      
      // Retry the query
      const session = await getSession();
      if (session) {
        const result = await db.query(
          `SELECT s.*, 
                  (SELECT COUNT(*) FROM "AgentChatMessage" WHERE "sessionId" = s.id) as "messageCount"
           FROM "AgentChatSession" s
           WHERE "userId" = $1
           ORDER BY "updatedAt" DESC
           LIMIT 50`,
          [session.userId]
        );
        return NextResponse.json({ success: true, sessions: result.rows });
      }
    } catch (retryError) {
      console.error('[Sessions API] Retry error:', retryError);
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    const db = getPool();
    const result = await db.query(
      'INSERT INTO "AgentChatSession" ("userId", "dealId", title) VALUES ($1, $2, $3) RETURNING *',
      [session.userId, dealId, title]
    );

    return NextResponse.json({
      success: true,
      session: result.rows[0],
    });
  } catch (error) {
    console.error('[Sessions API] Error:', error);
    
    // Check if tables exist, if not create them
    const db = getPool();
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS "AgentChatSession" (
          id TEXT PRIMARY KEY DEFAULT ('ags_' || gen_random_uuid()::text),
          "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
          "dealId" TEXT REFERENCES "Deal"(id) ON DELETE SET NULL,
          title TEXT NOT NULL DEFAULT 'New Chat',
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS "AgentChatMessage" (
          id TEXT PRIMARY KEY DEFAULT ('agm_' || gen_random_uuid()::text),
          "sessionId" TEXT NOT NULL REFERENCES "AgentChatSession"(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          sources JSONB,
          "createdAt" TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS "AgentChatSession_userId_idx" ON "AgentChatSession"("userId");
        CREATE INDEX IF NOT EXISTS "AgentChatMessage_sessionId_idx" ON "AgentChatMessage"("sessionId");
      `);
      
      // Retry the insert
      const session = await getSession();
      const body = await request.clone().json();
      const { title = 'New Chat', dealId = null } = body;
      
      if (session) {
        const result = await db.query(
          'INSERT INTO "AgentChatSession" ("userId", "dealId", title) VALUES ($1, $2, $3) RETURNING *',
          [session.userId, dealId, title]
        );
        return NextResponse.json({ success: true, session: result.rows[0] });
      }
    } catch (retryError) {
      console.error('[Sessions API] Retry error:', retryError);
    }
    
    return NextResponse.json({ 
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

