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
  estimateTokens
} from '@/lib/ai-agent-utils';

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
      
      // Still save the user message
      await db.query(
        'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
        [sessionId, 'user', message]
      );
      
      const assistantMsgResult = await db.query(
        'INSERT INTO "AgentChatMessage" ("sessionId", role, content, sources) VALUES ($1, $2, $3, $4) RETURNING id',
        [sessionId, 'assistant', cachedResponse.response, JSON.stringify(cachedResponse.sources)]
      );
      
      return NextResponse.json({
        success: true,
        response: cachedResponse.response,
        messageId: assistantMsgResult.rows[0]?.id,
        sources: cachedResponse.sources,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    // Step 2: Classify query intent
    const intent = classifyQuery(message);
    console.log('[OWnet] Query classification:', intent.type, `(${intent.confidence * 100}% confidence)`);
    
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
    // Check if user requested max tokens
    const hasMaxCommand = /\b(max_tokens|max|maximum|exhaustive|ultra-detailed)\b/i.test(message);
    
    const contextWindow = hasMaxCommand ? 200000 :
                          intent.type === 'deep_analysis' ? 180000 : 
                          intent.type === 'research' ? 150000 : 100000;
    
    const { contexts, totalTokens, budget } = await loadContextWithinBudget(
      message,
      db,
      openai,
      pc,
      sessionId,
      contextWindow
    );
    
    console.log('[OWnet] Loaded context:', {
      sources: contexts.map(c => c.type),
      totalTokens,
      budget
    });

    // 1. Search transcripts using Pinecone with OpenAI embeddings (ENHANCED)
    console.log('[OWnet] Searching transcripts for:', message);
    
    let transcriptContext = '';
    try {
      // Generate embedding for the query
      const openai = new (await import('openai')).default({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: message,
        dimensions: 1024,
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      
      // Search Pinecone
      const pc = getPinecone();
      const index = pc.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');
      
      const searchResults = await index.query({
        topK: 5,
        vector: queryEmbedding,
        includeMetadata: true,
      });

      if (searchResults.matches && searchResults.matches.length > 0) {
        // Format transcript context naturally without metadata clutter
        transcriptContext = '\n\n**Relevant Information from Sales Calls:**\n\n' + 
          searchResults.matches
            .map((m) => {
              const callInfo = `${m.metadata?.title || 'Call'} (${new Date(m.metadata?.date as string || '').toLocaleDateString()})`;
              return `From ${callInfo}:\n${m.metadata?.text_chunk || ''}`;
            })
            .join('\n\n');
        
        console.log('[OWnet] Found', searchResults.matches.length, 'relevant transcript chunks');
      }
    } catch (error) {
      console.log('[OWnet] Transcript search error:', error);
    }

    // 2. Search Google Workspace data (emails, calendar, drive)
    let googleContext = '';
    const messageLower = message.toLowerCase();
    
    // Check if query might benefit from Google Workspace data
    const needsEmail = messageLower.includes('email') || messageLower.includes('mail') || messageLower.includes('message') || messageLower.includes('conversation');
    const needsCalendar = messageLower.includes('meeting') || messageLower.includes('calendar') || messageLower.includes('schedule') || messageLower.includes('event');
    const needsDrive = messageLower.includes('document') || messageLower.includes('file') || messageLower.includes('drive') || messageLower.includes('proposal');
    
    if (needsEmail || needsCalendar || needsDrive) {
      try {
        const openaiForGoogle = new (await import('openai')).default({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        const googleEmbedding = await openaiForGoogle.embeddings.create({
          model: 'text-embedding-3-large',
          input: message,
          dimensions: 1024,
        });
        
        const queryVector = googleEmbedding.data[0].embedding;
        
        // Search Gmail if needed
        if (needsEmail) {
          try {
            const emailResults = await db.query(
              `SELECT id, subject, "from", "to", snippet, date, body
               FROM "GmailMessage"
               WHERE vectorized = true AND embedding IS NOT NULL
               ORDER BY embedding <=> $1::vector
               LIMIT 5`,
              [`[${queryVector.join(',')}]`]
            );
            
            if (emailResults.rows.length > 0) {
              googleContext += '\n\n**Relevant Emails:**\n\n';
              googleContext += emailResults.rows.map((email, idx) => {
                return `${idx + 1}. **${email.subject}**
   - From: ${email.from}
   - Date: ${new Date(email.date).toLocaleDateString()}
   - Preview: ${email.snippet || email.body?.slice(0, 200)}`;
              }).join('\n\n');
            }
          } catch (vectorError) {
            // Fallback: Use keyword search if vector extension not available
            console.log('[OWnet] Vector search unavailable, using keyword fallback for emails');
            const keywords = message.toLowerCase().split(/\s+/).slice(0, 5).join('|');
            const emailResults = await db.query(
              `SELECT id, subject, "from", "to", snippet, date, body
               FROM "GmailMessage"
               WHERE (subject ILIKE $1 OR body ILIKE $1 OR snippet ILIKE $1)
               ORDER BY date DESC
               LIMIT 5`,
              [`%${keywords}%`]
            );
            
            if (emailResults.rows.length > 0) {
              googleContext += '\n\n**Relevant Emails (keyword search):**\n\n';
              googleContext += emailResults.rows.map((email, idx) => {
                return `${idx + 1}. **${email.subject}**
   - From: ${email.from}
   - Date: ${new Date(email.date).toLocaleDateString()}
   - Preview: ${email.snippet || email.body?.slice(0, 200)}`;
              }).join('\n\n');
            }
          }
        }
        
        // Search Calendar if needed
        if (needsCalendar) {
          const calendarResults = await db.query(
            `SELECT id, summary, description, "startTime", "endTime", organizer, location, attendees
             FROM "CalendarEvent"
             WHERE vectorized = true AND embedding IS NOT NULL
             ORDER BY embedding <=> $1::vector
             LIMIT 5`,
            [`[${queryVector.join(',')}]`]
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
          const driveResults = await db.query(
            `SELECT id, name, "mimeType", description, content, "webViewLink", "modifiedTime"
             FROM "DriveFile"
             WHERE vectorized = true AND embedding IS NOT NULL
             ORDER BY embedding <=> $1::vector
             LIMIT 5`,
            [`[${queryVector.join(',')}]`]
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
    const formattedDate = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
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
    
    const baseSystemPrompt = `You are OWnet, a knowledgeable sales assistant who has deep familiarity with the OpticWise business. You speak naturally and conversationally, like a trusted colleague who's been working alongside the team for years.

**IMPORTANT - Current Date & Time Context:**
Today is ${formattedDate}.
Current timestamp: ${currentDate.toISOString()}

When referencing dates in your responses:
- Always calculate relative dates from TODAY (${formattedDate})
- If data shows a date like "10/30" and today is January 15, 2026, that's in the PAST (October 30, 2025)
- Be accurate about "yesterday," "today," "tomorrow," "last week," "next week," etc.
- When you see old activity dates, acknowledge they are historical, not current
- If the most recent activity on a deal is months old, say so directly (e.g., "last activity was back in October, so this hasn't been touched in about 3 months")
${styleContext}`;
    
    const deepAnalysisPrompt = isDeepAnalysis ? `

**🔍 DEEP ANALYSIS MODE ACTIVATED**

The user has requested a deep dive or comprehensive analysis. This requires:

1. **Extensive Detail** - Go deep into every aspect, don't summarize
2. **Multiple Perspectives** - Look at trends, patterns, anomalies, opportunities
3. **Specific Examples** - Use actual names, dates, numbers, quotes from data
4. **Actionable Insights** - Provide strategic recommendations with reasoning
5. **Comprehensive Coverage** - Cover all relevant angles thoroughly
6. **Data-Driven** - Reference specific emails, calls, deals, activities
7. **Timeline Analysis** - Show progression over time
8. **Comparative Analysis** - Compare periods, people, deals, etc.

**Structure for Deep Analysis:**
- Start with executive summary
- Break down into detailed sections
- Use specific data points and examples
- Identify patterns and trends
- Highlight what's working and what needs attention
- Provide strategic recommendations
- Include next steps with priorities

**Be thorough and comprehensive** - this is not a quick answer, it's a detailed report.` : '';
    
    const systemPrompt = baseSystemPrompt + deepAnalysisPrompt + `

**Available Information:**
${crmContext || ''}
${transcriptContext || ''}
${googleContext || ''}

**Your Communication Style:**
- Match the tone and style shown in the OpticWise examples above
- Talk like a real person, not an AI or robot
- Skip formal phrases like "Based on your recent activity" or "Here are the items you should consider"
- Just dive right into the information naturally
- Use contractions (you've, there's, it's) and casual language
- Be direct, confident, and strategic like OpticWise's voice
- Think of yourself as a helpful coworker, not a system

**CRITICAL: Professional Formatting Requirements**

You MUST use clean, organized markdown formatting:

✅ **REQUIRED Formatting:**
- Use **bold** for emphasis and headers
- Use bullet points (- or •) for lists
- Use numbered lists (1. 2. 3.) for sequences
- Add blank lines between sections
- Use proper hierarchy (## for main sections, ### for subsections)
- Use horizontal rules (---) to separate major sections
- Use > blockquotes for important callouts
- Use \`code formatting\` for technical terms or IDs

**Example of EXCELLENT formatting:**

## Top Priority Deals

**1. Koelbel Metropoint** - $50K
- **Stage:** Discovery & Qualification
- **Last Activity:** Jan 15, 2026
- **Status:** Decision maker engaged, technical review needed
- **Next Step:** Schedule technical review call

**2. Mass Equities Vario** - $960K
- **Stage:** Proposal
- **Last Activity:** Nov 20, 2025 (2 months ago)
- **Status:** Good momentum, pricing questions pending
- **Next Step:** Follow up on pricing discussion

---

### Key Insights
- 2 deals need immediate attention
- Average deal size: $405K
- Response time critical for Mass Equities

> **Action Required:** Schedule Koelbel technical review this week

**How to Structure Responses:**

For lists/examples:
```
## [Main Topic]

**1. [Item Name]**
- Key detail 1
- Key detail 2
- Key detail 3

**2. [Item Name]**
- Key detail 1
- Key detail 2

---

### Summary
[Brief takeaway]
```

For analysis:
```
## Executive Summary
[2-3 sentence overview]

## Detailed Findings

### Section 1: [Topic]
- Finding 1
- Finding 2

### Section 2: [Topic]
- Finding 1
- Finding 2

---

## Recommendations
1. [Action item with reasoning]
2. [Action item with reasoning]
```

**Formatting Rules:**
1. Always use **bold** for names, numbers, and key terms
2. Always use bullet points for lists (never just paragraphs)
3. Always add blank lines between sections
4. Always use headers (##, ###) to organize
5. Use horizontal rules (---) between major sections
6. Use > blockquotes for critical information
7. Make it scannable - someone should understand it by skimming

❌ **NEVER do this:**
"Here are some questions: What is your pricing model for enterprise clients? Can you provide case studies? What is your implementation timeline? How do you handle data migration?"

✅ **ALWAYS do this:**

## Customer Questions

**1. Pricing Model**
- "What is your pricing model for enterprise clients?"
- Context: Asked by CFO during discovery call
- Frequency: High (appears in 15+ conversations)

**2. Case Studies**
- "Can you provide case studies from similar companies?"
- Context: Requested during evaluation phase
- Frequency: Medium (8 conversations)

**Remember:** Clean, professional formatting makes information actionable. Use markdown properly!`;

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
    
    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send progress indicator: Starting analysis
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: '🔍 Analyzing your query...'
          })}\n\n`));
          
          // Small delay for UX (let user see the progress)
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Send progress indicator: Searching transcripts
          if (transcriptContext) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              message: '🎙️ Searching meeting transcripts...'
            })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Send progress indicator: Searching CRM
          if (crmContext) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              message: '📇 Searching CRM data...'
            })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Send progress indicator: Searching Google Workspace
          if (googleContext) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              message: '📧 Searching emails and documents...'
            })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Send progress indicator: Context loaded
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: `📊 Loaded ${contexts.length} data sources • ${totalTokens.toLocaleString()} tokens`
          })}\n\n`));
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Send progress indicator: Generating response
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: '✨ Generating response...'
          })}\n\n`));
          
          // Stream the actual response from Claude
          const claudeStream = await ai.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: maxTokens,
            temperature: temperature,
            system: systemPrompt,
            messages,
          });
          
          let fullResponse = '';
          
          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullResponse += text;
              
              // Stream content to user
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'content',
                text: text
              })}\n\n`));
            }
          }
          
          // Save messages to database
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
                model: 'claude-sonnet-4-20250514',
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
                'claude-sonnet-4-20250514',
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

