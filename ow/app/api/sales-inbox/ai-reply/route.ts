import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { Pool } from 'pg';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * POST /api/sales-inbox/ai-reply
 * 
 * Generates an AI-powered reply to an email using:
 * - Latest OpenAI model (GPT-4o or o1)
 * - Context from call transcripts (Pinecone)
 * - Context from previous emails in thread
 * - Bill's writing style and tone
 */
export async function POST(request: NextRequest) {
  try {
    const { threadId } = await request.json();
    
    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId is required' },
        { status: 400 }
      );
    }
    
    // Get the email thread with all messages and contact info
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
        },
        person: {
          include: {
            organization: true,
            deals: {
              where: { status: 'open' },
              take: 5,
            },
          },
        },
        deal: {
          include: {
            stage: true,
          },
        },
      },
    });
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Get the last message (the one we're replying to)
    const lastMessage = thread.messages[thread.messages.length - 1];
    
    if (!lastMessage) {
      return NextResponse.json(
        { error: 'No messages in thread' },
        { status: 400 }
      );
    }
    
    // Build conversation history
    const conversationHistory = thread.messages.map(m => ({
      role: (m.direction === 'OUTGOING' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: `${m.sender}: ${m.body.replace(/<[^>]*>/g, '')}`,
    }));
    
    // Search for relevant context from call transcripts
    let transcriptContext = '';
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: lastMessage.body.replace(/<[^>]*>/g, ''),
        dimensions: 1024,
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');
      
      const searchResults = await index.query({
        topK: 3,
        vector: queryEmbedding,
        includeMetadata: true,
      });
      
      if (searchResults.matches && searchResults.matches.length > 0) {
        transcriptContext = searchResults.matches
          .map(m => m.metadata?.text_chunk || '')
          .join('\n\n');
      }
    } catch (error) {
      console.error('Error searching transcripts:', error);
    }
    
    // Build context about the contact
    let contactContext = '';
    if (thread.person) {
      contactContext = `
Contact: ${thread.person.firstName} ${thread.person.lastName}
${thread.person.organization ? `Company: ${thread.person.organization.name}` : ''}
${thread.person.title ? `Title: ${thread.person.title}` : ''}
${thread.person.deals && thread.person.deals.length > 0 ? `Open Deals: ${thread.person.deals.map(d => d.title).join(', ')}` : ''}
`.trim();
    }
    
    // Determine email subcategory based on thread context
    let styleSubcategory = 'follow_up'; // Default
    
    if (thread.messages.length === 1) {
      styleSubcategory = 'cold_outreach';
    } else if (thread.deal) {
      const dealStage = thread.deal.stage?.name?.toLowerCase() || '';
      if (dealStage.includes('proposal') || dealStage.includes('pricing')) {
        styleSubcategory = 'proposal';
      } else if (dealStage.includes('technical') || dealStage.includes('implementation')) {
        styleSubcategory = 'technical';
      }
    }
    
    // Fetch style examples from StyleGuide
    let styleExamples: string[] = [];
    try {
      const styleResult = await pool.query(
        `SELECT content, tone, author
         FROM "StyleGuide"
         WHERE category = 'email'
           AND subcategory = $1
           AND vectorized = true
         ORDER BY "usageCount" DESC, RANDOM()
         LIMIT 3`,
        [styleSubcategory]
      );
      
      styleExamples = styleResult.rows.map(row => 
        `[${row.author || 'Example'} - ${row.tone}]\n${row.content}`
      );
      
      // Track usage
      if (styleResult.rows.length > 0) {
        const ids = styleResult.rows.map((r: { id?: number }) => r.id).filter(Boolean);
        if (ids.length > 0) {
          await pool.query(
            `UPDATE "StyleGuide" 
             SET "usageCount" = "usageCount" + 1
             WHERE id = ANY($1)`,
            [ids]
          );
        }
      }
    } catch (error) {
      console.error('Error fetching style examples:', error);
    }
    
    // Generate AI reply using latest OpenAI model
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest GPT-4o model (or use 'o1-preview' if available)
      messages: [
        {
          role: 'system',
          content: `You are Bill from OpticWise, responding to a client email.

${styleExamples.length > 0 ? `
**BILL'S ACTUAL EMAIL EXAMPLES - MATCH THIS STYLE:**

${styleExamples.join('\n\n---\n\n')}

**INSTRUCTIONS:**
1. Study the examples above carefully
2. Match Bill's tone, structure, and language patterns
3. Use similar sentence lengths and paragraph breaks
4. Adopt the same level of directness and warmth
5. Mirror the opening and closing styles
6. Use similar vocabulary and phrasing
7. Avoid robotic phrases like "Based on my knowledge" or "I hope this email finds you well"
8. Be direct, confident, and strategic like the examples
` : `
BILL'S WRITING STYLE & TONE:
- Professional but warm and personable
- Direct and to-the-point, no fluff
- Uses short paragraphs for readability
- Confident and knowledgeable about digital infrastructure and business strategy
- Focuses on ownership, control, and long-term value
- Often references specific examples
- Ends with clear next steps or calls to action
- Signs emails simply as "Bill"
`}

CONTEXT ABOUT THIS CONTACT:
${contactContext}

${transcriptContext ? `RELEVANT INFORMATION FROM PAST CALLS:\n${transcriptContext}` : ''}

CRITICAL RULES:
1. Do NOT include a subject line
2. Do NOT include "Dear [Name]" - start directly with content
3. End with just "Bill" (no last name, no signature block)
4. Keep it concise but thorough
5. Include a clear next step
6. Match the style examples if provided`,
        },
        ...conversationHistory,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const aiReply = completion.choices[0]?.message?.content || '';
    
    return NextResponse.json({
      success: true,
      reply: aiReply,
      model: 'gpt-4o',
    });
    
  } catch (error) {
    console.error('Error generating AI reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI reply', details: String(error) },
      { status: 500 }
    );
  }
}

