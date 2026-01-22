/**
 * Feedback API Endpoint
 * 
 * Collects user feedback on AI responses for continuous learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getSession } from '@/lib/session';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, rating, category, feedback } = body;

    if (!messageId || !rating) {
      return NextResponse.json(
        { error: 'messageId and rating required' },
        { status: 400 }
      );
    }

    // Save feedback
    await pool.query(
      `INSERT INTO "AIFeedback" 
       ("messageId", "userId", rating, category, feedback, "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [messageId, session.userId, rating, category || null, feedback || null]
    );

    console.log(`[Feedback] Saved feedback: messageId=${messageId}, rating=${rating}`);

    return NextResponse.json({
      success: true,
      message: 'Feedback saved successfully',
    });
  } catch (error) {
    console.error('[Feedback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback', details: String(error) },
      { status: 500 }
    );
  }
}
