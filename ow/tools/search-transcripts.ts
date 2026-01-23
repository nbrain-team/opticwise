/**
 * Search Transcripts Tool
 * 
 * Searches meeting transcripts using PostgreSQL pgvector
 */

import { ToolDefinition } from '../lib/tool-registry';

export const searchTranscriptsTool: ToolDefinition = {
  name: 'search_transcripts',
  description: 'Searches meeting transcripts to find discussions, action items, decisions, and insights from past calls',
  category: 'knowledge',
  requiresApproval: false,

  parameters: {
    query: {
      type: 'string',
      required: true,
      description: 'Search query to find relevant transcript content',
    },
    limit: {
      type: 'number',
      required: false,
      description: 'Maximum number of results (default: 5)',
      default: 5,
    },
  },

  async execute({ query, limit = 5 }, { openai, dbPool }) {
    try {
      // Generate embedding for the query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: String(query),
        dimensions: 1024,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;
      const vectorString = `[${queryEmbedding.join(',')}]`;

      // Search PostgreSQL using pgvector
      const searchResults = await dbPool.query(
        `SELECT 
          id,
          "fathomCallId",
          title,
          transcript,
          summary,
          "startTime",
          participants,
          1 - (embedding <=> $1::vector) as similarity
         FROM "CallTranscript"
         WHERE vectorized = true AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [vectorString, Number(limit)]
      );

      if (searchResults.rows.length === 0) {
        return {
          success: true,
          data: { transcripts: [], count: 0 },
          confidence: 0.3,
          source_type: 'transcript_search',
          data_points: [],
        };
      }

      const transcripts = searchResults.rows.map(row => ({
        title: row.title,
        date: new Date(row.startTime).toLocaleDateString(),
        text: row.summary || row.transcript.substring(0, 1000),
        participants: row.participants,
        similarity: row.similarity,
      }));

      return {
        success: true,
        data: { transcripts, count: transcripts.length },
        confidence: Math.min(0.95, searchResults.rows[0].similarity),
        source_type: 'transcript_search',
        data_points: transcripts.map(t => ({
          title: t.title,
          date: t.date,
          relevance: t.similarity,
        })),
      };
    } catch (error) {
      console.error('[search_transcripts] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
      };
    }
  },
};
