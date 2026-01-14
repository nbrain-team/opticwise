/**
 * OWnet Agent - Chat API
 * Simple, working implementation for Next.js serverless
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { getSession } from '@/lib/session';

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

    // 1. Search transcripts using Pinecone with OpenAI embeddings
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
          const db = getPool();
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
        }
        
        // Search Calendar if needed
        if (needsCalendar) {
          const db = getPool();
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
          const db = getPool();
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
    const db = getPool();
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

    // 3. Get conversation history
    const historyResult = await db.query<{ role: string; content: string }>(
      'SELECT role, content FROM "AgentChatMessage" WHERE "sessionId" = $1 ORDER BY "createdAt" DESC LIMIT 10',
      [sessionId]
    );
    const history = historyResult.rows.reverse();

    // 4. Build context-aware prompt
    const systemPrompt = `You are OWnet, a knowledgeable sales assistant who has deep familiarity with the Opticwise business. You speak naturally and conversationally, like a trusted colleague who's been working alongside the team for years.

**Available Information:**
${crmContext || ''}
${transcriptContext || ''}
${googleContext || ''}

**Your Communication Style:**
- Talk like a real person, not an AI or robot
- Skip formal phrases like "Based on your recent activity" or "Here are the items you should consider"
- Just dive right into the information naturally
- Use contractions (you've, there's, it's) and casual language
- Be direct and helpful without being overly formal
- Think of yourself as a helpful coworker, not a system

**How to Sound Natural:**

❌ AVOID these robotic phrases:
- "Based on your recent activity..."
- "Here are the priority items you should consider..."
- "I have analyzed the data and found..."
- "According to the information available..."
- "Let me provide you with..."
- "I would recommend that you..."

✅ USE natural language instead:
- Just start with the info: "You've got 3 deals that need attention..."
- Be casual: "Looks like the Koelbel deal is heating up..."
- Speak directly: "The Mass Equities proposal is sitting at $960K - they last reached out Nov 20"
- Use natural transitions: "Also..." "By the way..." "Oh, and..."
- Be conversational: "You might want to..." instead of "I recommend..."

**Example of NATURAL response:**
"You've got 3 big deals that need attention:

**Koelbel Metropoint** - $50K
They're in Discovery stage and the decision maker's pretty engaged. Probably time to schedule that technical review.

**Mass Equities Vario** - $960K
This one's moved to proposal stage. Good momentum - last contact was Nov 20. Might want to follow up on those pricing questions they had.

**Cardone Acquisitions** - $250K
Active discussions about implementation. They're engaged, but there are some data integration concerns to address."

**Example of ROBOTIC response (AVOID THIS):**
"Based on recent activity, here are the priority deals you should consider:

I have analyzed your pipeline and identified the following opportunities based on stage, activity date, and value metrics..."

**Key Rules:**
1. Never mention that you're searching, analyzing, or processing data
2. Don't use phrases like "Based on" or "According to"
3. Present information as if you just naturally know it
4. Use casual, conversational language
5. Be helpful and direct without being formal
6. Skip the preamble - just give the information

**Remember:** You're a colleague who happens to know everything about the business, not an AI assistant reporting findings. Talk naturally!`;

    // 4. Call Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const ai = getAnthropic();
    const response = await ai.messages.create({
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
    await db.query(
      'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
      [sessionId, 'user', message]
    );

    const assistantMsgResult = await db.query(
      'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3) RETURNING id',
      [sessionId, 'assistant', responseText]
    );
    
    const assistantMessageId = assistantMsgResult.rows[0]?.id;

    // 6. Update session timestamp and potentially generate title
    // Check if this is the first message in the session (title generation)
    const messageCountResult = await db.query(
      'SELECT COUNT(*) as count, title FROM "AgentChatSession" WHERE id = $1 GROUP BY id, title',
      [sessionId]
    );
    
    const sessionData = messageCountResult.rows[0];
    const isFirstResponse = sessionData?.title === 'New Chat';
    
    if (isFirstResponse) {
      // Generate a descriptive title from the conversation
      try {
        const titlePrompt = `Based on this conversation, generate a short, descriptive title (max 6 words) that captures the main topic. Return ONLY the title, nothing else.

User question: ${message}

AI response summary: ${responseText.slice(0, 300)}`;

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

    // Determine sources used
    const sources = [];
    if (transcriptContext) sources.push('transcripts');
    if (googleContext) {
      if (needsEmail) sources.push('gmail');
      if (needsCalendar) sources.push('calendar');
      if (needsDrive) sources.push('drive');
    }
    if (crmContext) sources.push('crm');
    
    return NextResponse.json({
      success: true,
      response: responseText,
      messageId: assistantMessageId,
      sources,
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

