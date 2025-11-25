/**
 * Vectorize all Opticwise transcripts to Pinecone
 * Uses OpenAI text-embedding-3-large (1024 dimensions)
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { prisma } from '../lib/db';
import OpenAI from 'openai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const INDEX_NAME = 'opticwise-transcripts';
const CHUNK_SIZE = 500; // words per chunk
const BATCH_SIZE = 100; // embeddings per batch

interface Chunk {
  id: string;
  text: string;
  metadata: any;
}

function chunkText(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks;
}

async function vectorizeTranscripts() {
  console.log('=================================================');
  console.log('🧠 Vectorizing Opticwise Transcripts');
  console.log('=================================================\n');

  try {
    const index = pinecone.index(INDEX_NAME);
    console.log(`✅ Connected to index: ${INDEX_NAME}\n`);

    // Get all transcripts
    const transcripts = await prisma.callTranscript.findMany({
      where: { vectorized: false },
      orderBy: { startTime: 'desc' },
    });

    console.log(`📥 Found ${transcripts.length} transcripts to vectorize\n`);

    let totalVectors = 0;

    for (let i = 0; i < transcripts.length; i++) {
      const transcript = transcripts[i];
      console.log(`[${i + 1}/${transcripts.length}] ${transcript.title}`);

      try {
        // Chunk the transcript
        const textChunks = chunkText(transcript.transcript, CHUNK_SIZE);
        console.log(`  Created ${textChunks.length} chunks`);

        // Process in batches
        for (let b = 0; b < textChunks.length; b += BATCH_SIZE) {
          const batch = textChunks.slice(b, b + BATCH_SIZE);
          console.log(`  Batch ${Math.floor(b/BATCH_SIZE) + 1}/${Math.ceil(textChunks.length/BATCH_SIZE)}: Embedding ${batch.length} chunks...`);

          // Generate embeddings
          const embeddingRes = await openai.embeddings.create({
            model: 'text-embedding-3-large',
            input: batch,
            dimensions: 1024,
          });

          // Prepare vectors (filter out null values from metadata)
          const vectors = batch.map((text, idx) => {
            const metadata: Record<string, string | number> = {
              transcript_id: transcript.fathomCallId,
              title: transcript.title,
              date: transcript.startTime.toISOString(),
              chunk_index: b + idx,
              total_chunks: textChunks.length,
              text_chunk: text.substring(0, 1000),
            };
            
            // Only add if not null
            if (transcript.personId) metadata.person_id = transcript.personId;
            if (transcript.organizationId) metadata.organization_id = transcript.organizationId;
            
            return {
              id: `${transcript.fathomCallId}_${b + idx}`,
              values: embeddingRes.data[b + idx].embedding,
              metadata,
            };
          });

          // Upsert to Pinecone
          await index.upsert(vectors);
          console.log(`  ✅ Upserted ${vectors.length} vectors`);
          totalVectors += vectors.length;

          // Rate limiting
          await new Promise(r => setTimeout(r, 100));
        }

        // Mark as vectorized
        await prisma.callTranscript.update({
          where: { id: transcript.id },
          data: { vectorized: true },
        });

        console.log(`  ✅ Complete\n`);

      } catch (error) {
        console.error(`  ❌ Error:`, error);
      }
    }

    console.log('\n=================================================');
    console.log('✅ Vectorization Complete!');
    console.log('=================================================');
    console.log(`Total vectors created: ${totalVectors}`);
    console.log(`Total transcripts: ${transcripts.length}`);
    console.log('\n🎉 OWnet Agent is now powered by your transcripts!\n');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

vectorizeTranscripts();

