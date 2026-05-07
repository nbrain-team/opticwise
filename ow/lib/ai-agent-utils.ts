/**
 * Advanced AI Agent Utilities
 * Enhanced RAG, query expansion, semantic search, and intelligent context management
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

// ============================================
// TOKEN ESTIMATION
// ============================================

/**
 * Estimate token count for text (rough approximation)
 * More accurate than char count / 4
 */
export function estimateTokens(text: string): number {
  // Claude/GPT tokenization approximation
  // ~1.3 tokens per word for English
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

// ============================================
// QUERY CLASSIFICATION
// ============================================

export interface QueryIntent {
  type: 'quick_answer' | 'research' | 'deep_analysis' | 'creative' | 'action';
  confidence: number;
  keywords: string[];
  requiresDeepSearch: boolean;
  suggestedMaxTokens: number;
  suggestedTemperature: number;
}

export function classifyQuery(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase();
  
  // DEEP ANALYSIS - Comprehensive reports requiring extensive detail
  const deepAnalysisKeywords = [
    'deep dive', 'deep analysis', 'detailed analysis', 'comprehensive',
    'in-depth', 'thorough', 'complete report', 'full analysis',
    'breakdown', 'detailed report', 'activity report', 'full breakdown',
    'analyze everything', 'complete overview', 'detailed overview',
    'give me everything', 'walk me through', 'explain in detail',
    'comprehensive review', 'analyze all', 'full details', 'everything you know',
    'all the data', 'complete analysis', 'exhaustive', 'extensive analysis',
    'all information', 'total breakdown', 'full picture', 'entire history',
    'complete history', 'all activity', 'every detail', 'full report'
  ];
  
  // RESEARCH - Finding and aggregating information
  const researchKeywords = [
    'research', 'find all', 'show me everything', 'search for',
    'tell me about', 'what do we know', 'history of', 'background on',
    'all information', 'everything about', 'full context',
    'what\'s the story', 'catch me up', 'fill me in'
  ];
  
  // QUICK ANSWER - Simple factual queries (but could need detail)
  const quickKeywords = [
    'what is', 'who is', 'when', 'where', 'how many',
    'count', 'list', 'show me', 'find', 'which', 'status'
  ];
  
  // ACTION - Commands to do something
  const actionKeywords = [
    'create', 'send', 'schedule', 'update', 'delete',
    'add', 'remove', 'modify', 'set', 'change'
  ];
  
  // CREATIVE - Content generation
  const creativeKeywords = [
    'write', 'draft', 'compose', 'generate', 'suggest',
    'brainstorm', 'come up with', 'ideas for', 'help me write'
  ];
  
  // CONTEXT CLUES - Additional signals that indicate complexity
  const needsDetailSignals = [
    'more', 'better', 'realistic', 'context', 'examples',
    'detailed', 'specific', 'actual', 'real', 'good to use',
    'multiple', 'several', 'bunch of', 'variety',
    'with context', 'with details', 'with examples'
  ];
  
  const needsMultipleItems = /\b(\d+|multiple|several|bunch|variety|range)\b/.test(lowerQuery);
  const hasContextRequest = needsDetailSignals.some(signal => lowerQuery.includes(signal));
  const isFollowUp = /\b(no|not|more|better|different|instead|actually)\b/.test(lowerQuery) && query.length < 150;

  // VISUALIZATION INTENT - takes precedence over deep_analysis when the user
  // is asking for a graphic / diagram / chart / dashboard / mockup / artifact.
  // These require high token budgets so the rendered HTML/CSS/SVG isn't truncated.
  const visualizationKeywords = [
    'visual', 'visualize', 'visualization', 'graphic', 'diagram', 'chart',
    'dashboard', 'infographic', 'flow chart', 'flowchart', 'mockup',
    'mock-up', 'mockups', 'mock up', 'render', 'wireframe', 'illustration',
    'org chart', 'org-chart', 'process map', 'sankey', 'gantt', 'timeline graphic',
    'visual graphic', 'visual representation', 'visual walkthrough',
    'show me a chart', 'show me a graph', 'create a graphic', 'create a chart',
    'create a diagram', 'create a dashboard', 'build a chart', 'build a dashboard',
    'design a', 'render a', 'plot ', 'pie chart', 'bar chart', 'line chart',
    'svg', 'html visual', 'interactive', 'artifact'
  ];
  const isVisualizationRequest = visualizationKeywords.some(kw => lowerQuery.includes(kw));
  if (isVisualizationRequest) {
    return {
      type: 'deep_analysis',
      confidence: 0.95,
      keywords: ['visualization', ...visualizationKeywords.filter(kw => lowerQuery.includes(kw))],
      requiresDeepSearch: true,
      // Visualizations frequently need 30-60k tokens of HTML/CSS for multi-step
      // diagrams, dashboards, and infographics. Give them a generous budget.
      suggestedMaxTokens: 64000,
      suggestedTemperature: 0.7
    };
  }

  // SPECIAL COMMANDS - Override with maximum tokens
  const maxTokensCommand = /\b(max[_\s]?tokens?|max|maximum|exhaustive|ultra[-\s]?detailed|analyze[_\s]all|all[_\s]of[_\s]them|provide[_\s]a?[_\s]deep|deep[_\s]analysis)\b/i.test(lowerQuery);

  // If user explicitly requests maximum detail — push toward Opus 4.7's 128k ceiling
  if (maxTokensCommand) {
    return {
      type: 'deep_analysis',
      confidence: 1.0,
      keywords: ['max_tokens', 'maximum_detail', 'deep_analysis'],
      requiresDeepSearch: true,
      suggestedMaxTokens: 96000, // Opus 4.7 supports 128k — leave a bit of headroom
      suggestedTemperature: 0.7
    };
  }

  // Check for deep analysis
  if (deepAnalysisKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      type: 'deep_analysis',
      confidence: 0.95,
      keywords: deepAnalysisKeywords.filter(kw => lowerQuery.includes(kw)),
      requiresDeepSearch: true,
      suggestedMaxTokens: 64000,
      suggestedTemperature: 0.7
    };
  }

  // Check for research
  if (researchKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      type: 'research',
      confidence: 0.85,
      keywords: researchKeywords.filter(kw => lowerQuery.includes(kw)),
      requiresDeepSearch: true,
      suggestedMaxTokens: 24000,
      suggestedTemperature: 0.6
    };
  }

  // Upgrade quick_answer to research if it needs detail/multiple items
  if (quickKeywords.some(kw => lowerQuery.includes(kw))) {
    if ((needsMultipleItems || hasContextRequest) && query.length > 50) {
      return {
        type: 'research',
        confidence: 0.8,
        keywords: [...quickKeywords.filter(kw => lowerQuery.includes(kw)), ...needsDetailSignals.filter(s => lowerQuery.includes(s))],
        requiresDeepSearch: true,
        suggestedMaxTokens: 24000,
        suggestedTemperature: 0.6
      };
    }
  }

  // Check for action
  if (actionKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      type: 'action',
      confidence: 0.85,
      keywords: actionKeywords.filter(kw => lowerQuery.includes(kw)),
      requiresDeepSearch: false,
      suggestedMaxTokens: 8000,
      suggestedTemperature: 0.4
    };
  }

  // Check for creative
  if (creativeKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      type: 'creative',
      confidence: 0.75,
      keywords: creativeKeywords.filter(kw => lowerQuery.includes(kw)),
      requiresDeepSearch: false,
      suggestedMaxTokens: 16000,
      suggestedTemperature: 0.8
    };
  }

  // Follow-up questions
  if (isFollowUp) {
    return {
      type: 'quick_answer',
      confidence: 0.7,
      keywords: ['follow-up'],
      requiresDeepSearch: false,
      suggestedMaxTokens: 12000,
      suggestedTemperature: 0.7
    };
  }

  // Default to quick answer
  return {
    type: 'quick_answer',
    confidence: 0.6,
    keywords: quickKeywords.filter(kw => lowerQuery.includes(kw)),
    requiresDeepSearch: false,
    suggestedMaxTokens: 8000,
    suggestedTemperature: 0.7
  };
}

// ============================================
// QUERY EXPANSION
// ============================================

export interface ExpandedQuery {
  original: string;
  variations: string[];
  keywords: string[];
  entities: string[];
}

/**
 * Expand a query into multiple variations for better search coverage
 */
export async function expandQuery(
  query: string,
  openai: OpenAI
): Promise<ExpandedQuery> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Given this search query: "${query}"

Generate 3-5 alternative phrasings, key entities, and keywords.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "variations": ["variation 1", "variation 2"],
  "entities": ["entity1", "entity2"],
  "keywords": ["keyword1", "keyword2"]
}`
      }],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });
    
    let content = response.choices[0]?.message?.content || '{}';
    
    // Strip markdown code blocks if GPT added them
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(content);
    
    return {
      original: query,
      variations: parsed.variations || [query],
      keywords: parsed.keywords || [],
      entities: parsed.entities || []
    };
  } catch (error) {
    console.error('Query expansion error:', error);
    return {
      original: query,
      variations: [query],
      keywords: [],
      entities: []
    };
  }
}

// ============================================
// SMART CONTEXT LOADING
// ============================================

export interface ContextSource {
  type: 'transcript' | 'email' | 'calendar' | 'drive' | 'crm' | 'chat_history' | 'knowledge_base';
  content: string;
  metadata: Record<string, unknown>;
  relevanceScore?: number;
  tokenCount: number;
  sources?: SourceCitation[]; // Detailed source citations
}

export interface SourceCitation {
  id: string;
  type: 'transcript' | 'email' | 'calendar' | 'drive' | 'crm' | 'chat_history' | 'knowledge_base';
  title: string;
  date?: string;
  author?: string;
  confidence: number; // 0-1 similarity score
  preview: string; // First 150 chars
  metadata?: Record<string, unknown>;
}

export interface ContextBudget {
  maxTokens: number;
  systemPromptTokens: number;
  queryTokens: number;
  historyTokens: number;
  availableForContext: number;
}

/**
 * Load context intelligently within token budget
 */
export async function loadContextWithinBudget(
  query: string,
  db: Pool,
  openai: OpenAI,
  pinecone: Pinecone,
  sessionId: string,
  maxContextTokens: number = 180000,
  userId?: string
): Promise<{
  contexts: ContextSource[];
  totalTokens: number;
  budget: ContextBudget;
}> {
  const contexts: ContextSource[] = [];
  let usedTokens = 0;
  
  // Estimate base tokens
  const queryTokens = estimateTokens(query);
  const systemPromptTokens = 5000; // Rough estimate
  const reservedForOutput = 16384; // Reserve for response
  
  const availableForContext = maxContextTokens - systemPromptTokens - queryTokens - reservedForOutput;
  
  const budget: ContextBudget = {
    maxTokens: maxContextTokens,
    systemPromptTokens,
    queryTokens,
    historyTokens: 0,
    availableForContext
  };
  
  // Priority 1: Chat history (last 20 messages or up to 50K tokens)
  try {
    const historyResult = await db.query(
      `SELECT role, content FROM "AgentChatMessage" 
       WHERE "sessionId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT 20`,
      [sessionId]
    );
    
    const history = historyResult.rows.reverse();
    let historyTokens = 0;
    const historyMessages: string[] = [];
    
    for (const msg of history) {
      const msgTokens = estimateTokens(msg.content);
      if (historyTokens + msgTokens > 50000) break;
      historyMessages.push(`<<<${msg.role}>>>${msg.content}`);
      historyTokens += msgTokens;
    }
    
    if (historyMessages.length > 0) {
      contexts.push({
        type: 'chat_history',
        content: historyMessages.join('\n\n<<<END_MESSAGE>>>\n\n'),
        metadata: { 
          messageCount: historyMessages.length,
          messages: history.slice(0, historyMessages.length).map(m => ({ role: m.role, content: m.content }))
        },
        tokenCount: historyTokens
      });
      usedTokens += historyTokens;
      budget.historyTokens = historyTokens;
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  
  // Generate embedding for search
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: query,
    dimensions: 1024
  });
  const queryEmbedding = embedding.data[0].embedding;
  const vectorString = `[${queryEmbedding.join(',')}]`;
  
  // Priority 2: Relevant transcripts (up to 60K tokens) - CHUNKED SEARCH (Newbury Style)
  try {
    // Search chunks first for precision
    const chunkResult = await db.query(
      `SELECT 
        c.id as chunk_id,
        c."chunkText",
        c."chunkIndex",
        c."wordCount",
        t.id as transcript_id,
        t.title,
        t."startTime",
        t.summary,
        1 - (c.embedding <=> $1::vector) as similarity
       FROM "CallTranscriptChunk" c
       JOIN "CallTranscript" t ON c."transcriptId" = t.id
       WHERE c.embedding IS NOT NULL
       ORDER BY c.embedding <=> $1::vector
       LIMIT 20`,
      [vectorString]
    );
    
    let transcriptTokens = 0;
    const transcriptChunks: string[] = [];
    const transcriptCitations: SourceCitation[] = [];
    
    for (const chunk of chunkResult.rows) {
      if (transcriptTokens > 60000) break;
      
      const chunkTokens = estimateTokens(chunk.chunkText);
      if (usedTokens + transcriptTokens + chunkTokens > availableForContext) break;
      
      transcriptChunks.push(`[${chunk.title} - ${new Date(chunk.startTime).toLocaleDateString()}]\n${chunk.chunkText}`);
      transcriptTokens += chunkTokens;
      
      // Add citation
      transcriptCitations.push({
        id: chunk.transcript_id || chunk.chunk_id,
        type: 'transcript',
        title: chunk.title,
        date: new Date(chunk.startTime).toLocaleDateString(),
        confidence: parseFloat(chunk.similarity),
        preview: chunk.chunkText.substring(0, 150).trim() + '...',
        metadata: {
          chunkIndex: chunk.chunkIndex,
          wordCount: chunk.wordCount
        }
      });
    }
    
    // If no chunks found, fallback to full transcripts (backward compatibility)
    if (transcriptChunks.length === 0) {
      const fullTranscriptResult = await db.query(
        `SELECT id, title, transcript, summary, "startTime",
         1 - (embedding <=> $1::vector) as similarity
         FROM "CallTranscript"
         WHERE vectorized = true AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT 5`,
        [vectorString]
      );
      
      for (const transcript of fullTranscriptResult.rows) {
        if (transcriptTokens > 60000) break;
        const text = transcript.summary || transcript.transcript.substring(0, 2000);
        const tokens = estimateTokens(text);
        if (usedTokens + transcriptTokens + tokens > availableForContext) break;
        transcriptChunks.push(`[${transcript.title} - ${new Date(transcript.startTime).toLocaleDateString()}]\n${text}`);
        transcriptTokens += tokens;
        
        // Add citation
        transcriptCitations.push({
          id: transcript.id,
          type: 'transcript',
          title: transcript.title,
          date: new Date(transcript.startTime).toLocaleDateString(),
          confidence: parseFloat(transcript.similarity),
          preview: text.substring(0, 150).trim() + '...'
        });
      }
    }
    
    if (transcriptChunks.length > 0) {
      contexts.push({
        type: 'transcript',
        content: transcriptChunks.join('\n\n---\n\n'),
        metadata: { chunkCount: transcriptChunks.length },
        tokenCount: transcriptTokens,
        sources: transcriptCitations
      });
      usedTokens += transcriptTokens;
    }
  } catch (error) {
    console.error('Error loading transcripts:', error);
  }
  
  // Priority 3: Emails (up to 40K tokens)
  // Search both GmailMessage AND EmailMessage (Sales Inbox)
  try {
    let emailTokens = 0;
    const emailContents: string[] = [];
    const emailCitations: SourceCitation[] = [];
    
    // First, search Sales Inbox EmailMessage (customer conversations)
    try {
      // Check if EmailMessage has the embedding column before attempting vector search
      const emColCheck = await db.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'EmailMessage' AND column_name = 'embedding'
           AND udt_name = 'vector'
         LIMIT 1`
      );
      const hasVectorCol = emColCheck.rows.length > 0;
      
      let salesInboxResult;
      if (hasVectorCol) {
        const salesInboxQuery = userId
          ? `SELECT 
              em.id, em.body, em.sender, em."sentAt",
              et.subject, p.name as person_name, o.name as org_name,
              1 - (em.embedding <=> $1::vector) as similarity
             FROM "EmailMessage" em
             JOIN "EmailThread" et ON em."threadId" = et.id
             LEFT JOIN "Person" p ON et."personId" = p.id
             LEFT JOIN "Organization" o ON p."organizationId" = o.id
             WHERE em.vectorized = true AND em.embedding IS NOT NULL
               AND et."syncUserId" = $2
             ORDER BY em.embedding <=> $1::vector
             LIMIT 15`
          : `SELECT 
              em.id, em.body, em.sender, em."sentAt",
              et.subject, p.name as person_name, o.name as org_name,
              1 - (em.embedding <=> $1::vector) as similarity
             FROM "EmailMessage" em
             JOIN "EmailThread" et ON em."threadId" = et.id
             LEFT JOIN "Person" p ON et."personId" = p.id
             LEFT JOIN "Organization" o ON p."organizationId" = o.id
             WHERE em.vectorized = true AND em.embedding IS NOT NULL
             ORDER BY em.embedding <=> $1::vector
             LIMIT 15`;
        const salesInboxParams = userId ? [vectorString, userId] : [vectorString];
        salesInboxResult = await db.query(salesInboxQuery, salesInboxParams);
      } else {
        // Fallback: keyword search when vector column doesn't exist
        const keywords = query.toLowerCase().split(/\s+/).slice(0, 5).join('|');
        const fallbackQuery = userId
          ? `SELECT em.id, em.body, em.sender, em."sentAt",
                    et.subject, p.name as person_name, o.name as org_name,
                    0.5 as similarity
             FROM "EmailMessage" em
             JOIN "EmailThread" et ON em."threadId" = et.id
             LEFT JOIN "Person" p ON et."personId" = p.id
             LEFT JOIN "Organization" o ON p."organizationId" = o.id
             WHERE (em.body ILIKE $1 OR et.subject ILIKE $1)
               AND et."syncUserId" = $2
             ORDER BY em."sentAt" DESC
             LIMIT 15`
          : `SELECT em.id, em.body, em.sender, em."sentAt",
                    et.subject, p.name as person_name, o.name as org_name,
                    0.5 as similarity
             FROM "EmailMessage" em
             JOIN "EmailThread" et ON em."threadId" = et.id
             LEFT JOIN "Person" p ON et."personId" = p.id
             LEFT JOIN "Organization" o ON p."organizationId" = o.id
             WHERE (em.body ILIKE $1 OR et.subject ILIKE $1)
             ORDER BY em."sentAt" DESC
             LIMIT 15`;
        const fallbackParams = userId ? [`%${keywords}%`, userId] : [`%${keywords}%`];
        salesInboxResult = await db.query(fallbackQuery, fallbackParams);
      }
      
      for (const email of salesInboxResult.rows) {
        const emailBody = email.body.slice(0, 3000);
        const emailText = `[Sales Inbox]\nSubject: ${email.subject}\nFrom: ${email.sender}\nContact: ${email.person_name || 'Unknown'}\nCompany: ${email.org_name || 'N/A'}\nDate: ${new Date(email.sentAt).toLocaleDateString()}\nContent: ${emailBody}`;
        const tokens = estimateTokens(emailText);
        
        if (emailTokens + tokens > 40000 || usedTokens + emailTokens + tokens > availableForContext) break;
        
        emailContents.push(emailText);
        emailTokens += tokens;
        
        // Add citation
        emailCitations.push({
          id: email.id,
          type: 'email',
          title: email.subject,
          date: new Date(email.sentAt).toLocaleDateString(),
          author: email.sender,
          confidence: parseFloat(email.similarity),
          preview: emailBody.substring(0, 150).trim() + '...',
          metadata: {
            contact: email.person_name,
            company: email.org_name
          }
        });
      }
    } catch (salesError) {
      console.log('[Context] Sales inbox search error:', salesError);
    }
    
    // Then add GmailMessage emails if we have token budget left
    // PRIVACY: Only return emails belonging to the current user
    if (emailTokens < 30000 && userId) {
      // Check if GmailMessage.embedding is vector type (not text)
      const gmColCheck = await db.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'GmailMessage' AND column_name = 'embedding'
           AND udt_name = 'vector'
         LIMIT 1`
      );
      const gmHasVector = gmColCheck.rows.length > 0;

      const gmailResult = gmHasVector
        ? await db.query(
            `SELECT id, subject, "from", "to", snippet, body, date,
             1 - (embedding <=> $1::vector) as similarity
             FROM "GmailMessage"
             WHERE vectorized = true AND embedding IS NOT NULL
               AND "syncUserId" = $2
               AND "from" NOT ILIKE '%noreply%'
               AND "from" NOT ILIKE '%no-reply%'
               AND "from" NOT ILIKE '%@ingram%'
               AND "from" NOT ILIKE '%@fathom%'
               AND "from" NOT ILIKE '%invoic%'
               AND "from" NOT ILIKE '%receipt%'
               AND subject NOT ILIKE '%invoice%'
               AND subject NOT ILIKE '%receipt%'
               AND subject NOT ILIKE '%build failed%'
             ORDER BY embedding <=> $1::vector
             LIMIT 10`,
            [vectorString, userId]
          )
        : await db.query(
            `SELECT id, subject, "from", "to", snippet, body, date,
             0.5 as similarity
             FROM "GmailMessage"
             WHERE "syncUserId" = $1
               AND "from" NOT ILIKE '%noreply%'
               AND "from" NOT ILIKE '%no-reply%'
               AND subject NOT ILIKE '%invoice%'
               AND subject NOT ILIKE '%receipt%'
             ORDER BY date DESC
             LIMIT 10`,
            [userId]
          );
      
      for (const email of gmailResult.rows) {
        const emailBody = email.body ? email.body.slice(0, 3000) : email.snippet || '';
        const emailText = `[Gmail]\nSubject: ${email.subject}\nFrom: ${email.from}\nDate: ${new Date(email.date).toLocaleDateString()}\nContent: ${emailBody}`;
        const tokens = estimateTokens(emailText);
        
        if (emailTokens + tokens > 40000 || usedTokens + emailTokens + tokens > availableForContext) break;
        
        emailContents.push(emailText);
        emailTokens += tokens;
        
        // Add citation
        emailCitations.push({
          id: email.id,
          type: 'email',
          title: email.subject,
          date: new Date(email.date).toLocaleDateString(),
          author: email.from,
          confidence: parseFloat(email.similarity),
          preview: emailBody.substring(0, 150).trim() + '...'
        });
      }
    }
    
    if (emailContents.length > 0) {
      contexts.push({
        type: 'email',
        content: emailContents.join('\n\n---\n\n'),
        metadata: { emailCount: emailContents.length },
        tokenCount: emailTokens,
        sources: emailCitations
      });
      usedTokens += emailTokens;
    }
  } catch (error) {
    console.error('Error loading emails:', error);
  }
  
  // Priority 4: CRM data (up to 20K tokens)
  try {
    const messageLower = query.toLowerCase();
    if (messageLower.includes('deal') || messageLower.includes('pipeline')) {
      const dealsResult = await db.query(
        `SELECT d.id, d.title, d.value, d.currency, d."updatedAt",
                s.name as stage_name, 
                o.name as org_name, p.name as person_name
         FROM "Deal" d
         LEFT JOIN "Stage" s ON d."stageId" = s.id
         LEFT JOIN "Organization" o ON d."organizationId" = o.id
         LEFT JOIN "Person" p ON d."personId" = p.id
         WHERE d.status = 'open'
         ORDER BY d.value DESC
         LIMIT 20`
      );
      
      const crmText = dealsResult.rows.map(d => 
        `Deal: ${d.title} - ${d.currency} ${Number(d.value).toLocaleString()} (${d.stage_name}) - ${d.org_name || 'No org'}`
      ).join('\n');
      
      const crmTokens = estimateTokens(crmText);
      const crmCitations: SourceCitation[] = dealsResult.rows.map(d => ({
        id: d.id,
        type: 'crm',
        title: d.title,
        date: new Date(d.updatedAt).toLocaleDateString(),
        confidence: 1.0, // CRM data is exact match, not semantic
        preview: `${d.currency} ${Number(d.value).toLocaleString()} - ${d.stage_name}`,
        metadata: {
          value: d.value,
          currency: d.currency,
          stage: d.stage_name,
          organization: d.org_name,
          contact: d.person_name
        }
      }));
      
      if (usedTokens + crmTokens <= availableForContext) {
        contexts.push({
          type: 'crm',
          content: crmText,
          metadata: { dealCount: dealsResult.rows.length },
          tokenCount: crmTokens,
          sources: crmCitations
        });
        usedTokens += crmTokens;
      }
    }
  } catch (error) {
    console.error('Error loading CRM data:', error);
  }

  // Priority 5: Knowledge Base documents (up to 30K tokens)
  try {
    if (vectorString) {
      const kbResult = await db.query(
        `SELECT kc."chunkText", kd.name as doc_name, kd.category, kd.comment,
                1 - (kc.embedding <=> $1::vector) as similarity
         FROM "KnowledgeChunk" kc
         JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
         WHERE kc.embedding IS NOT NULL
         ORDER BY kc.embedding <=> $1::vector
         LIMIT 10`,
        [vectorString]
      );

      let kbTokens = 0;
      const kbContents: string[] = [];
      const kbCitations: SourceCitation[] = [];

      for (const chunk of kbResult.rows) {
        const text = `[Knowledge Base - ${chunk.doc_name}] (${chunk.category || 'Uncategorized'})\n${chunk.comment ? `Note: ${chunk.comment}\n` : ''}${chunk.chunkText.slice(0, 3000)}`;
        const tokens = estimateTokens(text);
        if (kbTokens + tokens > 30000 || usedTokens + kbTokens + tokens > availableForContext) break;
        kbContents.push(text);
        kbCitations.push({
          id: chunk.doc_name,
          type: 'knowledge_base',
          title: chunk.doc_name,
          date: '',
          confidence: chunk.similarity,
          preview: chunk.chunkText.slice(0, 150),
          metadata: { category: chunk.category }
        });
        kbTokens += tokens;
      }

      if (kbContents.length > 0) {
        contexts.push({
          type: 'knowledge_base',
          content: kbContents.join('\n\n---\n\n'),
          metadata: { chunkCount: kbContents.length },
          tokenCount: kbTokens,
          sources: kbCitations,
        });
        usedTokens += kbTokens;
      }
    }
  } catch (error) {
    console.error('Error loading knowledge base:', error);
  }

  return {
    contexts,
    totalTokens: usedTokens,
    budget
  };
}

// ============================================
// SEMANTIC SEARCH ACROSS CHAT HISTORY
// ============================================

export async function searchChatHistory(
  query: string,
  sessionId: string,
  db: Pool,
  openai: OpenAI,
  topK: number = 5
): Promise<Array<{ content: string; role: string; createdAt: Date; relevance: number }>> {
  try {
    // Note: Full semantic search over chat history requires embedding column
    // For now, using text search as placeholder
    
    // Search past messages in this session
    // Note: This requires adding embedding column to AgentChatMessage
    // For now, we'll do simple text search
    const result = await db.query(
      `SELECT content, role, "createdAt"
       FROM "AgentChatMessage"
       WHERE "sessionId" = $1
         AND role = 'assistant'
         AND content ILIKE $2
       ORDER BY "createdAt" DESC
       LIMIT $3`,
      [sessionId, `%${query}%`, topK]
    );
    
    return result.rows.map(row => ({
      content: row.content,
      role: row.role,
      createdAt: row.createdAt,
      relevance: 0.5 // Placeholder since we're not doing true semantic search yet
    }));
  } catch (error) {
    console.error('Error searching chat history:', error);
    return [];
  }
}

// ============================================
// RE-RANKING (for enhanced RAG)
// ============================================

export interface RankedResult {
  content: string;
  originalScore: number;
  rerankedScore: number;
  metadata: Record<string, unknown>;
}

/**
 * Re-rank search results using cross-attention
 * This is a placeholder - in production you'd use a dedicated re-ranker
 */
export async function rerankResults(
  query: string,
  results: Array<{ content: string; score: number; metadata: Record<string, unknown> }>,
  openai: OpenAI,
  topK: number = 10
): Promise<RankedResult[]> {
  // Simple re-ranking based on keyword overlap + original score
  // In production, use Cohere re-rank API or similar
  
  const queryWords = new Set(query.toLowerCase().split(/\s+/));
  
  const ranked = results.map(result => {
    const contentWords = new Set(result.content.toLowerCase().split(/\s+/));
    const overlap = Array.from(queryWords).filter(w => contentWords.has(w)).length;
    const overlapScore = overlap / queryWords.size;
    
    // Combine original score with overlap score
    const rerankedScore = (result.score * 0.7) + (overlapScore * 0.3);
    
    return {
      content: result.content,
      originalScore: result.score,
      rerankedScore,
      metadata: result.metadata
    };
  });
  
  // Sort by reranked score
  ranked.sort((a, b) => b.rerankedScore - a.rerankedScore);
  
  return ranked.slice(0, topK);
}

// ============================================
// STYLE MATCHING
// ============================================

export async function getStyleExamples(
  category: string,
  subcategory: string | null,
  db: Pool,
  openai: OpenAI,
  topK: number = 5
): Promise<string[]> {
  try {
    const result = await db.query(
      `SELECT content, tone, author
       FROM "StyleGuide"
       WHERE category = $1
         AND ($2::text IS NULL OR subcategory = $2)
         AND vectorized = true
       ORDER BY "usageCount" DESC, RANDOM()
       LIMIT $3`,
      [category, subcategory, topK]
    );
    
    return result.rows.map(row => 
      `[${row.author || 'Example'} - ${row.tone}]\n${row.content}`
    );
  } catch (error) {
    console.error('Error fetching style examples:', error);
    return [];
  }
}

// ============================================
// VOICE EXEMPLAR RETRIEVAL (May 2026 canon)
// ============================================

export interface VoiceExemplar {
  subcategory: 'blog' | 'linkedin_article' | 'linkedin_short' | string;
  author: string; // 'Bill' | 'Drew' | 'Mixed'
  content: string;
  context: string | null;
  similarity: number;
  metadata: Record<string, unknown> | null;
}

/**
 * Retrieve top-K voice exemplars semantically similar to `query`,
 * optionally filtered by subcategory (blog / linkedin_article /
 * linkedin_short) and author (Bill / Drew). Returns published
 * gold-standard pieces ingested by `scripts/ingest-voice-exemplars.ts`
 * so they can be injected as few-shot examples in the system prompt.
 *
 * Uses pgvector cosine distance on the StyleGuide.embedding column.
 */
export async function getVoiceExemplars(
  query: string,
  db: Pool,
  openai: OpenAI,
  options: {
    topK?: number;
    subcategory?: 'blog' | 'linkedin_article' | 'linkedin_short';
    author?: 'Bill' | 'Drew';
    minSimilarity?: number;
  } = {}
): Promise<VoiceExemplar[]> {
  const { topK = 3, subcategory, author, minSimilarity = 0.3 } = options;

  try {
    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query.slice(0, 8000),
      dimensions: 1024,
    });
    const vec = `[${emb.data[0].embedding.join(',')}]`;

    const filters: string[] = [
      `category = 'voice_exemplar'`,
      `vectorized = true`,
      `embedding IS NOT NULL`,
    ];
    const params: Array<string | number> = [vec];
    if (subcategory) {
      params.push(subcategory);
      filters.push(`subcategory = $${params.length}`);
    }
    if (author) {
      params.push(author);
      filters.push(`author = $${params.length}`);
    }
    params.push(topK);
    const limitParam = `$${params.length}`;

    const sql = `
      SELECT subcategory, author, content, context, metadata,
             1 - (embedding <=> $1::vector) AS similarity
      FROM "StyleGuide"
      WHERE ${filters.join(' AND ')}
      ORDER BY embedding <=> $1::vector
      LIMIT ${limitParam}
    `;
    const result = await db.query(sql, params);

    return result.rows
      .filter((r) => Number(r.similarity) >= minSimilarity)
      .map((r) => ({
        subcategory: r.subcategory,
        author: r.author,
        content: r.content,
        context: r.context,
        similarity: Number(r.similarity),
        metadata: r.metadata ?? null,
      }));
  } catch (error) {
    console.error('Error fetching voice exemplars:', error);
    return [];
  }
}

/**
 * Format a list of voice exemplars as a few-shot block for the system prompt.
 * Truncates each exemplar to keep total token count under control.
 */
export function formatVoiceExemplars(
  exemplars: VoiceExemplar[],
  maxCharsPerExample = 2400
): string {
  if (!exemplars.length) return '';
  const blocks = exemplars.map((ex, i) => {
    const trimmed =
      ex.content.length > maxCharsPerExample
        ? ex.content.slice(0, maxCharsPerExample) + '\n…[truncated]'
        : ex.content;
    return `[Voice Exemplar ${i + 1} — author: ${ex.author}, type: ${ex.subcategory}, similarity: ${ex.similarity.toFixed(2)}]
${trimmed}`;
  });
  return `

**VOICE EXEMPLARS — match this voice (these are previously published OpticWise pieces, not fabricated):**

${blocks.join('\n\n---\n\n')}

When generating new content, mirror the rhythm, sentence length, openings, transitions, and signoff patterns shown above. Do not copy phrases verbatim. Do not invent client metrics — use only what is in the user's data or in the approved Wins & Nightmares Library.
`;
}

// ============================================
// DETECT INTENT FOR DATA SOURCES
// ============================================

export interface DataSourceIntent {
  needsEmail: boolean;
  needsCalendar: boolean;
  needsDrive: boolean;
  needsCRM: boolean;
  needsTranscripts: boolean;
}

export function detectDataSourceIntent(query: string): DataSourceIntent {
  const lower = query.toLowerCase();
  
  return {
    needsEmail: /email|mail|message|conversation|inbox|sent|received/.test(lower),
    needsCalendar: /meeting|calendar|schedule|event|appointment/.test(lower),
    needsDrive: /document|file|drive|pdf|proposal|doc|sheet/.test(lower),
    needsCRM: /deal|contact|person|company|organization|pipeline|stage/.test(lower),
    needsTranscripts: /call|transcript|conversation|discussion|meeting/.test(lower)
  };
}

// ============================================
// BRAND TERMINOLOGY ENFORCEMENT
// ============================================

/**
 * Enforce OpticWise brand terminology rules
 * CRITICAL: "infrastructure" must always be "digital infrastructure"
 */
export function enforceBrandTerminology(text: string): string {
  // Replace standalone "infrastructure" with "digital infrastructure"
  // But preserve cases where "digital" already precedes it
  
  // Pattern explanation:
  // (?<!digital\s) - Negative lookbehind: not preceded by "digital "
  // (?<!Digital\s) - Negative lookbehind: not preceded by "Digital "
  // \b - Word boundary
  // ([Ii]nfrastructure) - Match "infrastructure" or "Infrastructure" (case-insensitive)
  // \b - Word boundary
  
  const corrected = text.replace(
    /(?<!digital\s)(?<!Digital\s)\b([Ii]nfrastructure)\b/g,
    (match, p1) => {
      // Preserve capitalization
      if (p1[0] === 'I') {
        return 'Digital Infrastructure';
      } else {
        return 'digital infrastructure';
      }
    }
  );
  
  return corrected;
}

// ============================================
// SOURCE CITATION FORMATTING
// ============================================

/**
 * Format source citations for display at end of response
 */
export function formatSourceCitations(contexts: ContextSource[]): string {
  const allSources: SourceCitation[] = [];
  
  // Collect all sources from contexts
  contexts.forEach(context => {
    if (context.sources && context.sources.length > 0) {
      allSources.push(...context.sources);
    }
  });
  
  if (allSources.length === 0) {
    return '';
  }
  
  // Sort by confidence score (highest first)
  allSources.sort((a, b) => b.confidence - a.confidence);
  
  // Group by type
  const grouped: Record<string, SourceCitation[]> = {};
  allSources.forEach(source => {
    if (!grouped[source.type]) {
      grouped[source.type] = [];
    }
    grouped[source.type].push(source);
  });
  
  // Format output with collapsible dropdown - entire sources section collapsed
  let output = '\n\n---\n\n';
  output += `<details>\n<summary><strong>View Sources (${allSources.length})</strong></summary>\n\n`;
  output += `*This response was generated using ${allSources.length} source${allSources.length > 1 ? 's' : ''} from your data.*\n\n`;
  
  // Format each type with nested collapsible details
  const typeLabels: Record<string, string> = {
    transcript: 'Call Transcripts',
    email: 'Emails',
    crm: 'CRM Data',
    calendar: 'Calendar Events',
    drive: 'Documents',
    chat_history: 'Chat History'
  };
  
  Object.entries(grouped).forEach(([type, sources]) => {
    output += `<details>\n<summary><strong>${typeLabels[type] || type} (${sources.length})</strong></summary>\n\n`;
    
    sources.forEach((source, index) => {
      const confidencePercent = Math.round(source.confidence * 100);
      const relevanceLabel = confidencePercent >= 90 ? 'High' : confidencePercent >= 70 ? 'Medium' : 'Moderate';
      
      output += `**${index + 1}. ${source.title}**\n`;
      output += `- Relevance: ${confidencePercent}% (${relevanceLabel})\n`;
      if (source.date) output += `- Date: ${source.date}\n`;
      if (source.author) output += `- From: ${source.author}\n`;
      if (source.preview) output += `- Preview: "${source.preview}"\n`;
      
      // Add type-specific metadata
      if (source.metadata) {
        if (source.type === 'email' && source.metadata.contact) {
          output += `- Contact: ${source.metadata.contact}`;
          if (source.metadata.company) output += ` (${source.metadata.company})`;
          output += '\n';
        } else if (source.type === 'crm' && source.metadata.value) {
          output += `- Value: ${source.metadata.currency} ${Number(source.metadata.value).toLocaleString()}\n`;
          output += `- Stage: ${source.metadata.stage}\n`;
        } else if (source.type === 'transcript' && source.metadata.chunkIndex) {
          output += `- Section: ${source.metadata.chunkIndex}\n`;
        }
      }
      
      output += '\n';
    });
    
    output += `</details>\n\n`;
  });
  
  // Add legend (collapsed by default)
  output += '<details>\n<summary><strong>Relevance Score Legend</strong></summary>\n\n';
  output += '- **High (90-100%)**: Highly relevant to your query\n';
  output += '- **Medium (70-89%)**: Moderately relevant\n';
  output += '- **Moderate (Below 70%)**: Contextually relevant\n';
  output += '\n</details>\n\n';
  
  // Close the main sources details
  output += '</details>\n';
  
  return output;
}

// ============================================
// CACHE UTILITIES
// ============================================

export async function checkSemanticCache(
  query: string,
  db: Pool,
  openai: OpenAI,
  similarityThreshold: number = 0.95
): Promise<{ response: string; sources: Record<string, unknown> } | null> {
  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 1024
    });
    
    const queryEmbedding = `[${embedding.data[0].embedding.join(',')}]`;
    
    const result = await db.query(
      `SELECT response, sources, "queryEmbedding" <=> $1::vector as distance
       FROM "SemanticCache"
       WHERE "queryEmbedding" <=> $1::vector < $2
         AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
       ORDER BY distance
       LIMIT 1`,
      [queryEmbedding, 1 - similarityThreshold]
    );
    
    if (result.rows.length > 0) {
      // Update cache hit count
      await db.query(
        `UPDATE "SemanticCache" 
         SET "cacheHits" = "cacheHits" + 1, "lastHit" = NOW()
         WHERE response = $1`,
        [result.rows[0].response]
      );
      
      return {
        response: result.rows[0].response,
        sources: result.rows[0].sources
      };
    }
    
    return null;
  } catch (error) {
    console.error('Cache check error:', error);
    return null;
  }
}

export async function saveToSemanticCache(
  query: string,
  response: string,
  sources: Record<string, unknown>,
  db: Pool,
  openai: OpenAI,
  ttlHours: number = 24
): Promise<void> {
  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 1024
    });
    
    const queryEmbedding = `[${embedding.data[0].embedding.join(',')}]`;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    
    await db.query(
      `INSERT INTO "SemanticCache" (query, "queryEmbedding", response, sources, "expiresAt")
       VALUES ($1, $2, $3, $4, $5)`,
      [query, queryEmbedding, response, JSON.stringify(sources), expiresAt]
    );
  } catch (error) {
    console.error('Cache save error:', error);
  }
}
