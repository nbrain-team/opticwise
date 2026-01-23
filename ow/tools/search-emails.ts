/**
 * Search Emails Tool
 * 
 * Searches Gmail messages using vector similarity
 */

import { ToolDefinition } from '../lib/tool-registry';

export const searchEmailsTool: ToolDefinition = {
  name: 'search_emails',
  description: 'Searches email messages to find relevant conversations, threads, and communications',
  category: 'email',
  requiresApproval: false,

  parameters: {
    query: {
      type: 'string',
      required: true,
      description: 'Search query to find relevant emails',
    },
    limit: {
      type: 'number',
      required: false,
      description: 'Maximum number of results (default: 5)',
      default: 5,
    },
  },

  async execute({ query, limit = 5 }, { dbPool, openai }) {
    try {
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: String(query),
        dimensions: 1024,
      });

      const queryVector = embeddingResponse.data[0].embedding;

      // Search emails
      const emailResults = await dbPool.query(
        `SELECT id, subject, "from", "to", snippet, date, body
         FROM "GmailMessage"
         WHERE vectorized = true AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [`[${queryVector.join(',')}]`, limit]
      );

      const emails = emailResults.rows.map(email => ({
        id: email.id,
        subject: email.subject,
        from: email.from,
        to: email.to,
        date: email.date,
        snippet: email.snippet || email.body?.slice(0, 200),
      }));

      return {
        success: true,
        data: { emails, count: emails.length },
        confidence: emails.length > 0 ? 0.85 : 0.4,
        source_type: 'email_search',
        data_points: emails.map(e => ({
          subject: e.subject,
          from: e.from,
          date: e.date,
        })),
      };
    } catch (error) {
      console.error('[search_emails] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
      };
    }
  },
};
