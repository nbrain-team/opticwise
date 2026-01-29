/**
 * OWnet Agent - ENHANCED with Newbury Partners Architecture
 * 
 * Features:
 * - Tool Registry System (modular tools)
 * - Hybrid Search (vector + BM25 + AI reranking)
 * - Execution Planning (show plan before executing)
 * - Dynamic Voice Analysis (analyze actual emails)
 * - Streaming Responses (with progress indicators)
 * - Feedback Learning (continuous improvement)
 * - Deep Analysis Mode (extended token limits and context)
 */

import { NextRequest } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { getSession } from '@/lib/session';
import {
  classifyQuery,
  checkSemanticCache,
  saveToSemanticCache,
  // formatSourceCitations,
  // enforceBrandTerminology,
} from '@/lib/ai-agent-utils';
// import { generateBrandScriptPrompt } from '@/lib/brandscript-prompt';
// import { 
//   enforceBrandVoice, 
//   validateSB7Structure, 
//   injectReframingLineIfNeeded 
// } from '@/lib/brandscript-voice-enforcement';
import { toolRegistry, registerAllTools } from '@/tools';
import { ExecutionPlanner } from '@/lib/execution-planner';
import { EmailVoiceAnalyzer } from '@/lib/email-voice-analyzer';
import type { ToolResult } from '@/lib/tool-registry';

// Configure route for long-running operations
export const maxDuration = 300; // 5 minutes (maximum for Vercel Pro/Render)
export const dynamic = 'force-dynamic'; // Disable static optimization

// Initialize on first use
let pool: Pool | null = null;
let anthropic: Anthropic | null = null;
let pinecone: Pinecone | null = null;
let openai: OpenAI | null = null;
let toolsRegistered = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
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

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function ensureToolsRegistered() {
  if (!toolsRegistered) {
    registerAllTools();
    toolsRegistered = true;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return new Response(JSON.stringify({ error: 'Message and sessionId required' }), { status: 400 });
    }

    const db = getPool();
    const ai = getAnthropic();
    const oai = getOpenAI();
    const pc = getPinecone();

    // Ensure tools are registered
    ensureToolsRegistered();

    console.log('[OWnet Enhanced] Processing query:', message);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Check cache
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                message: '🔍 Checking cache...',
              })}\n\n`
            )
          );

          const cachedResponse = await checkSemanticCache(message, db, oai, 0.95);
          if (cachedResponse) {
            console.log('[OWnet Enhanced] Cache hit!');

            // Save user message
            await db.query(
              'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
              [sessionId, 'user', message]
            );

            const assistantMsgResult = await db.query(
              'INSERT INTO "AgentChatMessage" ("sessionId", role, content, sources) VALUES ($1, $2, $3, $4) RETURNING id',
              [sessionId, 'assistant', cachedResponse.response, JSON.stringify(cachedResponse.sources)]
            );

            // Stream cached response
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'progress',
                  message: '⚡ Using cached response',
                })}\n\n`
              )
            );

            // Stream content
            const words = cachedResponse.response.split(' ');
            for (const word of words) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'content',
                    text: word + ' ',
                  })}\n\n`
                )
              );
              await new Promise(resolve => setTimeout(resolve, 20));
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'complete',
                  messageId: assistantMsgResult.rows[0]?.id,
                  sources: cachedResponse.sources,
                  cached: true,
                })}\n\n`
              )
            );

            controller.close();
            return;
          }

          // Step 2: Classify query
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                message: '🧠 Analyzing query intent...',
              })}\n\n`
            )
          );

          const intent = classifyQuery(message);
          console.log('[OWnet Enhanced] Query classification:', intent.type);

          await new Promise(resolve => setTimeout(resolve, 300));

          // Step 3: Generate execution plan
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                message: '📋 Creating execution plan...',
              })}\n\n`
            )
          );

          const planner = new ExecutionPlanner(ai, toolRegistry);
          const plan = await planner.generatePlan({
            userMessage: message,
            conversationHistory: [],
          });

          console.log('[OWnet Enhanced] Execution plan:', plan.steps.length, 'steps');

          // Stream the plan to user
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'plan',
                plan: plan,
              })}\n\n`
            )
          );

          await new Promise(resolve => setTimeout(resolve, 500));

          // Step 4: Execute tools
          const toolResults: Array<{ tool: string; result: ToolResult }> = [];

          for (const step of plan.steps) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'progress',
                  message: `🔧 Executing: ${step.tool}...`,
                })}\n\n`
              )
            );

            const result = await toolRegistry.executeTool(step.tool, step.params, {
              dbPool: db,
              openai: oai,
              pinecone: pc,
              sessionId,
            });

            toolResults.push({
              tool: step.tool,
              result,
            });

            console.log(`[OWnet Enhanced] Tool ${step.tool} executed:`, result.success ? 'success' : 'failed');

            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Step 5: Get dynamic voice analysis
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                message: '🎨 Loading voice style...',
              })}\n\n`
            )
          );

          const emailVoiceAnalyzer = new EmailVoiceAnalyzer(db, ai);
          const emailVoiceGuide = message.toLowerCase().includes('email')
            ? await emailVoiceAnalyzer.generateEmailStyleGuide()
            : '';

          // Step 6: Get style examples from StyleGuide
          let styleContext = '';
          try {
            const styleResult = await db.query(
              `SELECT content, tone, author
               FROM "StyleGuide"
               WHERE category = 'email'
                 AND subcategory IN ('follow_up', 'relationship')
                 AND vectorized = true
               ORDER BY "usageCount" DESC, RANDOM()
               LIMIT 2`
            );

            if (styleResult.rows.length > 0) {
              const examples = styleResult.rows.map(
                row => `[${row.author || 'Example'} - ${row.tone}]\n${row.content}`
              );
              styleContext = `\n\n**OPTICWISE COMMUNICATION STYLE EXAMPLES:**\n\n${examples.join('\n\n---\n\n')}\n`;
            }
          } catch (error) {
            console.log('[OWnet Enhanced] Error fetching style examples:', error);
          }

          // Step 7: Build context from tool results
          let contextFromTools = '';
          for (const toolResult of toolResults) {
            if (toolResult.result.success && toolResult.result.data) {
              contextFromTools += `\n\n**From ${toolResult.tool}:**\n${JSON.stringify(toolResult.result.data, null, 2)}`;
            }
          }

          // Step 8: Generate response
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                message: '✨ Generating response...',
              })}\n\n`
            )
          );

          const currentDate = new Date();
          const formattedDate = currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          const systemPrompt = `You are OWnet, OpticWise's AI assistant.

**CURRENT DATE:** ${formattedDate}

${styleContext}
${emailVoiceGuide}

**AVAILABLE INFORMATION:**
${contextFromTools}

**COMMUNICATION STYLE:**
- Match the OpticWise examples above
- Direct, confident, strategic
- Short, punchy sentences
- No robotic phrases ("Based on my knowledge", "According to my analysis")
- Natural, conversational language
- Think like a colleague, not an AI

**KEY RULES:**
1. Never mention searching or analyzing
2. Present information naturally
3. Be direct and helpful
4. Skip preambles
5. Use casual language`;

          const claudeStream = await ai.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: intent.suggestedMaxTokens || 16000,
            temperature: intent.suggestedTemperature || 0.3,
            system: systemPrompt,
            messages: [{ role: 'user', content: message }],
          });

          let fullResponse = '';

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullResponse += text;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'content',
                    text: text,
                  })}\n\n`
                )
              );
            }
          }

          // Save messages
          await db.query(
            'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
            [sessionId, 'user', message]
          );

          const assistantMsgResult = await db.query(
            'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3) RETURNING id',
            [sessionId, 'assistant', fullResponse]
          );

          const assistantMessageId = assistantMsgResult.rows[0]?.id;

          // Update session
          await db.query('UPDATE "AgentChatSession" SET "updatedAt" = NOW() WHERE id = $1', [sessionId]);

          // Send completion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                messageId: assistantMessageId,
                sources: toolResults.map(t => t.result.source_type),
                performance: {
                  responseTime: Date.now() - startTime,
                  queryType: intent.type,
                },
              })}\n\n`
            )
          );

          // Save to cache
          await saveToSemanticCache(
            message,
            fullResponse,
            { sources: toolResults },
            db,
            oai,
            24
          );

          controller.close();
        } catch (error) {
          console.error('[OWnet Enhanced] Error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: 'Failed to process message',
                details: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
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
    console.error('[OWnet Enhanced] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}
