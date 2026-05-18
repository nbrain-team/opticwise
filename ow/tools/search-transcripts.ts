/**
 * Search Transcripts Tool
 *
 * Searches meeting transcripts using PostgreSQL pgvector.
 *
 * Source: ReadAIMeeting only (as of 2026-05-18). The Fathom CallTranscript
 * table is deprecated and intentionally not queried by this tool — see
 * `~/.cursor/rules/ow-data-via-postgres-mcp.mdc` and Bill's punch list.
 *
 * Vector column behavior: if `ReadAIMeeting.vectorEmbedding` has been
 * migrated to the `vector` pgvector type, we order by similarity. Otherwise
 * we fall back to recency-sorted retrieval so the tool still returns
 * something useful.
 */

import { ToolDefinition } from '../lib/tool-registry';

export const searchTranscriptsTool: ToolDefinition = {
  name: 'search_transcripts',
  description: 'Searches Read.ai meeting transcripts to find discussions, action items, decisions, and insights from past calls',
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
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: String(query),
        dimensions: 1024,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;
      const vectorString = `[${queryEmbedding.join(',')}]`;

      // Detect whether vectorEmbedding is pgvector-typed; fall back to
      // recency-sorted retrieval if not (TEXT column still pending migration).
      const colCheck = await dbPool.query(
        `SELECT udt_name FROM information_schema.columns
         WHERE table_name = 'ReadAIMeeting' AND column_name = 'vectorEmbedding' LIMIT 1`
      );
      const isVectorCol = colCheck.rows[0]?.udt_name === 'vector';

      let searchResults;
      if (isVectorCol) {
        searchResults = await dbPool.query(
          `SELECT
            id,
            title,
            transcript,
            summary,
            "startTime",
            participants,
            1 - ("vectorEmbedding"::vector <=> $1::vector) as similarity
           FROM "ReadAIMeeting"
           WHERE "vectorEmbedding" IS NOT NULL
           ORDER BY "vectorEmbedding"::vector <=> $1::vector
           LIMIT $2`,
          [vectorString, Number(limit)]
        );
      } else {
        searchResults = await dbPool.query(
          `SELECT
            id,
            title,
            transcript,
            summary,
            "startTime",
            participants,
            NULL::float as similarity
           FROM "ReadAIMeeting"
           WHERE COALESCE(summary, transcript) IS NOT NULL
           ORDER BY "startTime" DESC NULLS LAST
           LIMIT $1`,
          [Number(limit)]
        );
      }

      if (searchResults.rows.length === 0) {
        return {
          success: true,
          data: { transcripts: [], count: 0 },
          confidence: 0.3,
          source_type: 'transcript_search',
          data_points: [],
        };
      }

      const transcripts = searchResults.rows.map((row) => ({
        title: row.title,
        date: new Date(row.startTime).toLocaleDateString(),
        text: row.summary || (row.transcript ? row.transcript.substring(0, 1000) : ''),
        participants: row.participants,
        similarity: row.similarity ?? null,
      }));

      const topSim = searchResults.rows[0].similarity;
      return {
        success: true,
        data: { transcripts, count: transcripts.length },
        confidence: topSim != null ? Math.min(0.95, Number(topSim)) : 0.5,
        source_type: 'transcript_search',
        data_points: transcripts.map((t) => ({
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
