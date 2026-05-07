/**
 * Ingest Voice Exemplars
 *
 * Reads the published .docx blog packages from the OW Blog folder of the
 * OpticWise Content Engine project and breaks each into the three
 * deliverables that ship every week:
 *   1) Blog post (with all CMS fields)
 *   2) LinkedIn Article
 *   3) LinkedIn Short Post
 *
 * Each deliverable is embedded and inserted into the StyleGuide table with
 * metadata that the OWnet agent (and the Content Engine mode) will use to
 * retrieve top-K stylistically aligned exemplars at generation time.
 *
 * Usage:
 *   cd ow
 *   npx tsx scripts/ingest-voice-exemplars.ts [--dry-run] [--reingest]
 *
 * Source path can be overridden with VOICE_EXEMPLAR_PATH.
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

const DEFAULT_PATH =
  '/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/Claude CoWork Projects/OpticWise Content Engine/OW Blog in Claude folder';
const SOURCE_PATH = process.env.VOICE_EXEMPLAR_PATH || DEFAULT_PATH;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REINGEST = args.includes('--reingest');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ParsedExemplar {
  filePath: string;
  fileName: string;
  weekDate: string;
  author: 'Bill' | 'Drew' | 'Mixed';
  themeSlug: string;
  isSupplemental: boolean;
  blog?: {
    title?: string;
    slug?: string;
    excerpt?: string;
    body?: string;
    readingTime?: string;
    category?: string;
    tags?: string;
    seoTitle?: string;
    seoDescription?: string;
    featureImagePrompt?: string;
    ogImagePrompt?: string;
  };
  linkedinArticle?: { title?: string; body: string };
  linkedinShort?: { body: string };
}

function detectAuthor(fileName: string, content: string): 'Bill' | 'Drew' | 'Mixed' {
  const lower = fileName.toLowerCase();
  if (lower.includes('drew')) return 'Drew';
  // Drew supplementals are explicitly tagged "_drew-supplemental"
  if (lower.includes('_supplemental') && !lower.includes('drew')) return 'Bill';
  // Heuristic on body: if "Drew Hall" is named more than "Bill Douglas" by a meaningful margin
  const drewCount = (content.match(/Drew\s+Hall/gi) || []).length;
  const billCount = (content.match(/Bill\s+Douglas/gi) || []).length;
  if (drewCount > billCount + 1) return 'Drew';
  if (billCount > drewCount + 1) return 'Bill';
  return 'Bill'; // default — Bill is the primary author
}

function detectWeekDate(filePath: string, fileName: string): string {
  const m =
    filePath.match(/(\d{4}-\d{2}-\d{2})/) ||
    fileName.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : 'unknown';
}

function detectSlug(fileName: string): string {
  const base = fileName.replace(/\.docx$/i, '');
  const m = base.match(/^\d{4}-\d{2}-\d{2}-(.+?)(?:_supplemental)?$/);
  return m ? m[1] : base;
}

/**
 * Parse a docx body that follows the Content Engine doc shape:
 *   2026-05-06 — <slug>
 *   <tab name>
 *   TITLE: ...
 *   SLUG: ...
 *   EXCERPT: ...
 *   READING TIME: ...
 *   PUBLISHED AT: ...
 *   CATEGORY: ...
 *   TAGS: ...
 *   SEO TITLE: ...
 *   SEO DESCRIPTION: ...
 *   FEATURE IMAGE PROMPT
 *   ...
 *   OG IMAGE PROMPT
 *   ...
 *   CONTENT
 *   ...long body...
 *   <next tab: LinkedIn Article — title + body>
 *   <next tab: LinkedIn Post — body>
 */
function parseBody(text: string): {
  blog: ParsedExemplar['blog'];
  linkedinArticle?: ParsedExemplar['linkedinArticle'];
  linkedinShort?: ParsedExemplar['linkedinShort'];
} {
  const cleaned = text.replace(/\r\n/g, '\n');
  const blog: NonNullable<ParsedExemplar['blog']> = {};

  const grab = (label: string, multiline = false) => {
    const safeLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (multiline) {
      const re = new RegExp(`${safeLabel}\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z ]+\\s*\\n|\\n[A-Z][A-Z ]+:|$)`, 'i');
      const m = cleaned.match(re);
      return m ? m[1].trim() : undefined;
    }
    const re = new RegExp(`${safeLabel}:\\s*([^\\n]+)`, 'i');
    const m = cleaned.match(re);
    return m ? m[1].trim() : undefined;
  };

  blog.title = grab('TITLE');
  blog.slug = grab('SLUG');
  blog.excerpt = grab('EXCERPT');
  blog.readingTime = grab('READING TIME');
  blog.category = grab('CATEGORY');
  blog.tags = grab('TAGS');
  blog.seoTitle = grab('SEO TITLE');
  blog.seoDescription = grab('SEO DESCRIPTION');
  blog.featureImagePrompt = grab('FEATURE IMAGE PROMPT', true);
  blog.ogImagePrompt = grab('OG IMAGE PROMPT', true);

  // CONTENT (blog body) — runs until "LinkedIn Article" or end-of-doc.
  // Be tolerant of trailing whitespace and the various tab markers Drive
  // doc tabs leave behind in the docx text stream.
  const contentMatch = cleaned.match(
    /\bCONTENT\s*\n([\s\S]*?)(?=\n\s*LinkedIn Article\b|\n\s*LinkedIn Post\b|\n\s*Linked\s*In Article\b|$)/i
  );
  if (contentMatch) blog.body = contentMatch[1].trim();

  // LinkedIn Article — runs until "LinkedIn Post" or end-of-doc.
  const liArticleMatch = cleaned.match(
    /\bLinkedIn Article\b\s*\n([\s\S]*?)(?=\n\s*LinkedIn Post\b|\n\s*Linked\s*In Post\b|$)/i
  );
  let linkedinArticle: ParsedExemplar['linkedinArticle'] | undefined;
  if (liArticleMatch) {
    const liBody = liArticleMatch[1].trim();
    const titleMatch = liBody.match(/^TITLE:\s*([^\n]+)\n([\s\S]*)$/i);
    if (titleMatch) {
      linkedinArticle = { title: titleMatch[1].trim(), body: titleMatch[2].trim() };
    } else {
      // First line is often the title even without a label.
      const lines = liBody.split('\n');
      const firstLine = lines[0]?.trim();
      const rest = lines.slice(1).join('\n').trim();
      if (firstLine && firstLine.length < 140) {
        linkedinArticle = { title: firstLine, body: rest || liBody };
      } else {
        linkedinArticle = { body: liBody };
      }
    }
  }

  // LinkedIn Post (short)
  const liPostMatch = cleaned.match(/\bLinkedIn Post\b\s*\n([\s\S]+?)$/i);
  const linkedinShort = liPostMatch ? { body: liPostMatch[1].trim() } : undefined;

  return { blog, linkedinArticle, linkedinShort };
}

async function readDocx(absPath: string): Promise<string> {
  const buffer = fs.readFileSync(absPath);
  const result = await mammoth.extractRawText({ buffer });
  return String(result.value || '').trim();
}

function walkDocx(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkDocx(full, out);
    else if (e.isFile() && e.name.toLowerCase().endsWith('.docx')) out.push(full);
  }
  return out;
}

async function embed(text: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.slice(0, 8000),
    dimensions: 1024,
  });
  return r.data[0].embedding;
}

function newId() {
  return `se_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function main() {
  console.log('Ingest Voice Exemplars');
  console.log('='.repeat(60));
  console.log(`Source: ${SOURCE_PATH}`);
  console.log(`Mode:   ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${REINGEST ? ' + REINGEST' : ''}\n`);

  const files = walkDocx(SOURCE_PATH);
  console.log(`Found ${files.length} .docx files.\n`);

  const parsed: ParsedExemplar[] = [];

  for (const fp of files) {
    const fileName = path.basename(fp);
    // Skip the all-week summary docs and content summaries — we want
    // single-theme blog packages, not aggregators.
    if (
      fileName.includes('weekly-intelligence-briefing') ||
      fileName.includes('content-summary') ||
      fileName.includes('completion-email')
    )
      continue;

    try {
      const text = await readDocx(fp);
      const { blog, linkedinArticle, linkedinShort } = parseBody(text);
      if (!blog || !blog.body || blog.body.length < 200) {
        console.log(`  SKIP (no blog body): ${path.basename(fp)}`);
        continue;
      }
      parsed.push({
        filePath: fp,
        fileName,
        weekDate: detectWeekDate(fp, fileName),
        author: detectAuthor(fileName, text),
        themeSlug: detectSlug(fileName),
        isSupplemental: fileName.toLowerCase().includes('_supplemental'),
        blog,
        linkedinArticle,
        linkedinShort,
      });
      console.log(
        `  + ${detectWeekDate(fp, fileName)} ${detectAuthor(fileName, text).padEnd(5)} ${detectSlug(fileName)}`
      );
    } catch (err) {
      console.error(`  X ${path.basename(fp)}: ${(err as Error).message}`);
    }
  }

  console.log(`\nParsed ${parsed.length} blog packages.\n`);

  if (DRY_RUN) {
    for (const p of parsed) {
      console.log(`--- ${p.fileName}`);
      console.log(`    title:   ${p.blog?.title ?? '(missing)'}`);
      console.log(`    slug:    ${p.blog?.slug ?? '(missing)'}`);
      console.log(`    body:    ${p.blog?.body ? `${p.blog.body.length} chars` : '(missing)'}`);
      console.log(`    li art:  ${p.linkedinArticle ? `${p.linkedinArticle.body.length} chars` : '(none)'}`);
      console.log(`    li short:${p.linkedinShort ? `${p.linkedinShort.body.length} chars` : '(none)'}`);
    }
    await pool.end();
    return;
  }

  if (REINGEST) {
    const del = await pool.query(
      `DELETE FROM "StyleGuide" WHERE category = 'voice_exemplar' RETURNING id`
    );
    console.log(`Deleted ${del.rowCount} existing voice_exemplar rows.\n`);
  }

  let inserted = 0;
  for (const p of parsed) {
    const insertOne = async (
      subcategory: 'blog' | 'linkedin_article' | 'linkedin_short',
      content: string,
      extra: Record<string, unknown> = {}
    ) => {
      if (!content || content.length < 100) return;
      try {
        const vec = await embed(content);
        const metadata = {
          weekDate: p.weekDate,
          themeSlug: p.themeSlug,
          isSupplemental: p.isSupplemental,
          fileName: p.fileName,
          ...extra,
        };
        await pool.query(
          `INSERT INTO "StyleGuide"
            (id, category, subcategory, content, tone, author, context,
             embedding, vectorized, metadata, "createdAt", "updatedAt")
           VALUES ($1, 'voice_exemplar', $2, $3, $4, $5, $6, $7::vector, true, $8, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [
            newId(),
            subcategory,
            content,
            'opticwise',
            p.author,
            `Published ${subcategory.replace('_', ' ')} from ${p.weekDate} — ${p.themeSlug}`,
            `[${vec.join(',')}]`,
            JSON.stringify(metadata),
          ]
        );
        inserted++;
      } catch (err) {
        console.error(`    insert failed (${subcategory}, ${p.themeSlug}): ${(err as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 30));
    };

    if (p.blog?.body) {
      const fullBlog =
        `TITLE: ${p.blog.title ?? ''}\n` +
        `EXCERPT: ${p.blog.excerpt ?? ''}\n` +
        `CATEGORY: ${p.blog.category ?? ''}\n` +
        `TAGS: ${p.blog.tags ?? ''}\n\n` +
        p.blog.body;
      await insertOne('blog', fullBlog, {
        title: p.blog.title,
        excerpt: p.blog.excerpt,
        category: p.blog.category,
        tags: p.blog.tags,
        seoTitle: p.blog.seoTitle,
        seoDescription: p.blog.seoDescription,
      });
    }
    if (p.linkedinArticle?.body) {
      const text =
        (p.linkedinArticle.title ? `TITLE: ${p.linkedinArticle.title}\n\n` : '') + p.linkedinArticle.body;
      await insertOne('linkedin_article', text, { title: p.linkedinArticle.title });
    }
    if (p.linkedinShort?.body) {
      await insertOne('linkedin_short', p.linkedinShort.body);
    }
  }

  console.log(`\nInserted ${inserted} StyleGuide rows.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
