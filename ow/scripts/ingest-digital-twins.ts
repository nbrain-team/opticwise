/**
 * Ingest Digital Twin AI OS files
 *
 * Loads BILL_DOUGLAS_AI_OS_v1.md and DREW_HALL_AI_OS_v1.md into the
 * KnowledgeDocument + KnowledgeChunk tables as category = "Canon — Digital Twin"
 * so the OWnet agent can retrieve the full persona when a user requests
 * Bill's or Drew's voice/thinking.
 *
 * Usage:
 *   cd ow
 *   npx tsx scripts/ingest-digital-twins.ts [--dry-run] [--reingest]
 *
 * Flags:
 *   --dry-run   Print plan without writing.
 *   --reingest  Delete existing Digital Twin docs before re-ingesting.
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const CHUNK_SIZE = 500;
const OVERLAP = 50;
const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIMS = 1024;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REINGEST = args.includes('--reingest');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TwinFile {
  absPath: string;
  fileName: string;
  author: 'Bill' | 'Drew';
  comment: string;
}

const TWIN_FILES: TwinFile[] = [
  {
    absPath: '/Users/billdouglas/My Drive/AI - prompts and docs/BILL_DOUGLAS_AI_OS_v1.md',
    fileName: 'BILL_DOUGLAS_AI_OS_v1.md',
    author: 'Bill',
    comment: "Bill Douglas's full Digital Twin — voice, operating philosophy, modes, non-negotiables, strategic framing. Load this verbatim when users ask to respond 'as Bill' or 'in Bill's voice/thinking'.",
  },
  {
    absPath: '/Users/billdouglas/My Drive/AI - prompts and docs/DREW_HALL_AI_OS_v1.md',
    fileName: 'DREW_HALL_AI_OS_v1.md',
    author: 'Drew',
    comment: "Drew Hall's full Digital Twin — voice, operating philosophy, modes, non-negotiables, architect framing. Load this verbatim when users ask to respond 'as Drew' or 'in Drew's voice/thinking'.",
  },
];

function chunkText(
  text: string,
  size = CHUNK_SIZE,
  overlap = OVERLAP
): { text: string; index: number; wordCount: number }[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= size) {
    return [{ text: words.join(' '), index: 0, wordCount: words.length }];
  }
  const out: { text: string; index: number; wordCount: number }[] = [];
  let start = 0;
  let index = 0;
  while (start < words.length) {
    const end = Math.min(start + size, words.length);
    const slice = words.slice(start, end);
    out.push({ text: slice.join(' '), index, wordCount: slice.length });
    start += size - overlap;
    index++;
  }
  return out;
}

async function embed(text: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),
    dimensions: EMBED_DIMS,
  });
  return r.data[0].embedding;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function main() {
  console.log('Ingest Digital Twin AI OS Files');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}${REINGEST ? ' + REINGEST' : ''}`);
  console.log('');

  // Validate files exist
  for (const twin of TWIN_FILES) {
    if (!fs.existsSync(twin.absPath)) {
      console.error(`File not found: ${twin.absPath}`);
      console.error('Ensure the AI OS files are accessible on this machine.');
      process.exit(1);
    }
    const stat = fs.statSync(twin.absPath);
    console.log(`  Found: ${twin.fileName} (${(stat.size / 1024).toFixed(1)} KB) — ${twin.author}`);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('Dry-run plan:');
    for (const twin of TWIN_FILES) {
      const content = fs.readFileSync(twin.absPath, 'utf-8');
      const chunks = chunkText(content);
      console.log(`  ${twin.author}: ${twin.fileName} → ${chunks.length} chunks`);
    }
    await pool.end();
    return;
  }

  if (REINGEST) {
    console.log('Reingest: deleting existing "Canon — Digital Twin" KnowledgeDocuments…');
    const del = await pool.query(
      `DELETE FROM "KnowledgeDocument" WHERE category = 'Canon — Digital Twin' RETURNING id`
    );
    console.log(`  deleted ${del.rowCount} docs (chunks cascade).\n`);
  }

  let docsCreated = 0;
  let chunksCreated = 0;

  for (const twin of TWIN_FILES) {
    try {
      const stat = fs.statSync(twin.absPath);
      const content = fs.readFileSync(twin.absPath, 'utf-8');
      const fileData = Buffer.from(content).toString('base64');

      if (!content || content.trim().length < 50) {
        console.log(`  SKIP (too short): ${twin.fileName}`);
        continue;
      }

      // Check if already exists with same content length (idempotent)
      const existing = await pool.query(
        `SELECT id, length("content") AS len FROM "KnowledgeDocument"
         WHERE category = 'Canon — Digital Twin' AND "fileName" = $1 LIMIT 1`,
        [twin.fileName]
      );

      if (existing.rows.length > 0 && Math.abs(existing.rows[0].len - content.length) < 50) {
        console.log(`  EXISTS (unchanged): ${twin.fileName}`);
        continue;
      }

      // Delete stale prior copy if content has changed
      if (existing.rows.length > 0) {
        await pool.query(`DELETE FROM "KnowledgeDocument" WHERE id = $1`, [existing.rows[0].id]);
        console.log(`  Replacing stale copy of ${twin.fileName}`);
      }

      const docId = newId('kd');
      const displayName = `${twin.author} Douglas AI OS — Digital Twin`;

      await pool.query(
        `INSERT INTO "KnowledgeDocument"
          (id, name, "fileName", "mimeType", "fileSize", "fileData", content, comment,
           category, "uploadedBy", vectorized, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW(), NOW())`,
        [
          docId,
          displayName,
          twin.fileName,
          'text/markdown',
          stat.size,
          fileData,
          content,
          twin.comment,
          'Canon — Digital Twin',
          'system-twin-ingest',
        ]
      );

      // Chunk + embed
      const chunks = chunkText(content);
      let written = 0;
      for (const ch of chunks) {
        try {
          const vec = await embed(ch.text);
          await pool.query(
            `INSERT INTO "KnowledgeChunk" (id, "documentId", "chunkIndex", "chunkText",
                                           "wordCount", embedding, "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6::vector, NOW())`,
            [newId('kc'), docId, ch.index, ch.text, ch.wordCount, `[${vec.join(',')}]`]
          );
          written++;
        } catch (err) {
          console.error(`    chunk ${ch.index} failed: ${(err as Error).message}`);
        }
        await new Promise((r) => setTimeout(r, 30));
      }

      await pool.query(
        `UPDATE "KnowledgeDocument" SET vectorized = $1, "updatedAt" = NOW() WHERE id = $2`,
        [written > 0, docId]
      );

      docsCreated++;
      chunksCreated += written;
      console.log(`  + ${twin.author} Digital Twin: ${twin.fileName} (${written} chunks embedded)`);
    } catch (err) {
      console.error(`  X ${twin.fileName}: ${(err as Error).message}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`Docs created: ${docsCreated}`);
  console.log(`Chunks embedded: ${chunksCreated}`);
  console.log('');
  console.log('The OWnet agent will now retrieve these chunks when users request');
  console.log('Bill\'s or Drew\'s voice/thinking. Matched by category = "Canon — Digital Twin"');
  console.log('and filtered by author name in the document name/comment.');

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
