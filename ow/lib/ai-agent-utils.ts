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
  
  // Deep analysis keywords
  const deepAnalysisKeywords = [
    'deep dive', 'deep analysis', 'detailed analysis', 'comprehensive',
    'in-depth', 'thorough', 'complete report', 'full analysis',
    'breakdown', 'detailed report', 'activity report'
  ];
  
  // Research keywords
  const researchKeywords = [
    'research', 'find all', 'show me everything', 'search for',
    'tell me about', 'what do we know', 'history of'
  ];
  
  // Quick answer keywords
  const quickKeywords = [
    'what is', 'who is', 'when', 'where', 'how many',
    'count', 'list', 'show me', 'find'
  ];
  
  // Action keywords
  const actionKeywords = [
    'create', 'send', 'schedule', 'update', 'delete',
    'add', 'remove', 'modify', 'draft', 'compose'
  ];
  
  // Creative keywords
  const creativeKeywords = [
    'write', 'draft', 'compose', 'generate', 'suggest',
    'brainstorm', 'come up with', 'ideas for'
  ];
  
  // Check for deep analysis
  if (deepAnalysisKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      type: 'deep_analysis',
      confidence: 0.9,
      keywords: deepAnalysisKeywords.filter(kw => lowerQuery.includes(kw)),
      requiresDeepSearch: true,
      suggestedMaxTokens: 16384,
      suggestedTemperature: 0.7
    };
  }
  
  // Check for research
  if (researchKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      type: 'research',
      confidence: 0.8,
      keywords: researchKeywords.filter(kw => lowerQuery.includes(kw)),
      requiresDeepSearch: true,
      suggestedMaxTokens: 12288,
      suggestedTemperature: 0.6
    };
  }
  
  // Check for action
  if (actionKeywords.some(kw => lowerQuery.includes(kw))) {
    return {
      type: 'action',
      confidence: 0.85,
      keywords: actionKeywords.filter(kw => lowerQuery.includes(kw)),
      requiresDeepSearch: false,
      suggestedMaxTokens: 4096,
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
      suggestedMaxTokens: 8192,
      suggestedTemperature: 0.8
    };
  }
  
  // Default to quick answer
  return {
    type: 'quick_answer',
    confidence: 0.6,
    keywords: quickKeywords.filter(kw => lowerQuery.includes(kw)),
    requiresDeepSearch: false,
    suggestedMaxTokens: 4096,
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
      model: 'gpt-4o-mini', // Fast, cheap model for this task
      messages: [{
        role: 'user',
        content: `Given this search query: "${query}"

Generate:
1. 3-5 alternative phrasings that capture the same intent
2. Key entities mentioned (people, companies, concepts)
3. Important keywords

Return as JSON:
{
  "variations": ["variation 1", "variation 2", ...],
  "entities": ["entity1", "entity2", ...],
  "keywords": ["keyword1", "keyword2", ...]
}`
      }],
      temperature: 0.3,
      max_tokens: 500
    });
    
    const content = response.choices[0]?.message?.content || '{}';
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
  type: 'transcript' | 'email' | 'calendar' | 'drive' | 'crm' | 'chat_history';
  content: string;
  metadata: any;
  relevanceScore?: number;
  tokenCount: number;
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
  maxContextTokens: number = 180000
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
      historyMessages.push(`${msg.role}: ${msg.content}`);
      historyTokens += msgTokens;
    }
    
    if (historyMessages.length > 0) {
      contexts.push({
        type: 'chat_history',
        content: historyMessages.join('\n\n'),
        metadata: { messageCount: historyMessages.length },
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
  
  // Priority 2: Relevant transcripts (up to 60K tokens)
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');
    const searchResults = await index.query({
      topK: 20,
      vector: queryEmbedding,
      includeMetadata: true
    });
    
    let transcriptTokens = 0;
    const transcriptChunks: string[] = [];
    
    if (searchResults.matches) {
      for (const match of searchResults.matches) {
        if (transcriptTokens > 60000) break;
        const chunk = match.metadata?.text_chunk as string || '';
        const chunkTokens = estimateTokens(chunk);
        
        if (usedTokens + transcriptTokens + chunkTokens > availableForContext) break;
        
        transcriptChunks.push(`[${match.metadata?.title || 'Call'} - ${new Date(match.metadata?.date as string || '').toLocaleDateString()}]\n${chunk}`);
        transcriptTokens += chunkTokens;
      }
    }
    
    if (transcriptChunks.length > 0) {
      contexts.push({
        type: 'transcript',
        content: transcriptChunks.join('\n\n---\n\n'),
        metadata: { chunkCount: transcriptChunks.length },
        tokenCount: transcriptTokens
      });
      usedTokens += transcriptTokens;
    }
  } catch (error) {
    console.error('Error loading transcripts:', error);
  }
  
  // Priority 3: Emails (up to 40K tokens)
  try {
    const emailResult = await db.query(
      `SELECT subject, "from", "to", snippet, body, date
       FROM "GmailMessage"
       WHERE vectorized = true AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 15`,
      [vectorString]
    );
    
    let emailTokens = 0;
    const emailContents: string[] = [];
    
    for (const email of emailResult.rows) {
      const emailText = `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${new Date(email.date).toLocaleDateString()}\n${email.snippet || email.body?.slice(0, 500)}`;
      const tokens = estimateTokens(emailText);
      
      if (emailTokens + tokens > 40000 || usedTokens + emailTokens + tokens > availableForContext) break;
      
      emailContents.push(emailText);
      emailTokens += tokens;
    }
    
    if (emailContents.length > 0) {
      contexts.push({
        type: 'email',
        content: emailContents.join('\n\n---\n\n'),
        metadata: { emailCount: emailContents.length },
        tokenCount: emailTokens
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
        `SELECT d.title, d.value, d.currency, s.name as stage_name, 
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
      
      if (usedTokens + crmTokens <= availableForContext) {
        contexts.push({
          type: 'crm',
          content: crmText,
          metadata: { dealCount: dealsResult.rows.length },
          tokenCount: crmTokens
        });
        usedTokens += crmTokens;
      }
    }
  } catch (error) {
    console.error('Error loading CRM data:', error);
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
    // Generate embedding for query
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 1024
    });
    
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
  metadata: any;
}

/**
 * Re-rank search results using cross-attention
 * This is a placeholder - in production you'd use a dedicated re-ranker
 */
export async function rerankResults(
  query: string,
  results: Array<{ content: string; score: number; metadata: any }>,
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
// CACHE UTILITIES
// ============================================

export async function checkSemanticCache(
  query: string,
  db: Pool,
  openai: OpenAI,
  similarityThreshold: number = 0.95
): Promise<{ response: string; sources: any } | null> {
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
  sources: any,
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
