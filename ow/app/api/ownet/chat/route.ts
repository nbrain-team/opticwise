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

    // 2. Query CRM data based on user's question
    const db = getPool();
    let crmContext = '';
    
    // Check if user is asking about deals, contacts, or pipeline
    const messageLower = message.toLowerCase();
    
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
    const systemPrompt = `You are OWnet Agent, an AI assistant for Opticwise CRM.

**Your Data Sources:**
${crmContext || ''}
${transcriptContext || ''}

**Your Communication Style:**
- Professional, concise, and well-organized
- Provide direct answers without showing your reasoning process
- Use clear headings and bullet points
- Focus on actionable insights
- Be conversational yet authoritative

**Response Format Guidelines:**
1. **DO NOT** explain how you found information or describe your search process
2. **DO NOT** show metadata like "Source 1, Source 2" or confidence scores in the main text
3. **DO** present information as if you naturally know it
4. **DO** organize complex answers with clear headings and sections
5. **DO** include specific details (names, dates, values) when relevant
6. **DO** provide recommendations and next steps when appropriate

**Example of GOOD response:**
"Based on recent activity, here are your top 3 deals to prioritize:

**1. Koelbel Metropoint Project** - $50,000
- Currently in Discovery stage
- High engagement from decision maker
- Next: Schedule technical review

**2. Mass Equities Vario** - $960,000  
- Advanced to proposal stage
- Strong momentum, last contact Nov 20
- Next: Follow up on pricing questions

**3. Cardone Acquisitions** - $250,000
- Active discussions about implementation
- Decision maker is engaged
- Next: Address data integration concerns"

**Example of BAD response:**
"Let me search the database... [Searching deals]... I found 20 deals in the pipeline. Based on my analysis using criteria such as stage, activity date, and value... [Source 1] shows... [Source 2] indicates..."

**Remember:** Respond like a knowledgeable assistant who naturally has the information, not like a system describing its process.`;

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

    await db.query(
      'INSERT INTO "AgentChatMessage" ("sessionId", role, content) VALUES ($1, $2, $3)',
      [sessionId, 'assistant', responseText]
    );

    // 6. Update session timestamp
    await db.query(
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

