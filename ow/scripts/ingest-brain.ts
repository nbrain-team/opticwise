/**
 * Ingest the OWnet Brain (single source of truth)
 *
 * Walks ow/brain/{rules,knowledge,decisions}, the vendored canonical knowledge
 * store, and propagates it to the OWnet agent two ways:
 *
 *   1. RAG  — every active file becomes a KnowledgeDocument (category
 *             "Brain — Rule|Knowledge|Decision", with its visibility tier) plus
 *             chunked KnowledgeChunks (text-embedding-3-large, 1024d) so the
 *             agent can retrieve canon by similarity.
 *   2. Canon module — emits ow/lib/brain-canon.generated.ts with the always-on
 *             RULES_PACK (every active rule + the must-always-present
 *             positioning) and the full Bill/Drew PERSONAS, so the system prompt
 *             can include them deterministically without a runtime DB/disk read.
 *
 * Governance honored (see ow/brain/decisions/0005 + ow/brain/README.md):
 *   - Only status: active propagates. draft / deprecated are excluded.
 *   - visibility (shareable | internal | internal-restricted) rides along as a
 *     column; internal-restricted gating happens at query time in the chat route.
 *   - The Brain is upstream — this script never writes back into ow/brain/.
 *
 * Usage:
 *   cd ow
 *   npx tsx scripts/ingest-brain.ts [--dry-run] [--reingest]
 *
 * Flags:
 *   --dry-run   Walk + classify + regenerate the canon module. No DB writes.
 *   --reingest  Delete existing "Brain — *" KnowledgeDocuments before ingesting.
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const CHUNK_SIZE = 500;
const OVERLAP = 50;
const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIMS = 1024;

const VALID_STATUS = new Set(['draft', 'active', 'deprecated']);
const INGEST_STATUS = new Set(['active']);
const VALID_VISIBILITY = new Set(['shareable', 'internal', 'internal-restricted']);

// Knowledge files (by frontmatter id) that must ALWAYS be present in the system
// prompt, not left to similarity retrieval. These are the core positioning canon.
const ALWAYS_ON_KNOWLEDGE_IDS = new Set([
  'kb-two-layer-model',
  'kb-ppp-5c-plan',
  'kb-sb7-brandscript',
  'kb-differentiators',
  'kb-company-profile',
]);

// Persona files (digital twins) loaded in full when a request is explicitly in
// Bill's or Drew's voice.
const PERSONA_IDS: Record<string, 'bill' | 'drew'> = {
  'kb-bill-douglas-persona': 'bill',
  'kb-drew-hall-persona': 'drew',
};

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REINGEST = args.includes('--reingest');

function resolveBrainDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'brain'),
    path.resolve(process.cwd(), 'ow', 'brain'),
    path.resolve(__dirname, '..', 'brain'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'rules')) || fs.existsSync(path.join(c, 'knowledge'))) {
      return c;
    }
  }
  return candidates[0];
}

function resolveGeneratedPath(brainDir: string): string {
  // ow/lib/brain-canon.generated.ts (brainDir is ow/brain)
  return path.resolve(brainDir, '..', 'lib', 'brain-canon.generated.ts');
}

const BRAIN_DIR = resolveBrainDir();
const CANONICAL_DIRS = ['rules', 'knowledge', 'decisions'];

interface BrainDoc {
  id: string;
  title: string;
  type: string; // rule | knowledge | decision
  status: string;
  visibility: string;
  updated: string;
  tags: string[];
  relPath: string;
  absPath: string;
  body: string;
}

/**
 * Minimal frontmatter parser matching the Brain's flat schema (mirrors
 * scripts/common.py in the source repo). Not a general YAML parser on purpose.
 */
function parseFrontmatter(text: string): { meta: Record<string, string | string[]>; body: string } {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(text);
  if (!m) return { meta: {}, body: text.trim() };
  const rawMeta = m[1];
  const body = m[2];
  const meta: Record<string, string | string[]> = {};
  for (const lineRaw of rawMeta.split('\n')) {
    const line = lineRaw.replace(/\s+$/, '');
    if (!line || line.trimStart().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      meta[key] = inner
        ? inner.split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
        : [];
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return { meta, body: body.trim() };
}

function str(v: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(v)) return v.join(', ');
  return v ?? fallback;
}

function readBrainDocs(): BrainDoc[] {
  const docs: BrainDoc[] = [];
  for (const folder of CANONICAL_DIRS) {
    const dir = path.join(BRAIN_DIR, folder);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith('.md')) continue;
      const absPath = path.join(dir, file);
      const text = fs.readFileSync(absPath, 'utf-8');
      const { meta, body } = parseFrontmatter(text);
      const visibility = str(meta.visibility, 'internal');
      docs.push({
        id: str(meta.id) || `${folder}-${file.replace(/\.md$/, '')}`,
        title: str(meta.title) || file.replace(/\.md$/, ''),
        type: str(meta.type) || (folder === 'rules' ? 'rule' : folder === 'decisions' ? 'decision' : 'knowledge'),
        status: str(meta.status, 'draft'),
        visibility: VALID_VISIBILITY.has(visibility) ? visibility : 'internal',
        updated: str(meta.updated),
        tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [String(meta.tags)] : [],
        relPath: path.join(folder, file),
        absPath,
        body,
      });
    }
  }
  return docs;
}

function categoryFor(type: string): string {
  if (type === 'rule') return 'Brain — Rule';
  if (type === 'decision') return 'Brain — Decision';
  return 'Brain — Knowledge';
}

function chunkText(text: string, size = CHUNK_SIZE, overlap = OVERLAP) {
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

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Build and write ow/lib/brain-canon.generated.ts. Pure function of the active
 * docs — safe to run in --dry-run.
 */
function generateCanonModule(active: BrainDoc[]): { rulesPackLen: number; personaCount: number } {
  const rules = active
    .filter((d) => d.type === 'rule')
    .sort((a, b) => a.id.localeCompare(b.id));
  const alwaysOnKnowledge = active
    .filter((d) => d.type === 'knowledge' && ALWAYS_ON_KNOWLEDGE_IDS.has(d.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  const parts: string[] = [];
  parts.push('# OWnet Brain — Always-On Canon');
  parts.push(
    'The following rules and positioning are NON-NEGOTIABLE and apply to every response. ' +
      'When sources conflict, the Brain wins (see source-authority).'
  );

  parts.push('\n## Positioning canon (always present)');
  for (const d of alwaysOnKnowledge) {
    parts.push(`\n### ${d.title}\n${d.body}`);
  }

  parts.push('\n## Behavioral rules (always enforced)');
  for (const d of rules) {
    parts.push(`\n### ${d.title}\n${d.body}`);
  }

  const rulesPack = parts.join('\n');

  const personas: Record<string, { title: string; body: string }> = {};
  for (const d of active) {
    const who = PERSONA_IDS[d.id];
    if (who) personas[who] = { title: d.title, body: d.body };
  }

  const generatedAt = new Date().toISOString();
  const ruleIds = rules.map((r) => r.id);
  const knowledgeIds = alwaysOnKnowledge.map((k) => k.id);

  const out = `/**
 * AUTO-GENERATED by scripts/ingest-brain.ts — DO NOT EDIT BY HAND.
 *
 * Regenerate after editing ow/brain/ canon:
 *   cd ow && npx tsx scripts/ingest-brain.ts
 *
 * Source of truth: ow/brain/{rules,knowledge,decisions}
 * Generated: ${generatedAt}
 */

/** Always-on canon: every active rule + must-always-present positioning. */
export const RULES_PACK: string = ${JSON.stringify(rulesPack)};

/** Full digital-twin personas, loaded when a request is explicitly in this voice. */
export const PERSONAS: Record<'bill' | 'drew', string> = {
  bill: ${JSON.stringify(personas.bill ? personas.bill.body : '')},
  drew: ${JSON.stringify(personas.drew ? personas.drew.body : '')},
};

export const BRAIN_CANON_META = {
  generatedAt: ${JSON.stringify(generatedAt)},
  ruleIds: ${JSON.stringify(ruleIds)},
  alwaysOnKnowledgeIds: ${JSON.stringify(knowledgeIds)},
  hasBillPersona: ${personas.bill ? 'true' : 'false'},
  hasDrewPersona: ${personas.drew ? 'true' : 'false'},
};
`;

  const target = resolveGeneratedPath(BRAIN_DIR);
  fs.writeFileSync(target, out, 'utf-8');
  console.log(`  wrote ${path.relative(process.cwd(), target)} (rules pack ${rulesPack.length} chars)`);
  return { rulesPackLen: rulesPack.length, personaCount: Object.keys(personas).length };
}

async function main() {
  console.log('Ingest OWnet Brain');
  console.log('='.repeat(60));
  console.log(`Brain dir: ${BRAIN_DIR}`);
  console.log(`Mode:      ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE'}${REINGEST ? ' + REINGEST' : ''}`);
  console.log('');

  if (!fs.existsSync(BRAIN_DIR)) {
    console.error(`Brain folder not found: ${BRAIN_DIR}`);
    process.exit(1);
  }

  const all = readBrainDocs();
  // Surface any frontmatter issues without silently dropping.
  for (const d of all) {
    if (!VALID_STATUS.has(d.status)) {
      console.warn(`  WARN: ${d.relPath} has unknown status "${d.status}" — treated as non-active.`);
    }
  }
  const active = all.filter((d) => INGEST_STATUS.has(d.status));
  const skipped = all.filter((d) => !INGEST_STATUS.has(d.status));

  console.log(`Found ${all.length} files; ${active.length} active, ${skipped.length} excluded (draft/deprecated).`);
  const byCat: Record<string, number> = {};
  for (const d of active) byCat[categoryFor(d.type)] = (byCat[categoryFor(d.type)] || 0) + 1;
  for (const [cat, n] of Object.entries(byCat).sort()) console.log(`  ${cat.padEnd(20)} ${n}`);
  const restricted = active.filter((d) => d.visibility === 'internal-restricted');
  if (restricted.length) {
    console.log(`  internal-restricted (principals only): ${restricted.map((d) => d.relPath).join(', ')}`);
  }
  console.log('');

  // Always regenerate the canon module (deterministic; safe in dry-run).
  console.log('Regenerating canon module...');
  const canon = generateCanonModule(active);
  console.log(`  rules pack: ${canon.rulesPackLen} chars; personas: ${canon.personaCount}`);
  console.log('');

  if (DRY_RUN) {
    console.log('Dry-run plan (RAG docs that WOULD be written):');
    for (const d of active) {
      console.log(`  [${d.visibility}] ${categoryFor(d.type)} :: ${d.id} :: ${d.relPath}`);
    }
    if (skipped.length) {
      console.log('\nExcluded (status not active):');
      for (const d of skipped) console.log(`  (${d.status}) ${d.relPath}`);
    }
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set — cannot write RAG docs. (Canon module was still regenerated.)');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async function embed(text: string): Promise<number[]> {
    const r = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: text.slice(0, 8000),
      dimensions: EMBED_DIMS,
    });
    return r.data[0].embedding;
  }

  if (REINGEST) {
    console.log('Reingest: deleting existing "Brain — *" KnowledgeDocuments…');
    const del = await pool.query(
      `DELETE FROM "KnowledgeDocument" WHERE category LIKE 'Brain — %' RETURNING id`
    );
    console.log(`  deleted ${del.rowCount} brain docs (chunks cascade).\n`);
  }

  let docsCreated = 0;
  let docsSkipped = 0;
  let chunksCreated = 0;
  const errors: { file: string; error: string }[] = [];

  for (const d of active) {
    try {
      const category = categoryFor(d.type);
      const content = d.body;

      if (!content || content.trim().length < 20) {
        console.log(`  SKIP (too short): ${d.relPath}`);
        docsSkipped++;
        continue;
      }

      // Idempotent on (category, fileName): skip if unchanged.
      const existing = await pool.query(
        `SELECT id, length("content") AS len FROM "KnowledgeDocument"
         WHERE category = $1 AND "fileName" = $2 LIMIT 1`,
        [category, d.relPath]
      );
      if (existing.rows.length > 0 && Math.abs(Number(existing.rows[0].len) - content.length) < 5) {
        // Keep visibility in sync even when content is unchanged.
        await pool.query(`UPDATE "KnowledgeDocument" SET visibility = $1, "updatedAt" = NOW() WHERE id = $2`, [
          d.visibility,
          existing.rows[0].id,
        ]);
        console.log(`  EXISTS: ${d.relPath}`);
        docsSkipped++;
        continue;
      }
      if (existing.rows.length > 0) {
        await pool.query(`DELETE FROM "KnowledgeDocument" WHERE id = $1`, [existing.rows[0].id]);
      }

      const docId = newId('kd');
      const comment = `[Brain id: ${d.id}] [type: ${d.type}] [updated: ${d.updated}]${
        d.tags.length ? ` [tags: ${d.tags.join(', ')}]` : ''
      }`;
      const fileData = Buffer.from(content, 'utf-8').toString('base64');

      await pool.query(
        `INSERT INTO "KnowledgeDocument"
          (id, name, "fileName", "mimeType", "fileSize", "fileData", content, comment,
           category, visibility, "uploadedBy", vectorized, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, NOW(), NOW())`,
        [
          docId,
          d.title,
          d.relPath,
          'text/markdown',
          Buffer.byteLength(content, 'utf-8'),
          fileData,
          content,
          comment,
          category,
          d.visibility,
          'system-brain-ingest',
        ]
      );

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

      await pool.query(`UPDATE "KnowledgeDocument" SET vectorized = $1, "updatedAt" = NOW() WHERE id = $2`, [
        written > 0,
        docId,
      ]);

      docsCreated++;
      chunksCreated += written;
      console.log(`  + [${d.visibility}] ${category} :: ${d.relPath} (${written} chunks)`);
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`  X ${d.relPath}: ${msg}`);
      errors.push({ file: d.relPath, error: msg });
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
