/**
 * OWnet Agent - Chat API
 * Simple, working implementation for Next.js serverless
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { getSession } from '@/lib/session';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId required' },
        { status: 400 }
      );
    }

    // 1. Search transcripts using Pinecone
    console.log('[OWnet] Searching transcripts for:', message);
    
    let transcriptContext = '';
    try {
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');
      
      // Search (Pinecone will handle this even without vectors, will return empty)
      const searchResults = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: [], // Empty for now until we vectorize
      });

      if (searchResults.matches && searchResults.matches.length > 0) {
        transcriptContext = searchResults.matches
          .map((m: any) => {
            return `[Call: ${m.metadata?.title}]\n${m.metadata?.text_chunk || ''}`;
          })
          .join('\n\n');
      }
    } catch (pineconeError) {
      console.log('[OWnet] Pinecone search skipped (will work after vectorization)');
    }

    // 2. Get conversation history
    const historyResult = await pool.query(
      'SELECT role, content FROM "AgentChatMessage" WHERE "sessionId" = $1 ORDER BY "createdAt" DESC LIMIT 10',
      [sessionId]
    );
    const history = historyResult.rows.reverse();

    // 3. Build context-aware prompt
    const systemPrompt = `You are OWnet Agent, an AI assistant for Opticwise CRM.

**Your Knowledge:**
- You have access to 142 sales call transcripts from Opticwise
- You can search CRM data (deals, contacts, organizations)
- You maintain Opticwise's professional, solution-oriented communication style

**Relevant Transcript Context:**
${transcriptContext || 'No specific transcripts found for this query (transcripts will be vectorized soon)'}

**Guidelines:**
- Be helpful, professional, and concise
- Cite transcript sources when available
- Provide actionable insights
- Use markdown for formatting`;

    // 4. Call Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((h: any) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    });

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // 5. Save messages to database
    await pool.query(
      'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
      [sessionId, 'user', message]
    );

    await pool.query(
      'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
      [sessionId, 'assistant', responseText]
    );

    // 6. Update session timestamp
    await pool.query(
      'UPDATE "AgentChatSession" SET "updatedAt" = NOW() WHERE id = $1',
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      response: responseText,
      sources: transcriptContext ? ['transcripts'] : [],
    });

  } catch (error) {
    console.error('[OWnet Chat] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

