/**
 * Search Transcripts Tool
 * 
 * Searches meeting transcripts using Pinecone vector search
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

  async execute({ query, limit = 5 }, { openai, pinecone }) {
    try {
      // Generate embedding for the query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: query,
        dimensions: 1024,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Search Pinecone
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');

      const searchResults = await index.query({
        topK: limit,
        vector: queryEmbedding,
        includeMetadata: true,
      });

      if (!searchResults.matches || searchResults.matches.length === 0) {
        return {
          success: true,
          data: { transcripts: [], count: 0 },
          confidence: 0.3,
          source_type: 'transcript_search',
          data_points: [],
        };
      }

      const transcripts = searchResults.matches.map(m => ({
        title: m.metadata?.title || 'Call',
        date: m.metadata?.date,
        text: m.metadata?.text_chunk || '',
        score: m.score,
      }));

      return {
        success: true,
        data: { transcripts, count: transcripts.length },
        confidence: Math.min(0.95, (searchResults.matches[0]?.score || 0.7) + 0.2),
        source_type: 'transcript_search',
        data_points: transcripts.map(t => ({
          title: t.title,
          date: t.date,
          relevance: t.score,
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
