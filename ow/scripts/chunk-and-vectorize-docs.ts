/**
 * Chunk and Vectorize Drive Files - Newbury Style
 * Breaks large documents into 500-word chunks for precise vector search
 */

import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 500; // words per chunk
const OVERLAP = 50; // words overlap
const MIN_CHUNK_LENGTH = 2000; // Only chunk docs longer than this

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.substring(0, 8000),
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function chunkAndVectorizeDocs() {
  console.log('🚀 Chunking and Vectorizing Drive Files');
  console.log('========================================\n');

  try {
    // Get large documents that need chunking
    const docs = await pool.query(
      `SELECT id, name, content, description, "mimeType"
       FROM "DriveFile"
       WHERE content IS NOT NULL
         AND LENGTH(content) > $1
       ORDER BY "modifiedTime" DESC`,
      [MIN_CHUNK_LENGTH]
    );

    console.log(`Found ${docs.rows.length} large documents to chunk\n`);

    let totalChunks = 0;
    let processedDocs = 0;

    for (const doc of docs.rows) {
      try {
        console.log(`\n[${processedDocs + 1}/${docs.rows.length}] ${doc.name}`);
        console.log(`  Content length: ${doc.content.length} chars`);

        // Check if already chunked
        const existingChunks = await pool.query(
          `SELECT COUNT(*) as count FROM "DriveFileChunk" WHERE "fileId" = $1`,
          [doc.id]
        );

        if (parseInt(existingChunks.rows[0].count) > 0) {
          console.log(`  ⏭️  Already chunked`);
          continue;
        }

        // Create context-rich text for chunking
        const fullText = `${doc.name}\n${doc.description || ''}\n\n${doc.content}`;
        const chunks = chunkText(fullText, CHUNK_SIZE, OVERLAP);
        console.log(`  📄 Created ${chunks.length} chunks`);

        // Vectorize each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const wordCount = chunk.split(/\s+/).length;

          const embedding = await generateEmbedding(chunk);

          await pool.query(
            `INSERT INTO "DriveFileChunk" 
             ("fileId", "chunkIndex", "chunkText", "wordCount", embedding)
             VALUES ($1, $2, $3, $4, $5)`,
            [doc.id, i, chunk, wordCount, `[${embedding.join(',')}]`]
          );

          totalChunks++;

          if ((i + 1) % 10 === 0) {
            console.log(`    ✅ ${i + 1}/${chunks.length} chunks vectorized`);
          }

          await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log(`  ✅ Complete: ${chunks.length} chunks`);
        processedDocs++;

      } catch (error) {
        console.error(`  ❌ Error:`, error);
      }
    }

    console.log('\n\n📊 SUMMARY');
    console.log('==========');
    console.log(`Documents processed: ${processedDocs}`);
    console.log(`Total chunks created: ${totalChunks}`);

    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT "fileId") as doc_count,
        COUNT(*) as chunk_count,
        AVG("wordCount") as avg_words_per_chunk
      FROM "DriveFileChunk"
    `);

    console.log('\n📈 Final Stats:');
    console.table(stats.rows[0]);

    console.log('\n✅ Document chunking complete!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

chunkAndVectorizeDocs();
