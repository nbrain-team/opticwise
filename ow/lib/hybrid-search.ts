/**
 * Hybrid Search Service
 * 
 * Combines semantic vector search with BM25 keyword search,
 * then re-ranks results using AI for optimal relevance.
 * 
 * Based on Newbury Partners architecture.
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';

interface SearchResult {
  id: string | number;
  title: string;
  content: string;
  summary?: string;
  source_type: string;
  score: number;
  search_method?: string;
  rrf_score?: number;
  vector_rank?: number;
  keyword_rank?: number;
  [key: string]: any;
}

export class HybridSearchService {
  private dbPool: Pool;
  private openai: OpenAI;
  private anthropic: Anthropic;
  private pinecone: Pinecone;

  constructor(dbPool: Pool, openai: OpenAI, anthropic: Anthropic, pinecone: Pinecone) {
    this.dbPool = dbPool;
    this.openai = openai;
    this.anthropic = anthropic;
    this.pinecone = pinecone;
  }

  async search(params: {
    query: string;
    top_k?: number;
    min_similarity?: number;
    enable_reranking?: boolean;
  }) {
    const {
      query,
      top_k = 10,
      min_similarity = 0.7,
      enable_reranking = true,
    } = params;

    console.log(`[HybridSearch] Searching for: "${query}"`);

    // Execute both search strategies in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(query, { top_k: Math.ceil(top_k * 1.5), min_similarity }),
      this.bm25Search(query, { top_k: Math.ceil(top_k * 1.5) }),
    ]);

    console.log(`[HybridSearch] Vector: ${vectorResults.length}, Keyword: ${keywordResults.length}`);

    // Combine results with reciprocal rank fusion (RRF)
    const combinedResults = this.reciprocalRankFusion(vectorResults, keywordResults);

    console.log(`[HybridSearch] Combined: ${combinedResults.length} results`);

    // Re-rank using Claude if enabled
    let finalResults = combinedResults;
    if (enable_reranking && combinedResults.length > 5) {
      finalResults = await this.rerank(query, combinedResults.slice(0, 30));
      console.log(`[HybridSearch] Re-ranked to ${finalResults.length} results`);
    }

    return {
      success: true,
      data: {
        results: finalResults.slice(0, top_k),
        count: finalResults.length,
        query: query,
        method: 'hybrid_rrf',
      },
      confidence: this.calculateAverageConfidence(finalResults),
      source_type: 'hybrid_search',
    };
  }

  private async vectorSearch(
    query: string,
    params: { top_k: number; min_similarity: number }
  ): Promise<SearchResult[]> {
    const { top_k, min_similarity } = params;
    const results: SearchResult[] = [];

    try {
      // Create embedding
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: query,
        dimensions: 1024,
      });
      const embedding = embeddingResponse.data[0].embedding;
      const embeddingStr = `[${embedding.join(',')}]`;

      // Search Pinecone transcripts
      const index = this.pinecone.index(process.env.PINECONE_INDEX_NAME || 'opticwise-transcripts');
      const transcriptResults = await index.query({
        topK: Math.ceil(top_k / 2),
        vector: embedding,
        includeMetadata: true,
      });

      if (transcriptResults.matches) {
        results.push(...transcriptResults.matches.map((m, idx) => ({
          id: m.id,
          title: (m.metadata?.title as string) || 'Call',
          content: (m.metadata?.text_chunk as string) || '',
          summary: (m.metadata?.summary as string) || '',
          source_type: 'meeting_transcript',
          score: m.score || 0,
          search_method: 'vector',
          vector_rank: idx + 1,
        })));
      }

      // Search Gmail messages
      const emailResults = await this.dbPool.query(
        `SELECT id, subject, body, "from", "to", date,
                1 - (embedding <=> $1::vector) as score
         FROM "GmailMessage"
         WHERE vectorized = true AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [embeddingStr, Math.ceil(top_k / 3)]
      );

      results.push(...emailResults.rows.map((e, idx) => ({
        id: e.id,
        title: e.subject || '(No Subject)',
        content: e.body || '',
        summary: e.body?.slice(0, 200) || '',
        source_type: 'gmail_message',
        score: e.score,
        search_method: 'vector',
        vector_rank: results.length + idx + 1,
        from: e.from,
        to: e.to,
        date: e.date,
      })));

      // Search Drive files
      const driveResults = await this.dbPool.query(
        `SELECT id, name, content, description, "mimeType", "modifiedTime",
                1 - (embedding <=> $1::vector) as score
         FROM "DriveFile"
         WHERE vectorized = true AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [embeddingStr, Math.ceil(top_k / 3)]
      );

      results.push(...driveResults.rows.map((f, idx) => ({
        id: f.id,
        title: f.name,
        content: f.content || f.description || '',
        summary: f.description || '',
        source_type: 'drive_file',
        score: f.score,
        search_method: 'vector',
        vector_rank: results.length + idx + 1,
        mimeType: f.mimeType,
        modifiedTime: f.modifiedTime,
      })));

      // Filter by minimum similarity
      return results
        .filter(r => r.score >= min_similarity)
        .sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('[HybridSearch] Vector search error:', error);
      return [];
    }
  }

  private async bm25Search(
    query: string,
    params: { top_k: number }
  ): Promise<SearchResult[]> {
    const { top_k } = params;
    const results: SearchResult[] = [];

    try {
      // Search Gmail with full-text search
      const emailResults = await this.dbPool.query(
        `SELECT id, subject, body, "from", "to", date,
                ts_rank(to_tsvector('english', 
                  COALESCE(subject, '') || ' ' || COALESCE(body, '')
                ), plainto_tsquery('english', $1)) as score
         FROM "GmailMessage"
         WHERE to_tsvector('english', 
           COALESCE(subject, '') || ' ' || COALESCE(body, '')
         ) @@ plainto_tsquery('english', $1)
         ORDER BY ts_rank(to_tsvector('english', 
           COALESCE(subject, '') || ' ' || COALESCE(body, '')
         ), plainto_tsquery('english', $1)) DESC
         LIMIT $2`,
        [query, Math.ceil(top_k / 2)]
      );

      results.push(...emailResults.rows.map((e, idx) => ({
        id: e.id,
        title: e.subject || '(No Subject)',
        content: e.body || '',
        summary: e.body?.slice(0, 200) || '',
        source_type: 'gmail_message',
        score: e.score,
        search_method: 'bm25',
        keyword_rank: idx + 1,
        from: e.from,
        to: e.to,
        date: e.date,
      })));

      // Search Drive files with full-text search
      const driveResults = await this.dbPool.query(
        `SELECT id, name, content, description, "mimeType", "modifiedTime",
                ts_rank(to_tsvector('english', 
                  COALESCE(name, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(description, '')
                ), plainto_tsquery('english', $1)) as score
         FROM "DriveFile"
         WHERE to_tsvector('english', 
           COALESCE(name, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(description, '')
         ) @@ plainto_tsquery('english', $1)
         ORDER BY ts_rank(to_tsvector('english', 
           COALESCE(name, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(description, '')
         ), plainto_tsquery('english', $1)) DESC
         LIMIT $2`,
        [query, Math.ceil(top_k / 2)]
      );

      results.push(...driveResults.rows.map((f, idx) => ({
        id: f.id,
        title: f.name,
        content: f.content || f.description || '',
        summary: f.description || '',
        source_type: 'drive_file',
        score: f.score,
        search_method: 'bm25',
        keyword_rank: results.length + idx + 1,
        mimeType: f.mimeType,
        modifiedTime: f.modifiedTime,
      })));

      return results;
    } catch (error) {
      console.error('[HybridSearch] BM25 search error:', error);
      return [];
    }
  }

  private reciprocalRankFusion(
    vectorResults: SearchResult[],
    keywordResults: SearchResult[],
    k: number = 60
  ): SearchResult[] {
    // RRF formula: score = sum(1 / (k + rank))
    const scoreMap = new Map<string, SearchResult>();

    // Add vector results
    vectorResults.forEach((result, index) => {
      const key = `${result.source_type}_${result.id}`;
      const score = 1 / (k + index + 1);
      scoreMap.set(key, {
        ...result,
        rrf_score: score,
        vector_rank: index + 1,
      });
    });

    // Add keyword results
    keywordResults.forEach((result, index) => {
      const key = `${result.source_type}_${result.id}`;
      const score = 1 / (k + index + 1);

      if (scoreMap.has(key)) {
        const existing = scoreMap.get(key)!;
        existing.rrf_score = (existing.rrf_score || 0) + score;
        existing.keyword_rank = index + 1;
      } else {
        scoreMap.set(key, {
          ...result,
          rrf_score: score,
          keyword_rank: index + 1,
        });
      }
    });

    // Sort by RRF score
    return Array.from(scoreMap.values())
      .sort((a, b) => (b.rrf_score || 0) - (a.rrf_score || 0));
  }

  private async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    if (results.length === 0) {
      return results;
    }

    // Sample results for re-ranking (max 20)
    const sample = results.slice(0, 20);

    const prompt = `Rerank these search results by relevance to the query.

Query: ${query}

Results:
${sample.map((r, i) => `${i + 1}. ${r.title}\n${r.content.substring(0, 200)}...`).join('\n\n')}

Return a JSON array of result indices in order of relevance (most relevant first):
[1, 5, 3, 2, ...]`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\[([\s\S]*?)\]/);

      if (jsonMatch) {
        const ranking = JSON.parse(jsonMatch[0]) as number[];
        const reranked = ranking.map(idx => sample[idx - 1]).filter(Boolean);

        // Add remaining results not in top 20
        const remaining = results.slice(20);
        return [...reranked, ...remaining];
      }

      return results;
    } catch (error) {
      console.error('[HybridSearch] Re-ranking error:', error);
      return results;
    }
  }

  private calculateAverageConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    const avgScore = results.reduce((sum, r) => sum + (r.score || r.rrf_score || 0), 0) / results.length;
    return Math.min(0.5 + avgScore * 0.4, 0.9);
  }
}
