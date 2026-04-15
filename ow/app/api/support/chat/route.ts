/**
 * OpticWise Customer Service Agent — Chat API
 * 
 * RAG-powered support agent trained on real support emails and call transcripts.
 * Uses Pinecone vector search (namespace: support-agent) for context retrieval
 * and Claude for response generation with a specialized CS system prompt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { getSession } from '@/lib/session';
import { generateSupportAgentPrompt } from '@/lib/support-agent-prompt';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const PINECONE_NAMESPACE = 'support-agent';
const TOP_K = 10;

let pool: Pool | null = null;
let anthropic: Anthropic | null = null;
let pinecone: Pinecone | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function getPinecone() {
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return pinecone;
}

function classifySupportIntent(message: string): {
  category: string;
  confidence: number;
  suggestedMaxTokens: number;
} {
  const lower = message.toLowerCase();

  const patterns: Array<{ category: string; keywords: string[]; maxTokens: number }> = [
    {
      category: 'connectivity',
      keywords: ['connect', 'wifi', 'wi-fi', 'internet', 'network', 'no internet', 'slow', 'disconnect', 'can\'t connect', 'not working', 'offline', 'speed', 'bandwidth'],
      maxTokens: 1500,
    },
    {
      category: 'credentials',
      keywords: ['password', 'login', 'log in', 'forgot', 'reset', 'username', 'can\'t sign in', 'locked out', 'access', 'portal', 'account'],
      maxTokens: 1200,
    },
    {
      category: 'device_setup',
      keywords: ['tv', 'printer', 'smart tv', 'roku', 'apple tv', 'gaming', 'console', 'xbox', 'playstation', 'chromecast', 'smart home', 'camera', 'device', 'set up', 'setup'],
      maxTokens: 1500,
    },
    {
      category: 'guest_network',
      keywords: ['guest', 'visitor', 'guest wifi', 'guest network', 'guest password', 'guest access'],
      maxTokens: 1000,
    },
    {
      category: 'outage',
      keywords: ['outage', 'down', 'whole building', 'everyone', 'floor', 'all units', 'service down', 'nothing works'],
      maxTokens: 1200,
    },
    {
      category: 'billing',
      keywords: ['bill', 'charge', 'invoice', 'payment', 'upgrade', 'plan', 'subscription', 'cancel', 'refund', 'pricing'],
      maxTokens: 800,
    },
    {
      category: 'general',
      keywords: [],
      maxTokens: 1200,
    },
  ];

  for (const p of patterns) {
    const matchCount = p.keywords.filter(k => lower.includes(k)).length;
    if (matchCount > 0) {
      return {
        category: p.category,
        confidence: Math.min(0.5 + matchCount * 0.15, 0.95),
        suggestedMaxTokens: p.maxTokens,
      };
    }
  }

  return { category: 'general', confidence: 0.3, suggestedMaxTokens: 1200 };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and sessionId required' }, { status: 400 });
    }

    const db = getPool();
    const ai = getAnthropic();

    console.log('[Support Agent] Processing:', message);

    // Classify intent
    const intent = classifySupportIntent(message);
    console.log('[Support Agent] Intent:', intent.category, `(${(intent.confidence * 100).toFixed(0)}%)`);

    // Load conversation history
    const historyResult = await db.query(
      `SELECT role, content FROM "SupportChatMessage"
       WHERE "sessionId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      [sessionId]
    );
    const history = historyResult.rows.reverse();

    // Load session context (customer name, verified status, etc.)
    const sessionResult = await db.query(
      `SELECT "customerName", "customerEmail", "propertyName", "isVerified"
       FROM "SupportChatSession" WHERE id = $1`,
      [sessionId]
    );
    const sessionData = sessionResult.rows[0] || {};

    // Search vectorized support knowledge via Pinecone
    let supportContext = '';
    try {
      const openai = new (await import('openai')).default({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: message,
        dimensions: 1024,
      });

      const queryVector = embeddingResponse.data[0].embedding;

      const pc = getPinecone();
      const index = pc.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');

      const searchResults = await index.namespace(PINECONE_NAMESPACE).query({
        topK: TOP_K,
        vector: queryVector,
        includeMetadata: true,
      });

      if (searchResults.matches && searchResults.matches.length > 0) {
        const relevantMatches = searchResults.matches.filter(m => (m.score || 0) > 0.25);

        if (relevantMatches.length > 0) {
          const emailMatches = relevantMatches.filter(m => m.metadata?.source === 'email');
          const callMatches = relevantMatches.filter(m => m.metadata?.source === 'call_transcript');

          if (emailMatches.length > 0) {
            supportContext += '\n\n**Relevant Past Support Email Interactions:**\n\n';
            supportContext += emailMatches.slice(0, 5).map((m, i) => {
              const subject = m.metadata?.subject || 'Support Thread';
              const date = m.metadata?.date ? new Date(m.metadata.date as string).toLocaleDateString() : 'N/A';
              return `${i + 1}. **${subject}** (${date}):\n${m.metadata?.text_chunk || ''}`;
            }).join('\n\n---\n\n');
          }

          if (callMatches.length > 0) {
            supportContext += '\n\n**Relevant Past Support Call Transcripts:**\n\n';
            supportContext += callMatches.slice(0, 5).map((m, i) => {
              const callId = m.metadata?.call_id || 'Call';
              const date = m.metadata?.date ? new Date(m.metadata.date as string).toLocaleDateString() : 'N/A';
              const duration = m.metadata?.duration_seconds
                ? `${Math.round(Number(m.metadata.duration_seconds) / 60)}min`
                : '';
              return `${i + 1}. **Call ${callId}** (${date}${duration ? `, ${duration}` : ''}):\n${m.metadata?.text_chunk || ''}`;
            }).join('\n\n---\n\n');
          }

          console.log('[Support Agent] RAG context: ', emailMatches.length, 'emails,', callMatches.length, 'calls');
        }
      }
    } catch (error) {
      console.log('[Support Agent] RAG search error:', error);
    }

    // Also search the Knowledge Base (uploaded documents)
    let kbContext = '';
    try {
      const openaiForKb = new (await import('openai')).default({ apiKey: process.env.OPENAI_API_KEY });
      const kbEmbedding = await openaiForKb.embeddings.create({
        model: 'text-embedding-3-large',
        input: message,
        dimensions: 1024,
      });
      const kbVector = kbEmbedding.data[0].embedding;

      const kbColCheck = await db.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'KnowledgeChunk' AND column_name = 'embedding'
           AND udt_name = 'vector' LIMIT 1`
      );

      if (kbColCheck.rows.length > 0) {
        const kbResults = await db.query(
          `SELECT kc."chunkText", kd.name as doc_name, kd.category,
                  1 - (kc.embedding <=> $1::vector) as similarity
           FROM "KnowledgeChunk" kc
           JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
           WHERE kc.embedding IS NOT NULL
           ORDER BY kc.embedding <=> $1::vector
           LIMIT 5`,
          [`[${kbVector.join(',')}]`]
        );

        const relevant = kbResults.rows.filter((r: { similarity: number }) => r.similarity > 0.35);
        if (relevant.length > 0) {
          kbContext = '\n\n**Knowledge Base Documents:**\n\n';
          kbContext += relevant.map((chunk: { doc_name: string; category: string; chunkText: string }, i: number) => {
            return `${i + 1}. **${chunk.doc_name}** (${chunk.category || 'General'}):\n${chunk.chunkText.slice(0, 600)}`;
          }).join('\n\n');
        }
      }
    } catch (kbError) {
      console.log('[Support Agent] KB search error:', kbError);
    }

    // Build system prompt
    const systemPrompt = generateSupportAgentPrompt({
      currentDate: new Date(),
      customerName: sessionData.customerName || undefined,
      customerEmail: sessionData.customerEmail || undefined,
      propertyName: sessionData.propertyName || undefined,
      isVerified: sessionData.isVerified || false,
    }) + `

**SUPPORT KNOWLEDGE CONTEXT (from real historical interactions):**
${supportContext || '\nNo directly matching historical interactions found for this query.'}
${kbContext || ''}

**DETECTED INTENT:** ${intent.category} (${(intent.confidence * 100).toFixed(0)}% confidence)`;

    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const heartbeatTimer = setInterval(() => {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        }, 15000);

        try {
          const sendData = (data: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          sendData({ type: 'progress', message: 'Looking up your issue...' });

          if (supportContext) {
            sendData({ type: 'progress', message: 'Found similar past support interactions...' });
            await new Promise(r => setTimeout(r, 200));
          }

          sendData({ type: 'progress', message: 'Preparing response...' });

          const claudeStream = await ai.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: intent.suggestedMaxTokens,
            temperature: 0.3,
            system: systemPrompt,
            messages,
          });

          let fullResponse = '';

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullResponse += chunk.delta.text;
              sendData({ type: 'content', text: chunk.delta.text });
            }
          }

          clearInterval(heartbeatTimer);

          // Ensure session exists
          const sessionCheck = await db.query(
            'SELECT id FROM "SupportChatSession" WHERE id = $1', [sessionId]
          );
          if (sessionCheck.rows.length === 0) {
            await db.query(
              `INSERT INTO "SupportChatSession" (id, "visitorId", title)
               VALUES ($1, $2, 'New Conversation')
               ON CONFLICT (id) DO NOTHING`,
              [sessionId, session.userId]
            );
          }

          // Save messages
          await db.query(
            'INSERT INTO "SupportChatMessage" ("sessionId", role, content, intent, confidence) VALUES ($1, $2, $3, $4, $5)',
            [sessionId, 'user', message, intent.category, intent.confidence]
          );

          const assistantResult = await db.query(
            'INSERT INTO "SupportChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3) RETURNING id',
            [sessionId, 'assistant', fullResponse]
          );

          const assistantMessageId = assistantResult.rows[0]?.id;

          // Auto-generate session title from first exchange
          const titleCheck = await db.query(
            'SELECT title FROM "SupportChatSession" WHERE id = $1',
            [sessionId]
          );
          if (titleCheck.rows[0]?.title === 'New Conversation') {
            const titleText = message.length > 50 ? message.slice(0, 50) + '...' : message;
            await db.query(
              'UPDATE "SupportChatSession" SET title = $2, "updatedAt" = NOW() WHERE id = $1',
              [sessionId, titleText]
            );
          } else {
            await db.query(
              'UPDATE "SupportChatSession" SET "updatedAt" = NOW() WHERE id = $1',
              [sessionId]
            );
          }

          // Extract customer info from conversation if mentioned
          await extractAndSaveCustomerInfo(db, sessionId, message, fullResponse);

          sendData({
            type: 'complete',
            messageId: assistantMessageId,
            intent: intent.category,
            performance: {
              responseTime: Date.now() - startTime,
              category: intent.category,
            },
          });

          controller.close();
        } catch (error) {
          clearInterval(heartbeatTimer);
          console.error('[Support Agent] Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: 'I encountered an issue. Please try again.',
            details: error instanceof Error ? error.message : 'Unknown error',
          })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Support Agent] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function extractAndSaveCustomerInfo(
  db: Pool,
  sessionId: string,
  userMessage: string,
  _assistantResponse: string
): Promise<void> {
  try {
    const emailMatch = userMessage.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    const namePatterns = [
      /my name is ([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /I'm ([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /this is ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    ];

    let name: string | null = null;
    for (const pattern of namePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        name = match[1];
        break;
      }
    }

    if (emailMatch || name) {
      const updates: string[] = [];
      const values: (string | boolean)[] = [];
      let paramIndex = 1;

      if (emailMatch) {
        updates.push(`"customerEmail" = $${paramIndex++}`);
        values.push(emailMatch[0]);
      }
      if (name) {
        updates.push(`"customerName" = $${paramIndex++}`);
        values.push(name);
      }
      if (emailMatch && name) {
        updates.push(`"isVerified" = $${paramIndex++}`);
        values.push(true);
      }

      updates.push(`"updatedAt" = NOW()`);
      values.push(sessionId);

      await db.query(
        `UPDATE "SupportChatSession" SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }
  } catch (error) {
    console.log('[Support Agent] Customer info extraction error:', error);
  }
}
