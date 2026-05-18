/**
 * OWnet Agent - Advanced Chat API
 * Enterprise-grade AI agent with enhanced RAG, query expansion, semantic search,
 * intelligent context management, and continuous learning capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { getSession } from '@/lib/session';
import {
  classifyQuery,
  expandQuery,
  loadContextWithinBudget,
  detectDataSourceIntent,
  checkSemanticCache,
  saveToSemanticCache,
  estimateTokens,
  formatSourceCitations,
  getVoiceExemplars,
  formatVoiceExemplars
} from '@/lib/ai-agent-utils';
import { generateBrandScriptPrompt } from '@/lib/brandscript-prompt';
import { 
  enforceBrandVoice, 
  validateSB7Structure, 
  injectReframingLineIfNeeded 
} from '@/lib/brandscript-voice-enforcement';

// Configure route for long-running operations
export const maxDuration = 300; // 5 minutes (maximum for Vercel Pro/Render)
export const dynamic = 'force-dynamic'; // Disable static optimization

// Initialize on first use to avoid build-time errors
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
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

function getPinecone() {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    let currentUserId: string;

    const internalKey = request.headers.get('x-internal-api-key');
    const isInternalCall = internalKey && process.env.AUTH_SECRET && internalKey === process.env.AUTH_SECRET;

    if (isInternalCall) {
      currentUserId = request.headers.get('x-slack-user-id') || 'slack-service';
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      currentUserId = session.userId;
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId required' },
        { status: 400 }
      );
    }

    const db = getPool();
    const ai = getAnthropic();
    const openai = new (await import('openai')).default({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const pc = getPinecone();

    console.log('[OWnet] Processing query:', message);
    
    // Step 1: Check semantic cache for similar recent queries
    const cachedResponse = await checkSemanticCache(message, db, openai, 0.95);
    if (cachedResponse) {
      console.log('[OWnet] Cache hit! Returning cached response');
      
      // Apply brand voice enforcement to cached responses too!
      let cleanedResponse = enforceBrandVoice(cachedResponse.response);
      cleanedResponse = injectReframingLineIfNeeded(cleanedResponse);
      
      // Ensure session exists before saving (prevents FK violation)
      const cacheSessionCheck = await db.query(
        'SELECT id FROM "AgentChatSession" WHERE id = $1', [sessionId]
      );
      if (cacheSessionCheck.rows.length === 0) {
        await db.query(
          `INSERT INTO "AgentChatSession" (id, "userId", title, "createdAt", "updatedAt")
           VALUES ($1, $2, 'New Chat', NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
          [sessionId, currentUserId]
        );
      }

      await db.query(
        'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
        [sessionId, 'user', message]
      );
      
      const assistantMsgResult = await db.query(
        'INSERT INTO "AgentChatMessage" ("sessionId", role, content, sources) VALUES ($1, $2, $3, $4) RETURNING id',
        [sessionId, 'assistant', cleanedResponse, JSON.stringify(cachedResponse.sources)]
      );
      
      // Return cached response as SSE stream for frontend compatibility
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // Send progress message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'Retrieving cached response...' })}\n\n`));
          
          // Stream the cached content in chunks (simulates typing)
          const words = cleanedResponse.split(' ');
          for (let i = 0; i < words.length; i += 10) {
            const chunk = words.slice(i, i + 10).join(' ') + ' ';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', text: chunk })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 20)); // Small delay for smooth rendering
          }
          
          // Send completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            messageId: assistantMsgResult.rows[0]?.id,
            sources: cachedResponse.sources,
            cached: true
          })}\n\n`));
          
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Step 2: Classify query intent
    const intent = classifyQuery(message);
    console.log('[OWnet] Query classification:', intent.type, `(${intent.confidence * 100}% confidence)`);
    
    // Log deep analysis mode activation
    if (intent.type === 'deep_analysis') {
      console.log('[OWnet] 🔬 DEEP ANALYSIS MODE ACTIVATED');
      console.log('[OWnet] Max tokens:', intent.suggestedMaxTokens);
      console.log('[OWnet] Trigger keywords:', intent.keywords);
    }
    
    // Step 3: Expand query for better search coverage (for research/deep analysis)
    let expandedQuery = null;
    if (intent.requiresDeepSearch) {
      expandedQuery = await expandQuery(message, openai);
      console.log('[OWnet] Query expanded with', expandedQuery.variations.length, 'variations');
    }
    
    // Step 4: Detect which data sources are needed
    const dataSourceIntent = detectDataSourceIntent(message);
    console.log('[OWnet] Data sources needed:', dataSourceIntent);
    
    // Step 5: Load context intelligently within token budget
    // Check if user requested max tokens with enhanced detection
    const hasMaxCommand = /\b(max[_\s]?tokens?|max|maximum|exhaustive|ultra[-\s]?detailed|analyze[_\s]all|all[_\s]of[_\s]them|provide[_\s]a?[_\s]deep|deep[_\s]analysis)\b/i.test(message);
    
    // Significantly increase context window for deep analysis
    const contextWindow = hasMaxCommand ? 200000 :
                          intent.type === 'deep_analysis' ? 200000 : 
                          intent.type === 'research' ? 180000 : 120000;
    
    const { contexts, totalTokens, budget } = await loadContextWithinBudget(
      message,
      db,
      openai,
      pc,
      sessionId,
      contextWindow,
      currentUserId
    );
    
    console.log('[OWnet] Loaded context:', {
      sources: contexts.map(c => c.type),
      totalTokens,
      budget
    });

    // 1. Load ALL transcript metadata (titles, dates, participants) — always available
    // This ensures the agent knows what transcripts exist even when semantic search doesn't match
    //
    // As of 2026-05-18 the Fathom integration is deprecated and the
    // CallTranscript / CallTranscriptChunk tables are no longer queried. All
    // meeting/transcript context now resolves from ReadAIMeeting.
    let transcriptContext = '';
    let transcriptMetadataContext = '';
    try {
      const readAiMeetings = await db.query<{
        id: string;
        title: string;
        startTime: string;
        endTime: string;
        participants: unknown;
        summary: string;
      }>(
        `SELECT id, title, "startTime", "endTime", participants, summary
         FROM "ReadAIMeeting"
         ORDER BY "startTime" DESC NULLS LAST`
      );

      const totalCount = readAiMeetings.rows.length;

      if (totalCount > 0) {
        transcriptMetadataContext = `\n\n**All Available Call Transcripts & Meetings (${totalCount} total, source: Read.ai):**\n\n`;

        const formatRow = (
          t: { title: string; startTime: string; endTime: string; participants: unknown; summary: string },
          idx: number
        ) => {
          const startDate = t.startTime ? new Date(t.startTime).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown date';
          const startISO = t.startTime ? new Date(t.startTime).toISOString().split('T')[0] : 'unknown';
          const duration = t.startTime && t.endTime
            ? Math.round((new Date(t.endTime).getTime() - new Date(t.startTime).getTime()) / 60000) + ' min'
            : 'Unknown duration';
          let participantList = '';
          if (t.participants) {
            try {
              const parts = typeof t.participants === 'string' ? JSON.parse(t.participants) : t.participants;
              if (Array.isArray(parts)) {
                participantList = parts.map((p: { name?: string; email?: string }) => p.name || p.email || '').filter(Boolean).join(', ');
              }
            } catch { /* ignore parse errors */ }
          }
          return `${idx + 1}. **${t.title}** — ${startDate} (${startISO}) (${duration})${participantList ? `\n   Participants: ${participantList}` : ''}${t.summary ? `\n   Summary: ${t.summary.slice(0, 200)}` : ''}`;
        };

        transcriptMetadataContext += readAiMeetings.rows
          .map((t, idx) => formatRow(t, idx))
          .join('\n\n');

        console.log('[OWnet] Loaded metadata for', totalCount, 'ReadAI transcripts');
      }
    } catch (error) {
      console.log('[OWnet] Transcript metadata query error:', error);
    }

    // 1b. Search transcripts using Pinecone for semantic content matching
    try {
      const index = pc.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');
      
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: message,
        dimensions: 1024,
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      
      const searchResults = await index.query({
        topK: 5,
        vector: queryEmbedding,
        includeMetadata: true,
      });

      if (searchResults.matches && searchResults.matches.length > 0) {
        transcriptContext = '\n\n**Relevant Content from Sales Calls (Semantic Search):**\n\n' + 
          searchResults.matches
            .map((m) => {
              const callInfo = `${m.metadata?.title || 'Call'} (${new Date(m.metadata?.date as string || '').toLocaleDateString()})`;
              return `From ${callInfo}:\n${m.metadata?.text_chunk || ''}`;
            })
            .join('\n\n');
        
        console.log('[OWnet] Found', searchResults.matches.length, 'relevant transcript chunks from Pinecone');
      }
    } catch (error) {
      console.log('[OWnet] Pinecone transcript search error:', error);
    }

    // 2. Search Google Workspace data (emails, calendar, drive)
    let googleContext = '';
    const messageLower = message.toLowerCase();
    
    // Check if query might benefit from Google Workspace data
    const needsEmail = messageLower.includes('email') || messageLower.includes('mail') || messageLower.includes('message') || messageLower.includes('conversation');
    const needsCalendar = messageLower.includes('meeting') || messageLower.includes('calendar') || messageLower.includes('schedule') || messageLower.includes('event');
    const needsDrive = messageLower.includes('document') || messageLower.includes('file') || messageLower.includes('drive') || messageLower.includes('proposal');
    
    // Generate embedding once for all vector searches (email, drive, knowledge base)
    let queryVector: number[] | null = null;
    try {
      const searchEmbedding = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: message,
        dimensions: 1024,
      });
      queryVector = searchEmbedding.data[0].embedding;
    } catch (embErr) {
      console.log('[OWnet] Embedding generation error:', embErr);
    }

    if (queryVector && (needsEmail || needsCalendar || needsDrive)) {
      try {
        
        // Search Gmail if needed
        if (needsEmail) {
          try {
            // Check if GmailMessage has a vector-type embedding column
            const colCheck = await db.query(
              `SELECT 1 FROM information_schema.columns
               WHERE table_name = 'GmailMessage' AND column_name = 'embedding'
                 AND udt_name = 'vector' LIMIT 1`
            );
            
            let emailResults;
            if (colCheck.rows.length > 0) {
              emailResults = await db.query(
                `SELECT id, subject, "from", "to", snippet, date, body
                 FROM "GmailMessage"
                 WHERE vectorized = true AND embedding IS NOT NULL
                   AND "syncUserId" = $2
                 ORDER BY embedding <=> $1::vector
                 LIMIT 5`,
                [`[${queryVector.join(',')}]`, currentUserId]
              );
            } else {
              const keywords = message.toLowerCase().split(/\s+/).slice(0, 5).join('|');
              emailResults = await db.query(
                `SELECT id, subject, "from", "to", snippet, date, body
                 FROM "GmailMessage"
                 WHERE (subject ILIKE $1 OR body ILIKE $1 OR snippet ILIKE $1)
                   AND "syncUserId" = $2
                 ORDER BY date DESC
                 LIMIT 5`,
                [`%${keywords}%`, currentUserId]
              );
            }
            
            if (emailResults.rows.length > 0) {
              googleContext += '\n\n**Relevant Emails:**\n\n';
              googleContext += emailResults.rows.map((email: { subject: string; from: string; date: string; snippet?: string; body?: string }, idx: number) => {
                return `${idx + 1}. **${email.subject}**
   - From: ${email.from}
   - Date: ${new Date(email.date).toLocaleDateString()}
   - Preview: ${email.snippet || email.body?.slice(0, 200)}`;
              }).join('\n\n');
            }
          } catch (error) {
            console.log('[OWnet] Email search error:', error);
          }
        }
        
        // Search Calendar if needed
        if (needsCalendar) {
          const calColCheck = await db.query(
            `SELECT 1 FROM information_schema.columns
             WHERE table_name = 'CalendarEvent' AND column_name = 'embedding'
               AND udt_name = 'vector' LIMIT 1`
          );

          const calendarResults = calColCheck.rows.length > 0
            ? await db.query(
                `SELECT id, summary, description, "startTime", "endTime", organizer, location, attendees
                 FROM "CalendarEvent"
                 WHERE vectorized = true AND embedding IS NOT NULL
                 ORDER BY embedding <=> $1::vector
                 LIMIT 5`,
                [`[${queryVector.join(',')}]`]
              )
            : await db.query(
                `SELECT id, summary, description, "startTime", "endTime", organizer, location, attendees
                 FROM "CalendarEvent"
                 ORDER BY "startTime" DESC
                 LIMIT 5`
              );
          
          if (calendarResults.rows.length > 0) {
            googleContext += '\n\n**Relevant Calendar Events:**\n\n';
            googleContext += calendarResults.rows.map((event, idx) => {
              const attendeesData = event.attendees ? 
                (Array.isArray(event.attendees) ? event.attendees : JSON.parse(event.attendees as string)) : [];
              const attendeesList = attendeesData
                  .map((a: { name?: string; email?: string }) => a.name || a.email).join(', ');
              return `${idx + 1}. **${event.summary}**
   - Time: ${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleTimeString()}
   - Location: ${event.location || 'No location'}
   - Attendees: ${attendeesList}
   - Description: ${event.description?.slice(0, 150) || 'No description'}`;
            }).join('\n\n');
          }
        }
        
        // Search Drive if needed
        if (needsDrive) {
          const driveColCheck = await db.query(
            `SELECT 1 FROM information_schema.columns
             WHERE table_name = 'DriveFile' AND column_name = 'embedding'
               AND udt_name = 'vector' LIMIT 1`
          );

          const driveResults = driveColCheck.rows.length > 0
            ? await db.query(
                `SELECT id, name, "mimeType", description, content, "webViewLink", "modifiedTime"
                 FROM "DriveFile"
                 WHERE vectorized = true AND embedding IS NOT NULL
                 ORDER BY embedding <=> $1::vector
                 LIMIT 5`,
                [`[${queryVector.join(',')}]`]
              )
            : await db.query(
                `SELECT id, name, "mimeType", description, content, "webViewLink", "modifiedTime"
                 FROM "DriveFile"
                 ORDER BY "modifiedTime" DESC NULLS LAST
                 LIMIT 5`
              );
          
          if (driveResults.rows.length > 0) {
            googleContext += '\n\n**Relevant Drive Files:**\n\n';
            googleContext += driveResults.rows.map((file, idx) => {
              const preview = file.content?.slice(0, 200) || file.description || '';
              return `${idx + 1}. **${file.name}**
   - Type: ${file.mimeType}
   - Modified: ${new Date(file.modifiedTime).toLocaleDateString()}
   - Preview: ${preview}
   - Link: ${file.webViewLink}`;
            }).join('\n\n');
          }
        }

      } catch (error) {
        console.log('[OWnet] Google Workspace search error:', error);
      }
    }

    // Always search Knowledge Base (uploaded documents) regardless of query keywords
    if (queryVector) {
      try {
        const kbColCheck = await db.query(
          `SELECT 1 FROM information_schema.columns
           WHERE table_name = 'KnowledgeChunk' AND column_name = 'embedding'
             AND udt_name = 'vector' LIMIT 1`
        );

        let kbResults;
        if (kbColCheck.rows.length > 0) {
          kbResults = await db.query(
            `SELECT kc."chunkText", kc."wordCount", kd.name as doc_name, kd.category, kd.comment,
                    1 - (kc.embedding <=> $1::vector) as similarity
             FROM "KnowledgeChunk" kc
             JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
             WHERE kc.embedding IS NOT NULL
             ORDER BY kc.embedding <=> $1::vector
             LIMIT 8`,
            [`[${queryVector.join(',')}]`]
          );
        } else {
          kbResults = await db.query(
            `SELECT kc."chunkText", kc."wordCount", kd.name as doc_name, kd.category, kd.comment,
                    0.5 as similarity
             FROM "KnowledgeChunk" kc
             JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
             ORDER BY kd."createdAt" DESC
             LIMIT 8`
          );
        }

        if (kbResults.rows.length > 0) {
          const relevantKb = kbResults.rows.filter((r: { similarity: number }) => r.similarity > 0.3);
          if (relevantKb.length > 0) {
            googleContext += '\n\n**Knowledge Base Documents:**\n\n';
            googleContext += relevantKb.map((chunk: { doc_name: string; category: string; comment: string; chunkText: string }, idx: number) => {
              return `${idx + 1}. **${chunk.doc_name}** (${chunk.category || 'Uncategorized'})
   ${chunk.comment ? `Note: ${chunk.comment}\n   ` : ''}Content: ${chunk.chunkText.slice(0, 500)}`;
            }).join('\n\n');
          }
        }
      } catch (kbError) {
        console.log('[OWnet] Knowledge base search error:', kbError);
      }
    }

    // 3. Query CRM data based on user's question
    let crmContext = '';
    
    if (messageLower.includes('deal') || messageLower.includes('close') || messageLower.includes('pipeline') || messageLower.includes('opportunity')) {
      try {
        const dealsResult = await db.query(
          `SELECT d.id, d.title, d.value, d.currency, d.status, d.probability,
                  d."expectedCloseDate", d."lastActivityDate", d."nextActivityDate",
                  s.name as stage_name, p.name as pipeline_name,
                  o.name as organization_name, per.name as person_name,
                  u.name as owner_name
           FROM "Deal" d
           LEFT JOIN "Stage" s ON d."stageId" = s.id
           LEFT JOIN "Pipeline" p ON d."pipelineId" = p.id
           LEFT JOIN "Organization" o ON d."organizationId" = o.id
           LEFT JOIN "Person" per ON d."personId" = per.id
           LEFT JOIN "User" u ON d."ownerId" = u.id
           WHERE d.status = 'open'
           ORDER BY 
             CASE 
               WHEN s.name IN ('DDI Review Proposed', 'RR Opportunities', 'RR Contracting') THEN 1
               WHEN s.name = 'Discovery & Qualification' THEN 2
               ELSE 3
             END,
             d."lastActivityDate" DESC NULLS LAST,
             d.value DESC
           LIMIT 20`
        );
        
        if (dealsResult.rows.length > 0) {
          crmContext += '\n\n**Current CRM Pipeline Data:**\n\n';
          crmContext += dealsResult.rows.map((deal, idx) => {
            return `${idx + 1}. **${deal.title}** (${deal.organization_name || 'No org'})
   - Stage: ${deal.stage_name}
   - Value: ${deal.currency} ${Number(deal.value).toLocaleString()}
   - Owner: ${deal.owner_name}
   - Last Activity: ${deal.lastActivityDate ? new Date(deal.lastActivityDate).toLocaleDateString() : 'None'}
   - Next Activity: ${deal.nextActivityDate ? new Date(deal.nextActivityDate).toLocaleDateString() : 'Not scheduled'}`;
          }).join('\n\n');
        }
      } catch (error) {
        console.log('[OWnet] CRM query error:', error);
      }
    }
    
    if (messageLower.includes('contact') || messageLower.includes('person') || messageLower.includes('people')) {
      try {
        const contactsResult = await db.query(
          `SELECT p.id, p.name, p."firstName", p."lastName", p.email, p.title,
                  o.name as organization_name,
                  (SELECT COUNT(*) FROM "Deal" WHERE "personId" = p.id AND status = 'open') as open_deals
           FROM "Person" p
           LEFT JOIN "Organization" o ON p."organizationId" = o.id
           WHERE p.email IS NOT NULL
           ORDER BY p."createdAt" DESC
           LIMIT 15`
        );
        
        if (contactsResult.rows.length > 0) {
          crmContext += '\n\n**Recent Contacts:**\n\n';
          crmContext += contactsResult.rows.map((contact, idx) => {
            return `${idx + 1}. **${contact.name || `${contact.firstName} ${contact.lastName}`}**
   - Title: ${contact.title || 'N/A'}
   - Company: ${contact.organization_name || 'No org'}
   - Email: ${contact.email}
   - Open Deals: ${contact.open_deals}`;
          }).join('\n\n');
        }
      } catch (error) {
        console.log('[OWnet] Contacts query error:', error);
      }
    }

    // 3. Get conversation history (ENHANCED - already loaded in contexts)
    const historyContext = contexts.find(c => c.type === 'chat_history');
    const history: Array<{ role: string; content: string }> = [];
    
    if (historyContext && historyContext.metadata?.messages) {
      // Use the properly structured messages from metadata
      const messages = historyContext.metadata.messages as Array<{ role: string; content: string }>;
      history.push(...messages);
    }

    // Use intent classification instead of keyword matching
    const isDeepAnalysis = intent.type === 'deep_analysis';

    // 4. Build context-aware prompt
    const currentDate = new Date();
    
    // Fetch style examples for natural communication
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
        const examples = styleResult.rows.map(row => 
          `[${row.author || 'Example'} - ${row.tone}]\n${row.content}`
        );
        styleContext = `\n\n**OPTICWISE COMMUNICATION STYLE EXAMPLES:**\n\n${examples.join('\n\n---\n\n')}\n`;
      }
    } catch (error) {
      console.log('[OWnet] Error fetching style examples:', error);
    }

    // Voice exemplars — only retrieved for content-generation intents (writing
    // a blog post, LinkedIn article, short post, or weekly briefing). The
    // exemplars are previously published OpticWise pieces ingested by
    // `scripts/ingest-voice-exemplars.ts` and stored in StyleGuide with
    // category = 'voice_exemplar'.
    const isContentGenIntent =
      /\b(blog post|linkedin post|linkedin article|short[- ]form post|weekly briefing|content engine|draft (a|me)? (post|article|blog)|write (a|me)? (post|article|blog))\b/i.test(
        message
      );
    if (isContentGenIntent) {
      try {
        const exemplarAuthor: 'Bill' | 'Drew' | undefined = /\bdrew\b/i.test(message)
          ? 'Drew'
          : /\bbill\b/i.test(message)
            ? 'Bill'
            : undefined;
        const exemplarSubcat = /\blinkedin (?:short|post)\b/i.test(message)
          ? 'linkedin_short'
          : /\blinkedin article\b/i.test(message)
            ? 'linkedin_article'
            : 'blog';
        const exemplars = await getVoiceExemplars(message, db, openai, {
          topK: 3,
          subcategory: exemplarSubcat as 'blog' | 'linkedin_article' | 'linkedin_short',
          author: exemplarAuthor,
        });
        if (exemplars.length > 0) {
          styleContext += formatVoiceExemplars(exemplars);
          console.log(`[OWnet] Injected ${exemplars.length} voice exemplars for content gen.`);
        }
      } catch (err) {
        console.log('[OWnet] Voice exemplar retrieval skipped:', (err as Error).message);
      }
    }

    // Generate BrandScript-compliant system prompt
    const requestedAuthor: 'bill' | 'drew' | 'opticwise' = /\bdrew\b/i.test(message)
      ? 'drew'
      : /\bbill\b/i.test(message) && isContentGenIntent
        ? 'bill'
        : 'opticwise';
    const brandScriptPrompt = generateBrandScriptPrompt({
      isDeepAnalysis,
      includeStyleContext: styleContext,
      currentDate,
      author: requestedAuthor,
      contentEngineMode: isContentGenIntent,
    });
    
    // Add specific context about customer questions (operational requirement)
    const customerQuestionsGuidance = `

**CRITICAL - When Asked for Customer/Prospect Questions:**
When the user asks for customer or prospect questions from emails:
1. Look through the email content provided for actual questions asked by prospects/customers
2. Focus on emails FROM external contacts (not internal team emails)
3. Extract the actual verbatim questions or inquiries
4. Provide full context: who asked, when, what deal/context, what the question was about
5. Prioritize emails with substantive content (ignore automated notifications, invoices, newsletters)
6. If the available emails are mostly administrative, say so directly and offer alternatives`;
    
    // Build context from loadContextWithinBudget results (pgvector search)
    let ragContext = '';
    for (const ctx of contexts) {
      if (ctx.type === 'chat_history') continue; // handled separately via history
      if (ctx.content && ctx.content.trim()) {
        const label = {
          transcript: 'Transcript Data (pgvector)',
          email: 'Email Data',
          calendar: 'Calendar Data',
          drive: 'Drive Documents',
          crm: 'CRM Data',
          knowledge_base: 'Knowledge Base'
        }[ctx.type] || ctx.type;
        ragContext += `\n\n**${label} (${ctx.tokenCount} tokens, ${typeof ctx.metadata === 'object' ? JSON.stringify(ctx.metadata).slice(0, 100) : ''}):**\n${ctx.content}`;
      }
    }

    // Combine with available data context
    const systemPrompt = brandScriptPrompt + `

**AVAILABLE INFORMATION:**
${transcriptMetadataContext || ''}
${crmContext || ''}
${transcriptContext || ''}
${googleContext || ''}
${ragContext || ''}
${customerQuestionsGuidance}`;

    // 4. Call Claude with enhanced parameters
    const messages: Anthropic.MessageParam[] = [
      ...history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];
    
    // Use intelligent token allocation based on intent
    const maxTokens = intent.suggestedMaxTokens;
    const temperature = intent.suggestedTemperature;
    
    console.log(`[OWnet] Mode: ${intent.type} | Max tokens: ${maxTokens} | Temperature: ${temperature} | Context: ${totalTokens} tokens`);
    
    // Create streaming response with keep-alive mechanism
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Keep-alive heartbeat to prevent timeout during long operations
        let lastActivityTime = Date.now();
        const HEARTBEAT_INTERVAL = 15000; // Send heartbeat every 15 seconds
        
        const heartbeatTimer = setInterval(() => {
          const timeSinceActivity = Date.now() - lastActivityTime;
          if (timeSinceActivity >= HEARTBEAT_INTERVAL) {
            // Send keep-alive comment (SSE standard)
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
            lastActivityTime = Date.now();
          }
        }, HEARTBEAT_INTERVAL);
        
        try {
          // Helper to send data and update activity time
          const sendData = (data: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            lastActivityTime = Date.now();
          };
          
          // Send progress indicator: Starting analysis
          sendData({
            type: 'progress',
            message: intent.type === 'deep_analysis' ? 'Preparing deep analysis with maximum context...' : 'Analyzing your query...'
          });
          
          // Small delay for UX (let user see the progress)
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Send progress indicator: Searching transcripts
          if (transcriptContext) {
            sendData({
              type: 'progress',
              message: 'Searching meeting transcripts...'
            });
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Send progress indicator: Searching CRM
          if (crmContext) {
            sendData({
              type: 'progress',
              message: 'Searching CRM data...'
            });
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Send progress indicator: Searching Google Workspace
          if (googleContext) {
            sendData({
              type: 'progress',
              message: 'Searching emails and documents...'
            });
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Send progress indicator: Context loaded
          sendData({
            type: 'progress',
            message: `Loaded ${contexts.length} data sources • ${totalTokens.toLocaleString()} tokens • Max output: ${maxTokens.toLocaleString()} tokens`
          });
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Send progress indicator: Generating response
          sendData({
            type: 'progress',
            message: intent.type === 'deep_analysis' ? 'Generating comprehensive analysis (this may take a moment)...' : 'Generating response...'
          });
          
          // Stream the actual response from Claude
          const claudeStream = await ai.messages.stream({
            model: 'claude-opus-4-7',
            max_tokens: maxTokens,
            temperature: temperature,
            system: systemPrompt,
            messages,
          });
          
          let fullResponse = '';
          let chunkCount = 0;
          
          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullResponse += text;
              chunkCount++;
              
              // Stream content to user
              sendData({
                type: 'content',
                text: text
              });
              
              // For deep analysis, send periodic progress updates
              if (intent.type === 'deep_analysis' && chunkCount % 100 === 0) {
                sendData({
                  type: 'meta',
                  message: `Analyzing... (${fullResponse.length.toLocaleString()} characters generated)`
                });
              }
            }
          }
          
          // Clear heartbeat timer
          clearInterval(heartbeatTimer);
          
          // Apply comprehensive brand voice enforcement
          fullResponse = enforceBrandVoice(fullResponse);
          
          // Inject reframing line if needed (contextual)
          fullResponse = injectReframingLineIfNeeded(fullResponse);
          
          // Validate SB7 structure and log warnings
          const validation = validateSB7Structure(fullResponse);
          if (!validation.isValid) {
            console.warn('[BrandScript] SB7 validation warnings:', validation.warnings);
            console.warn('[BrandScript] SB7 score:', `${validation.score}/7`);
          } else {
            console.log('[BrandScript] ✅ SB7 structure validated:', `${validation.score}/7`);
          }
          
          // Generate and append source citations
          const sourceCitations = formatSourceCitations(contexts);
          
          // Stream the citations if we have any
          if (sourceCitations) {
            sendData({
              type: 'content',
              text: sourceCitations
            });
            fullResponse += sourceCitations;
          }
          
          // Ensure session exists before saving messages (prevents FK violation)
          const sessionCheck = await db.query(
            'SELECT id FROM "AgentChatSession" WHERE id = $1',
            [sessionId]
          );
          if (sessionCheck.rows.length === 0) {
            await db.query(
              `INSERT INTO "AgentChatSession" (id, "userId", title, "createdAt", "updatedAt")
               VALUES ($1, $2, 'New Chat', NOW(), NOW())
               ON CONFLICT (id) DO NOTHING`,
              [sessionId, currentUserId]
            );
          }

          await db.query(
            'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
            [sessionId, 'user', message]
          );

          const assistantMsgResult = await db.query(
            'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3) RETURNING id',
            [sessionId, 'assistant', fullResponse]
          );
          
          const assistantMessageId = assistantMsgResult.rows[0]?.id;
          
          // Update session timestamp and title if needed
          const messageCountResult = await db.query(
            'SELECT COUNT(*) as count, title FROM "AgentChatSession" WHERE id = $1 GROUP BY id, title',
            [sessionId]
          );
          
          const sessionData = messageCountResult.rows[0];
          const isFirstResponse = sessionData?.title === 'New Chat';
          
          if (isFirstResponse) {
            try {
              const titlePrompt = `Based on this conversation, generate a short, descriptive title (max 6 words) that captures the main topic. Return ONLY the title, nothing else.

User question: ${message}

AI response summary: ${fullResponse.slice(0, 300)}`;

              const titleResponse = await ai.messages.create({
                model: 'claude-opus-4-7',
                max_tokens: 50,
                temperature: 0.3,
                messages: [{ role: 'user', content: titlePrompt }],
              });

              const generatedTitle = titleResponse.content[0].type === 'text' 
                ? titleResponse.content[0].text.replace(/["']/g, '').trim()
                : 'Chat';

              await db.query(
                'UPDATE "AgentChatSession" SET "updatedAt" = NOW(), title = $2 WHERE id = $1',
                [sessionId, generatedTitle.slice(0, 100)]
              );
            } catch (titleError) {
              console.log('[OWnet] Title generation error:', titleError);
              await db.query(
                'UPDATE "AgentChatSession" SET "updatedAt" = NOW() WHERE id = $1',
                [sessionId]
              );
            }
          } else {
            await db.query(
              'UPDATE "AgentChatSession" SET "updatedAt" = NOW() WHERE id = $1',
              [sessionId]
            );
          }
          
          // Send completion message with metadata
          const sourcesMetadata = {
            sources: contexts.map(c => ({
              type: c.type,
              tokenCount: c.tokenCount,
              itemCount: c.metadata
            })),
            totalContextTokens: totalTokens,
            queryClassification: intent.type,
            confidence: intent.confidence
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            messageId: assistantMessageId,
            sources: sourcesMetadata,
            performance: {
              responseTime: Date.now() - startTime,
              tokensUsed: estimateTokens(message) + estimateTokens(fullResponse) + totalTokens,
              contextTokens: totalTokens,
              queryType: intent.type
            }
          })}\n\n`));
          
          // Save to cache
          await saveToSemanticCache(message, fullResponse, sourcesMetadata, db, openai, 24);
          
          // Track analytics
          try {
            await db.query(
              `INSERT INTO "QueryAnalytics" 
               ("sessionId", query, "queryType", "sourcesUsed", "sourcesCount", 
                "responseLength", "responseTime", "tokensUsed", model, temperature, 
                "maxTokens", "contextWindowUsed")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                sessionId,
                message,
                intent.type,
                JSON.stringify(sourcesMetadata.sources),
                contexts.length,
                fullResponse.length,
                Date.now() - startTime,
                estimateTokens(message) + estimateTokens(fullResponse) + totalTokens,
                'claude-opus-4-7',
                temperature,
                maxTokens,
                totalTokens
              ]
            );
          } catch (error) {
            console.error('[OWnet] Error saving analytics:', error);
          }
          
          controller.close();
        } catch (error) {
          // Clear heartbeat timer on error
          clearInterval(heartbeatTimer);
          
          console.error('[OWnet] Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: 'Failed to process message',
            details: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`));
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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

