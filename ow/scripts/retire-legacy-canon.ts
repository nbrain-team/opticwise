/**
 * Retire legacy Drive "Canon — *" docs that the OWnet Brain now supersedes.
 *
 * The Brain (ow/brain/, ingested via scripts/ingest-brain.ts as "Brain — *") is
 * the single source of truth for positioning and voice. The older Drive-ingested
 * "Canon — *" KnowledgeDocuments overlap with it and can surface stale framing
 * (e.g. superseded CaaS-as-headline language — see ow/brain/rules/source-authority.md).
 *
 * This script removes ONLY the overlapping positioning/voice categories. It
 * preserves the richer non-overlapping material:
 *   - "Canon — PPP Book"        (full manuscript; deeper than the Brain reference)
 *   - "Canon — Voice Exemplar"  (published blog packages used as style exemplars)
 *   - "Canon — Content Backlog", "Canon — Drive Bridge", "Canon — Reference"
 *
 * Published voice exemplars in the StyleGuide table are NOT touched by this script.
 *
 * SAFE BY DEFAULT: dry-run unless you pass --apply.
 *
 * Usage:
 *   cd ow
 *   npx tsx scripts/retire-legacy-canon.ts            # dry-run (shows counts)
 *   npx tsx scripts/retire-legacy-canon.ts --apply    # actually delete
 */

import { Pool } from 'pg';

// Overlapping categories the Brain now owns. Anything not listed here is kept.
const RETIRE_CATEGORIES = [
  'Canon — BrandScript SB7',
  'Canon — Audience Lens',
  'Canon — Sales Playbook',
  'Canon — Voice Patterns',
  'Canon — BrandScript Exemplars',
  'Canon — Author Voice',
  'Canon — Content Engine Workflow',
];

const APPLY = process.argv.slice(2).includes('--apply');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set.');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log('Retire legacy "Canon — *" docs superseded by the OWnet Brain');
  console.log('='.repeat(64));
  console.log(`Mode: ${APPLY ? 'APPLY (will delete)' : 'DRY RUN (no writes)'}\n`);

  // Show the full Canon landscape so the operator sees what is kept vs retired.
  const landscape = await pool.query(
    `SELECT category, COUNT(*)::int AS docs
       FROM "KnowledgeDocument"
      WHERE category LIKE 'Canon — %'
      GROUP BY category
      ORDER BY category`
  );
  if (landscape.rows.length === 0) {
    console.log('No "Canon — *" documents found. Nothing to do.');
    await pool.end();
    return;
  }

  console.log('Current "Canon — *" categories:');
  for (const r of landscape.rows) {
    const mark = RETIRE_CATEGORIES.includes(r.category) ? 'RETIRE' : 'keep  ';
    console.log(`  [${mark}] ${String(r.category).padEnd(34)} ${r.docs} docs`);
  }
  console.log('');

  const target = await pool.query(
    `SELECT COUNT(*)::int AS docs
       FROM "KnowledgeDocument"
      WHERE category = ANY($1::text[])`,
    [RETIRE_CATEGORIES]
  );
  const docCount = target.rows[0]?.docs ?? 0;
  console.log(`Documents matching retire list: ${docCount} (chunks cascade on delete).`);

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to delete the RETIRE categories.');
    await pool.end();
    return;
  }

  const del = await pool.query(
    `DELETE FROM "KnowledgeDocument" WHERE category = ANY($1::text[]) RETURNING id`,
    [RETIRE_CATEGORIES]
  );
  console.log(`\nDeleted ${del.rowCount} legacy canon docs. The Brain ("Brain — *") is now authoritative.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
