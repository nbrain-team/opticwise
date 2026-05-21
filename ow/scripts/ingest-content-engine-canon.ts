/**
 * Ingest Content Engine Canon
 *
 * Walks the OpticWise Content Engine folder (the canonical brand/voice/training
 * corpus) and loads every .md / .txt / .gs / .docx file into KnowledgeDocument
 * + KnowledgeChunk so the OWnet agent can retrieve canon by similarity.
 *
 * Default source folder is Bill's local Content Engine folder. Override with
 * the CONTENT_ENGINE_PATH env var.
 *
 * Usage:
 *   cd ow
 *   npx tsx scripts/ingest-content-engine-canon.ts [--dry-run] [--reingest]
 *
 * Flags:
 *   --dry-run   Walk the folder, classify files, print plan. Do not write.
 *   --reingest  Delete existing canon docs (category starts with "Canon —")
 *               before ingesting. Use when the source folder has changed.
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

const DEFAULT_PATH =
  '/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/Claude CoWork Projects/OpticWise Content Engine';

const SOURCE_PATH = process.env.CONTENT_ENGINE_PATH || DEFAULT_PATH;

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

interface CanonFile {
  absPath: string;
  relPath: string;
  fileName: string;
  category: string;
  subcategory: string;
  priority: number; // 1 = top canon, 5 = exemplar
  comment: string;
}

/**
 * Classify a file into a canon category. The category drives retrieval boosts
 * later (canon docs get a higher floor in hybrid-search).
 */
function classify(absPath: string): CanonFile | null {
  const fileName = path.basename(absPath);
  const relPath = path.relative(SOURCE_PATH, absPath);
  const lower = fileName.toLowerCase();
  const ext = path.extname(lower);

  if (fileName === '.DS_Store' || fileName.startsWith('._')) return null;
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return null;
  if (lower.endsWith('.json')) return null; // drive_payload.json — internal
  // Only ingest text-bearing files
  if (!['.md', '.txt', '.gs', '.docx'].includes(ext)) return null;

  // Voice exemplars (published blog packages live in OW Blog/<date>/...)
  if (relPath.includes('OW Blog')) {
    const author = lower.includes('drew') || lower.includes('_drew') ? 'Drew' : 'Bill';
    const subcat = lower.includes('weekly-intelligence-briefing')
      ? 'Briefing'
      : lower.includes('content-summary')
      ? 'Summary'
      : lower.includes('completion-email')
      ? 'CompletionEmail'
      : 'BlogPackage';
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Voice Exemplar',
      subcategory: `${author}/${subcat}`,
      priority: 4,
      comment: `Published exemplar from ${path.dirname(relPath).replace(/^OW Blog in Claude folder\//, '')} — ${author}, ${subcat}`,
    };
  }

  // Top-priority canon (must shape every response)
  if (lower.includes('canonical_sb7') || lower.includes('canonical sb7')) {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — BrandScript SB7',
      subcategory: 'Master',
      priority: 1,
      comment: 'Master SB7 BrandScript — the source of truth for narrative, positioning, and voice.',
    };
  }
  if (lower.includes('content_engine_final') || lower === 'claude.md') {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Content Engine Workflow',
      subcategory: lower === 'claude.md' ? 'Instructions' : 'Workflow',
      priority: 1,
      comment: 'Weekly Content Engine workflow + standing market context (four moats, model-is-commodity thesis).',
    };
  }
  if (lower.includes('assetmanager') || lower.includes('asset_manager') || lower.includes('asset-manager')) {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Audience Lens',
      subcategory: 'AssetManager',
      priority: 1,
      comment: 'Asset Manager Mindset Overlay — the default audience filter (Salwasser distinction).',
    };
  }
  if (lower.includes('sales_playbook') || lower.includes('sales-playbook')) {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Sales Playbook',
      subcategory: 'Master',
      priority: 1,
      comment: 'Non-negotiable language rules, discovery scripts, objection handling, AM positioning, SIC®.',
    };
  }
  if (lower.includes('brandvoice') && lower.includes('keycrew')) {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Voice Patterns',
      subcategory: 'KeyCrewYield',
      priority: 2,
      comment: 'Spoken-voice analogies, sharpened phrasings, PR-series nightmare additions.',
    };
  }
  if (lower.includes('brandscript_best_examples') || lower.includes('brandscript_json')) {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — BrandScript Exemplars',
      subcategory: 'Schema',
      priority: 2,
      comment: 'BrandScript schema with locked NOI benchmarks and Wins & Nightmares proof rules.',
    };
  }
  if (lower.includes('peak_property_performance') || lower.includes('peak-property-performance')) {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — PPP Book',
      subcategory: 'Manuscript',
      priority: 2,
      comment: 'Peak Property Performance manuscript — full PPP 5C frameworks and appendices.',
    };
  }
  if (lower.includes('bill_douglas_ai_os') || lower === 'bill_douglas_ai_os_v1.md') {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Digital Twin',
      subcategory: 'Bill',
      priority: 1,
      comment: "Bill Douglas's full Digital Twin AI OS — voice, operating philosophy, modes, non-negotiables. Load verbatim when users request Bill's voice/thinking.",
    };
  }
  if (lower.includes('drew_hall_ai_os') || lower === 'drew_hall_ai_os_v1.md') {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Digital Twin',
      subcategory: 'Drew',
      priority: 1,
      comment: "Drew Hall's full Digital Twin AI OS — voice, operating philosophy, modes, non-negotiables. Load verbatim when users request Drew's voice/thinking.",
    };
  }
  if (lower.includes('drew_hall_transfer_pack')) {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Author Voice',
      subcategory: 'DrewTransferPack',
      priority: 3,
      comment: "Drew Hall handoff context.",
    };
  }
  if (lower.includes('content_backlog') || lower === 'content_backlog.md') {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Content Backlog',
      subcategory: 'QueuedAngles',
      priority: 3,
      comment: 'Queued content angles surfaced from sales calls and events.',
    };
  }
  if (lower.includes('drive-bridge') || lower.endsWith('.gs')) {
    return {
      absPath,
      relPath,
      fileName,
      category: 'Canon — Drive Bridge',
      subcategory: 'AppsScript',
      priority: 3,
      comment: 'Apps Script that writes weekly Content Engine output to Google Drive.',
    };
  }

  // Fallback for anything else in the folder
  return {
    absPath,
    relPath,
    fileName,
    category: 'Canon — Reference',
    subcategory: 'Misc',
    priority: 4,
    comment: `Reference material from Content Engine folder.`,
  };
}

function walk(dir: string, out: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, out);
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

async function readText(file: CanonFile): Promise<string> {
  const ext = path.extname(file.absPath).toLowerCase();
  if (ext === '.docx') {
    const buffer = fs.readFileSync(file.absPath);
    const result = await mammoth.extractRawText({ buffer });
    return String(result.value || '').trim();
  }
  return fs.readFileSync(file.absPath, 'utf-8');
}

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
  console.log('Ingest Content Engine Canon');
  console.log('='.repeat(60));
  console.log(`Source: ${SOURCE_PATH}`);
  console.log(`Mode:   ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}${REINGEST ? ' + REINGEST' : ''}`);
  console.log('');

  if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`Source folder not found: ${SOURCE_PATH}`);
    process.exit(1);
  }

  const all = walk(SOURCE_PATH);
  const classified = all
    .map(classify)
    .filter((f): f is CanonFile => f !== null)
    .sort((a, b) => a.priority - b.priority || a.relPath.localeCompare(b.relPath));

  console.log(`Found ${all.length} files; ${classified.length} ingestible.\n`);

  // Group summary
  const byCat: Record<string, number> = {};
  for (const f of classified) byCat[f.category] = (byCat[f.category] || 0) + 1;
  for (const [cat, n] of Object.entries(byCat).sort()) {
    console.log(`  ${cat.padEnd(38)} ${n}`);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('Dry-run plan:');
    for (const f of classified) {
      console.log(`  [P${f.priority}] ${f.category} :: ${f.subcategory} :: ${f.relPath}`);
    }
    await pool.end();
    return;
  }

  if (REINGEST) {
    console.log('Reingest: deleting existing "Canon — *" KnowledgeDocuments…');
    const del = await pool.query(
      `DELETE FROM "KnowledgeDocument" WHERE category LIKE 'Canon — %' RETURNING id`
    );
    console.log(`  deleted ${del.rowCount} canon docs (chunks cascade).\n`);
  }

  let docsCreated = 0;
  let docsSkipped = 0;
  let chunksCreated = 0;
  const errors: { file: string; error: string }[] = [];

  for (const file of classified) {
    try {
      const stat = fs.statSync(file.absPath);
      const buffer = fs.readFileSync(file.absPath);
      const fileData = buffer.toString('base64');
      const content = await readText(file);

      if (!content || content.trim().length < 20) {
        console.log(`  SKIP (too short): ${file.relPath}`);
        docsSkipped++;
        continue;
      }

      // Idempotent on (category, fileName) — skip if doc already exists with
      // identical content length.
      const existing = await pool.query(
        `SELECT id, length("content") AS len FROM "KnowledgeDocument"
         WHERE category = $1 AND "fileName" = $2 LIMIT 1`,
        [file.category, file.fileName]
      );
      if (existing.rows.length > 0 && Math.abs(existing.rows[0].len - content.length) < 50) {
        console.log(`  EXISTS: ${file.relPath}`);
        docsSkipped++;
        continue;
      }

      // If a stale prior copy exists with different length, delete it (chunks cascade).
      if (existing.rows.length > 0) {
        await pool.query(`DELETE FROM "KnowledgeDocument" WHERE id = $1`, [existing.rows[0].id]);
      }

      const ext = path.extname(file.fileName).toLowerCase();
      const mimeType =
        ext === '.docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : ext === '.gs'
          ? 'text/plain'
          : ext === '.md'
          ? 'text/markdown'
          : 'text/plain';

      const docId = newId('kd');
      const displayName = file.fileName.replace(/\.[^.]+$/, '');
      const richComment = `${file.comment}\n\n[Canon priority: P${file.priority}] [Source: ${file.relPath}]`;

      await pool.query(
        `INSERT INTO "KnowledgeDocument"
          (id, name, "fileName", "mimeType", "fileSize", "fileData", content, comment,
           category, "uploadedBy", vectorized, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW(), NOW())`,
        [
          docId,
          displayName,
          file.fileName,
          mimeType,
          stat.size,
          fileData,
          content,
          richComment,
          file.category,
          'system-canon-ingest',
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
      console.log(`  + ${file.category} :: ${file.relPath} (${written} chunks)`);
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`  X ${file.relPath}: ${msg}`);
      errors.push({ file: file.relPath, error: msg });
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`Docs created: ${docsCreated}`);
  console.log(`Docs skipped: ${docsSkipped}`);
  console.log(`Chunks:       ${chunksCreated}`);
  if (errors.length) {
    console.log(`Errors:       ${errors.length}`);
    for (const e of errors) console.log(`  - ${e.file}: ${e.error}`);
  }

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
