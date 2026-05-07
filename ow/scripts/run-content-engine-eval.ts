/**
 * Run Content Engine Evaluation
 *
 * For each eval case under ow/data/content-engine-eval/, this script:
 *   1. Reconstructs the trend (title, argument, moat, sources) and treats it
 *      as if it were already-selected — so the planner step is skipped.
 *   2. Regenerates the author package using the same prompt + voice
 *      exemplar pipeline the live Content Engine would use.
 *   3. Scores both the GOLD published piece AND the GENERATED piece against
 *      the May 2026 canon (`scoreCanonAdherence`).
 *   4. Writes a markdown report comparing scores side by side.
 *
 * This gives a regression baseline: future prompt changes can be tested
 * against the same eval set without the variability of the planner step.
 *
 * Usage:
 *   cd ow
 *   npx tsx scripts/run-content-engine-eval.ts [--limit=N] [--cases=glob] [--no-generate]
 *
 * --no-generate scores ONLY the gold published outputs (sanity check on the
 *   scorer itself) and skips LLM calls.
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Pool } from 'pg';
import { generateBrandScriptPrompt } from '../lib/brandscript-prompt';
import { enforceBrandVoice, scoreCanonAdherence } from '../lib/brandscript-voice-enforcement';
import { getVoiceExemplars, formatVoiceExemplars } from '../lib/ai-agent-utils';

const ROOT = path.resolve(__dirname, '..');
const EVAL_DIR = path.join(ROOT, 'data', 'content-engine-eval');
const OUT_DIR = path.join(ROOT, 'data', 'content-engine-eval', 'runs');

const args = process.argv.slice(2);
const limitArg = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0', 10);
const noGenerate = args.includes('--no-generate');
const casesArg = args.find((a) => a.startsWith('--cases='))?.split('=')[1];

const ANTHROPIC_MODEL = process.env.CONTENT_ENGINE_MODEL || 'claude-sonnet-4-5-20250929';

interface EvalCase {
  weekDate: string;
  slug: string;
  author: 'Bill' | 'Drew';
  isSupplemental: boolean;
  input: {
    trend: {
      title: string;
      argument: string;
      moat: string;
      author: 'Bill' | 'Drew';
      sources: Array<{ title: string; url?: string; sender?: string }>;
    };
  };
  gold: {
    blog: { title: string; slug: string; excerpt: string; body: string; tags?: string[] };
    linkedinArticle?: { title?: string; body: string };
    linkedinShort?: { body: string };
  };
}

async function generatePackage(
  c: EvalCase,
  anthropic: Anthropic,
  openai: OpenAI,
  db: Pool
): Promise<{ blogBody: string; articleBody: string; shortBody: string }> {
  const t = c.input.trend;

  const blogExemplars = await getVoiceExemplars(
    `${t.title}. ${t.argument}`,
    db,
    openai,
    { topK: 2, subcategory: 'blog', author: t.author }
  );
  const articleExemplars = await getVoiceExemplars(
    `${t.title}. ${t.argument}`,
    db,
    openai,
    { topK: 1, subcategory: 'linkedin_article', author: t.author }
  );
  const shortExemplars = await getVoiceExemplars(
    `${t.title}. ${t.argument}`,
    db,
    openai,
    { topK: 1, subcategory: 'linkedin_short', author: t.author }
  );
  const exemplarBlock =
    formatVoiceExemplars(blogExemplars, 2400) +
    formatVoiceExemplars(articleExemplars, 1800) +
    formatVoiceExemplars(shortExemplars, 1200);

  const systemPrompt = generateBrandScriptPrompt({
    currentDate: new Date(c.weekDate),
    author: t.author === 'Drew' ? 'drew' : 'bill',
    audience: 'asset_manager',
    contentEngineMode: true,
    includeStyleContext: exemplarBlock,
  });

  const sourcesBlock = t.sources
    .map((s) => `- ${s.title}${s.url ? ` — ${s.url}` : ''}`)
    .join('\n');

  const userPrompt = `Reproduce ${t.author}'s author package for the trend below. Match the canonical voice and structure.

TREND: ${t.title}
MOAT: ${t.moat}
ARGUMENT: ${t.argument}

SOURCES:
${sourcesBlock || '(no inline source URLs were extracted; rely on the argument and standing market context)'}

Return JSON ONLY (no markdown fences) with this shape:
{
  "blogBody": "900-1300 words, plain text paragraphs separated by \\n\\n. ALL-CAPS subheads on their own line if needed. Open sharp; close with the canonical signoff.",
  "articleBody": "500-800 words, LinkedIn article voice for ${t.author}. Distinct angle from the blog.",
  "shortBody": "100-230 word LinkedIn short post. Hook in line one. End with hashtags."
}

Non-negotiables: 'data & digital infrastructure' (never bare 'infrastructure'); no ESG / leverage / synergy / ecosystem / holistic / seamless / cutting-edge; first-use trademarks on Property Brain™, Portfolio Brain™, PPP 5C™, BoT®, ElasticISP®, 5S®, SIC®, PPP Audit™, Peak Property Performance®.`;

  const resp = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 6000,
    temperature: 0.55,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const raw = resp.content
    .filter((c2) => c2.type === 'text')
    .map((c2) => (c2 as { type: 'text'; text: string }).text)
    .join('\n')
    .trim();
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(jsonText) as {
    blogBody: string;
    articleBody: string;
    shortBody: string;
  };

  return {
    blogBody: enforceBrandVoice(parsed.blogBody),
    articleBody: enforceBrandVoice(parsed.articleBody),
    shortBody: enforceBrandVoice(parsed.shortBody),
  };
}

interface CaseResult {
  weekDate: string;
  slug: string;
  author: string;
  isSupplemental: boolean;
  goldScore: number;
  goldFailures: string[];
  generatedScore?: number;
  generatedFailures?: string[];
  delta?: number; // generated - gold
  generated?: { blogBody: string; articleBody: string; shortBody: string };
  error?: string;
}

async function main() {
  console.log('Run Content Engine Eval');
  console.log('='.repeat(60));

  if (!fs.existsSync(EVAL_DIR)) {
    console.error(`Eval dir not found: ${EVAL_DIR}`);
    console.error('Run `npx tsx scripts/build-content-eval-set.ts` first.');
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let caseFiles = fs
    .readdirSync(EVAL_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
    .filter((f) => !casesArg || f.includes(casesArg));
  caseFiles.sort();
  if (limitArg > 0) caseFiles = caseFiles.slice(0, limitArg);

  console.log(`Cases: ${caseFiles.length}${noGenerate ? ' (no-generate mode)' : ''}\n`);

  const anthropic = noGenerate
    ? null
    : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const openai = noGenerate ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const db = noGenerate
    ? null
    : new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      });

  const results: CaseResult[] = [];
  for (const file of caseFiles) {
    const c = JSON.parse(fs.readFileSync(path.join(EVAL_DIR, file), 'utf-8')) as EvalCase;
    const goldReport = scoreCanonAdherence(c.gold.blog.body);
    const result: CaseResult = {
      weekDate: c.weekDate,
      slug: c.slug,
      author: c.author,
      isSupplemental: c.isSupplemental,
      goldScore: goldReport.score,
      goldFailures: goldReport.failures,
    };

    if (!noGenerate && anthropic && openai && db) {
      try {
        const gen = await generatePackage(c, anthropic, openai, db);
        const genReport = scoreCanonAdherence(gen.blogBody);
        result.generatedScore = genReport.score;
        result.generatedFailures = genReport.failures;
        result.delta = genReport.score - goldReport.score;
        result.generated = gen;
        // Write the generated artifact alongside the run for inspection.
        fs.writeFileSync(
          path.join(OUT_DIR, file.replace(/\.json$/, '.generated.json')),
          JSON.stringify({ caseFile: file, generated: gen, score: genReport }, null, 2)
        );
      } catch (err) {
        result.error = (err as Error).message;
        console.error(`  X ${file}: ${result.error}`);
      }
    }

    results.push(result);
    const goldLabel = `gold=${result.goldScore}`;
    const genLabel = result.generatedScore !== undefined ? ` gen=${result.generatedScore} Δ=${result.delta! >= 0 ? '+' : ''}${result.delta}` : '';
    console.log(`  ${result.weekDate} ${result.author.padEnd(5)} ${result.slug.padEnd(60).slice(0, 60)}  ${goldLabel}${genLabel}`);
  }

  // Build markdown report
  const md: string[] = [];
  md.push(`# Content Engine Eval — ${new Date().toISOString().slice(0, 10)}`);
  md.push('');
  md.push(`Cases: ${results.length}${noGenerate ? ' (gold scoring only)' : ''}`);
  md.push('');
  const avgGold = results.reduce((s, r) => s + r.goldScore, 0) / Math.max(1, results.length);
  md.push(`Average gold canon score: **${avgGold.toFixed(1)}/100**`);
  if (!noGenerate) {
    const generated = results.filter((r) => r.generatedScore !== undefined);
    const avgGen = generated.reduce((s, r) => s + (r.generatedScore || 0), 0) / Math.max(1, generated.length);
    const avgDelta = generated.reduce((s, r) => s + (r.delta || 0), 0) / Math.max(1, generated.length);
    md.push(`Average generated canon score: **${avgGen.toFixed(1)}/100**`);
    md.push(`Average delta (generated − gold): **${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)}**`);
  }
  md.push('');
  md.push('| Date | Author | Slug | Gold | Gen | Δ | Top failures (gen) |');
  md.push('|---|---|---|---|---|---|---|');
  for (const r of results) {
    md.push(
      `| ${r.weekDate} | ${r.author} | ${r.slug} | ${r.goldScore} | ${
        r.generatedScore ?? '—'
      } | ${r.delta !== undefined ? (r.delta >= 0 ? '+' : '') + r.delta : '—'} | ${(r.generatedFailures || []).slice(0, 3).join(' · ')} |`
    );
  }
  md.push('');
  md.push('## Detailed gold failures (where the canon scorer flagged the published piece)');
  md.push('');
  for (const r of results) {
    if (r.goldFailures.length) {
      md.push(`- **${r.weekDate} ${r.author} — ${r.slug}**: ${r.goldFailures.join(' · ')}`);
    }
  }

  const reportPath = path.join(OUT_DIR, `eval-report-${new Date().toISOString().slice(0, 10)}.md`);
  fs.writeFileSync(reportPath, md.join('\n'), 'utf-8');
  console.log(`\nReport: ${reportPath}`);

  if (db) await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
