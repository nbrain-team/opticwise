/**
 * Build Content Engine Evaluation Set
 *
 * Reads the published .docx blog packages from the OW Blog folder of the
 * OpticWise Content Engine project, parses each into (input → gold output)
 * shape, and writes a JSON eval set the regression harness consumes.
 *
 * The "input" reconstructs what the Content Engine would have seen at
 * generation time — the trend title, the argument, the moat (inferred from
 * tags + tone), and a synthetic source list derived from the blog body's
 * inline references. The "gold output" is the published blog body plus the
 * LinkedIn article and short post.
 *
 * Output:
 *   ow/data/content-engine-eval/<weekDate>-<slug>.json
 *
 * Usage:
 *   cd ow
 *   npx tsx scripts/build-content-eval-set.ts [--out=<dir>]
 */

import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

const DEFAULT_SRC =
  '/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/Claude CoWork Projects/OpticWise Content Engine/OW Blog in Claude folder';
const SOURCE_PATH = process.env.VOICE_EXEMPLAR_PATH || DEFAULT_SRC;

const args = process.argv.slice(2);
const outArg = args.find((a) => a.startsWith('--out='))?.split('=')[1];
const OUT_DIR = path.resolve(outArg || path.join(__dirname, '..', 'data', 'content-engine-eval'));

interface EvalCase {
  weekDate: string;
  slug: string;
  author: 'Bill' | 'Drew';
  isSupplemental: boolean;
  /** Reconstructed inputs the Content Engine would have seen */
  input: {
    trend: {
      title: string;
      argument: string;
      moat: string;
      author: 'Bill' | 'Drew';
      sources: Array<{ title: string; url?: string; sender?: string }>;
    };
  };
  /** Published gold output extracted from the docx */
  gold: {
    blog: {
      title: string;
      slug: string;
      excerpt: string;
      body: string;
      readingTime?: string;
      category?: string;
      tags?: string[];
      seoTitle?: string;
      seoDescription?: string;
    };
    linkedinArticle?: { title?: string; body: string };
    linkedinShort?: { body: string };
  };
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

async function readDocx(absPath: string): Promise<string> {
  const buffer = fs.readFileSync(absPath);
  const result = await mammoth.extractRawText({ buffer });
  return String(result.value || '').trim();
}

function detectAuthor(fileName: string, content: string): 'Bill' | 'Drew' {
  const lower = fileName.toLowerCase();
  if (lower.includes('drew')) return 'Drew';
  const drewCount = (content.match(/Drew\s+Hall/gi) || []).length;
  const billCount = (content.match(/Bill\s+Douglas/gi) || []).length;
  if (drewCount > billCount + 1) return 'Drew';
  return 'Bill';
}

function detectWeekDate(filePath: string, fileName: string): string {
  const m = filePath.match(/(\d{4}-\d{2}-\d{2})/) || fileName.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : 'unknown';
}

function detectSlug(fileName: string): string {
  const base = fileName.replace(/\.docx$/i, '');
  const m = base.match(/^\d{4}-\d{2}-\d{2}-(.+?)(?:_supplemental)?$/);
  return m ? m[1] : base;
}

function inferMoat(tags: string[], body: string): string {
  const allText = (tags.join(' ') + ' ' + body).toLowerCase();
  if (/data ownership|clarify|collect|portable data|data plane/.test(allText)) return 'data';
  if (/workflow|coordinate|monthly play|weekly play|operating play/.test(allText)) return 'workflows';
  if (/orchestration|control plane|trust plane|governed|owner permission|llm-agnostic/.test(allText))
    return 'orchestration';
  if (/operating standard|portfolio standard|two-layer|repeatable across the portfolio/.test(allText))
    return 'operating-standard';
  return 'data';
}

function extractInlineUrls(body: string): Array<{ title: string; url: string }> {
  const re = /\(?(https?:\/\/[^\s)<>"]+)\)?/g;
  const urls: string[] = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    if (!urls.includes(m[1])) urls.push(m[1]);
  }
  return urls.slice(0, 8).map((u) => {
    const host = new URL(u).hostname.replace(/^www\./, '');
    return { title: host, url: u };
  });
}

function parseGold(text: string) {
  const cleaned = text.replace(/\r\n/g, '\n');

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

  const title = grab('TITLE') || '';
  const slug = grab('SLUG') || '';
  const excerpt = grab('EXCERPT') || '';
  const readingTime = grab('READING TIME');
  const category = grab('CATEGORY');
  const tagsRaw = grab('TAGS');
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const seoTitle = grab('SEO TITLE');
  const seoDescription = grab('SEO DESCRIPTION');

  const blogBody =
    cleaned
      .match(/\bCONTENT\s*\n([\s\S]*?)(?=\n\s*LinkedIn Article\b|\n\s*LinkedIn Post\b|$)/i)?.[1]
      ?.trim() || '';

  const liArticleSection =
    cleaned.match(/\bLinkedIn Article\b\s*\n([\s\S]*?)(?=\n\s*LinkedIn Post\b|$)/i)?.[1]?.trim() || '';
  let linkedinArticle: { title?: string; body: string } | undefined;
  if (liArticleSection) {
    const t = liArticleSection.match(/^TITLE:\s*([^\n]+)\n([\s\S]*)$/i);
    if (t) linkedinArticle = { title: t[1].trim(), body: t[2].trim() };
    else {
      const lines = liArticleSection.split('\n');
      const first = lines[0]?.trim();
      if (first && first.length < 140) {
        linkedinArticle = { title: first, body: lines.slice(1).join('\n').trim() };
      } else {
        linkedinArticle = { body: liArticleSection };
      }
    }
  }

  const liShortSection = cleaned.match(/\bLinkedIn Post\b\s*\n([\s\S]+?)$/i)?.[1]?.trim();
  const linkedinShort = liShortSection ? { body: liShortSection } : undefined;

  return {
    title,
    slug,
    excerpt,
    body: blogBody,
    readingTime,
    category,
    tags,
    seoTitle,
    seoDescription,
    linkedinArticle,
    linkedinShort,
  };
}

async function main() {
  console.log('Build Content Engine Eval Set');
  console.log('='.repeat(60));
  console.log(`Source: ${SOURCE_PATH}`);
  console.log(`Out:    ${OUT_DIR}\n`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = walkDocx(SOURCE_PATH);
  let written = 0;
  const indexLines: string[] = ['weekDate,author,slug,title,bodyLen,outFile'];

  for (const fp of files) {
    const fileName = path.basename(fp);
    if (
      fileName.includes('weekly-intelligence-briefing') ||
      fileName.includes('content-summary') ||
      fileName.includes('completion-email')
    )
      continue;

    try {
      const text = await readDocx(fp);
      const gold = parseGold(text);
      if (!gold.body || gold.body.length < 400) {
        console.log(`  SKIP (no body): ${fileName}`);
        continue;
      }

      const author = detectAuthor(fileName, text);
      const weekDate = detectWeekDate(fp, fileName);
      const slug = gold.slug || detectSlug(fileName);
      const moat = inferMoat(gold.tags || [], gold.body);
      const sources = extractInlineUrls(gold.body);

      // The "argument" the eval feeds back to the planner. We use the
      // excerpt as the argument seed because that's a publication-grade
      // distillation of the trend.
      const evalCase: EvalCase = {
        weekDate,
        slug,
        author,
        isSupplemental: fileName.toLowerCase().includes('_supplemental'),
        input: {
          trend: {
            title: gold.title,
            argument: gold.excerpt,
            moat,
            author,
            sources,
          },
        },
        gold: {
          blog: {
            title: gold.title,
            slug,
            excerpt: gold.excerpt,
            body: gold.body,
            readingTime: gold.readingTime,
            category: gold.category,
            tags: gold.tags,
            seoTitle: gold.seoTitle,
            seoDescription: gold.seoDescription,
          },
          linkedinArticle: gold.linkedinArticle,
          linkedinShort: gold.linkedinShort,
        },
      };

      const outFile = path.join(OUT_DIR, `${weekDate}-${author.toLowerCase()}-${slug}.json`);
      fs.writeFileSync(outFile, JSON.stringify(evalCase, null, 2), 'utf-8');
      written++;
      indexLines.push(`${weekDate},${author},${slug},"${gold.title.replace(/"/g, '""')}",${gold.body.length},${path.basename(outFile)}`);
      console.log(`  + ${weekDate} ${author.padEnd(5)} ${slug}`);
    } catch (err) {
      console.error(`  X ${fileName}: ${(err as Error).message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.csv'), indexLines.join('\n'), 'utf-8');
  console.log(`\nWrote ${written} eval cases to ${OUT_DIR}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
