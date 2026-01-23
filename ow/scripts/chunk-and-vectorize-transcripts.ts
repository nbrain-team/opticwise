/**
 * Chunk and Vectorize Call Transcripts - Newbury Style
 * Breaks transcripts into 500-word chunks for precise vector search
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
const OVERLAP = 50; // words overlap between chunks

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

async function chunkAndVectorizeTranscripts() {
  console.log('🚀 Chunking and Vectorizing Call Transcripts (Newbury Style)');
  console.log('============================================================\n');

  try {
    // Get all transcripts
    const transcripts = await pool.query(
      `SELECT id, "fathomCallId", title, transcript, summary, "startTime", participants
       FROM "CallTranscript"
       ORDER BY "startTime" DESC`
    );

    console.log(`Found ${transcripts.rows.length} transcripts to chunk and vectorize\n`);

    let totalChunks = 0;
    let processedTranscripts = 0;

    for (const transcript of transcripts.rows) {
      try {
        console.log(`\n[${processedTranscripts + 1}/${transcripts.rows.length}] ${transcript.title}`);
        console.log(`  Transcript length: ${transcript.transcript.length} chars`);

        // Check if already chunked
        const existingChunks = await pool.query(
          `SELECT COUNT(*) as count FROM "CallTranscriptChunk" WHERE "transcriptId" = $1`,
          [transcript.id]
        );

        if (parseInt(existingChunks.rows[0].count) > 0) {
          console.log(`  ⏭️  Already chunked (${existingChunks.rows[0].count} chunks)`);
          continue;
        }

        // Chunk the transcript
        const chunks = chunkText(transcript.transcript, CHUNK_SIZE, OVERLAP);
        console.log(`  📄 Created ${chunks.length} chunks`);

        // Vectorize and store each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const wordCount = chunk.split(/\s+/).length;

          // Generate embedding
          const embedding = await generateEmbedding(chunk);

          // Store chunk
          await pool.query(
            `INSERT INTO "CallTranscriptChunk" 
             ("transcriptId", "chunkIndex", "chunkText", "wordCount", embedding)
             VALUES ($1, $2, $3, $4, $5)`,
            [transcript.id, i, chunk, wordCount, `[${embedding.join(',')}]`]
          );

          totalChunks++;

          if ((i + 1) % 10 === 0) {
            console.log(`    ✅ Vectorized ${i + 1}/${chunks.length} chunks`);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log(`  ✅ Complete: ${chunks.length} chunks vectorized`);
        processedTranscripts++;

      } catch (error) {
        console.error(`  ❌ Error:`, error);
      }
    }

    console.log('\n\n📊 SUMMARY');
    console.log('==========');
    console.log(`Transcripts processed: ${processedTranscripts}`);
    console.log(`Total chunks created: ${totalChunks}`);

    // Show final stats
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT "transcriptId") as transcript_count,
        COUNT(*) as chunk_count,
        AVG("wordCount") as avg_words_per_chunk,
        MIN("wordCount") as min_words,
        MAX("wordCount") as max_words
      FROM "CallTranscriptChunk"
    `);

    console.log('\n📈 Final Stats:');
    console.table(stats.rows[0]);

    console.log('\n✅ Transcript chunking complete!');
    console.log('Next: Update agent to search chunks instead of full transcripts\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

chunkAndVectorizeTranscripts();
