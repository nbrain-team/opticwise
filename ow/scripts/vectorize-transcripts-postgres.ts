/**
 * Vectorize Call Transcripts to PostgreSQL pgvector
 * Consolidates all vector search into one database
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

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.substring(0, 8000),
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function vectorizeTranscripts() {
  console.log('🚀 Vectorizing Call Transcripts to PostgreSQL');
  console.log('=============================================\n');

  try {
    // Get transcripts that need vectorization
    const result = await pool.query(
      `SELECT id, "fathomCallId", title, transcript, summary, "startTime"
       FROM "CallTranscript"
       WHERE embedding IS NULL
       ORDER BY "startTime" DESC`
    );

    const transcripts = result.rows;
    console.log(`Found ${transcripts.length} transcripts to vectorize\n`);

    if (transcripts.length === 0) {
      console.log('✅ All transcripts already vectorized!');
      return;
    }

    let processed = 0;
    let errors = 0;

    for (const transcript of transcripts) {
      try {
        console.log(`[${processed + 1}/${transcripts.length}] ${transcript.title}`);

        // Create embedding from transcript + summary
        const text = `${transcript.title}\n\n${transcript.summary || ''}\n\n${transcript.transcript}`;
        const embedding = await generateEmbedding(text);

        // Store in PostgreSQL
        await pool.query(
          `UPDATE "CallTranscript"
           SET embedding = $1, vectorized = true
           WHERE id = $2`,
          [`[${embedding.join(',')}]`, transcript.id]
        );

        processed++;
        console.log(`  ✅ Vectorized (${processed}/${transcripts.length})\n`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errors++;
        console.error(`  ❌ Error:`, error);
      }
    }

    console.log('\n📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Processed: ${processed}`);
    console.log(`❌ Errors: ${errors}`);

    // Show final status
    const finalResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(embedding) as has_embedding,
        SUM(CASE WHEN vectorized = true THEN 1 ELSE 0 END) as marked_vectorized
       FROM "CallTranscript"`
    );

    console.log('\n📈 Final Status:');
    console.log(`Total transcripts: ${finalResult.rows[0].total}`);
    console.log(`With embeddings: ${finalResult.rows[0].has_embedding}`);
    console.log(`Marked vectorized: ${finalResult.rows[0].marked_vectorized}`);

    console.log('\n✅ Transcripts now in PostgreSQL pgvector!');
    console.log('Next step: Update search code to use PostgreSQL instead of Pinecone\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

vectorizeTranscripts();
