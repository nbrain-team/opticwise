/**
 * OpticWise Content Engine — agent module
 *
 * Orchestrates the weekly content workflow described in
 * `OpticWise_Content_Engine_FINAL.md` (and `CLAUDE.md`):
 *
 *   1. Read inbox sources (Gmail label or pre-pulled emails)
 *   2. Identify two trends — one for Bill (strategy/markets/AI/capital),
 *      one for Drew (architecture/systems/OT) — using cross-signal synthesis
 *   3. For each author, produce three deliverables: blog post, LinkedIn
 *      article, LinkedIn short post
 *   4. Produce a Weekly Intelligence Briefing and a Content Summary
 *   5. Build the createFullWeek payload for the Drive Bridge
 *   6. (Optionally) POST to the Drive Bridge URL
 *
 * The orchestrator is intentionally separated from the API surface so it
 * can be invoked from a Next.js route, a CLI script, or the OWnet chat
 * agent itself.
 *
 * Live Gmail reading uses the existing `getGmailClient` from `lib/google.ts`.
 * Voice exemplars are pulled from `StyleGuide` (see `getVoiceExemplars`).
 * Canon retrieval (knowledge base) is intentionally NOT inlined here — the
 * static prompt + voice exemplars carry the canon for content generation.
 *
 * Drive Bridge URL is read from the `DRIVE_BRIDGE_URL` env var, falling
 * back to the URL documented in `CLAUDE.md`.
 */

import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import OpenAI from 'openai';
import { generateBrandScriptPrompt, BrandAuthor } from './brandscript-prompt';
import { enforceBrandVoice, injectReframingLineIfNeeded, scoreCanonAdherence } from './brandscript-voice-enforcement';
import { getVoiceExemplars, formatVoiceExemplars } from './ai-agent-utils';

const DEFAULT_DRIVE_BRIDGE_URL =
  'https://script.google.com/a/macros/opticwise.com/s/AKfycbz5LaijcBj7NGUGnw9Y4ZDc5CpegbEgs_k_Etlq9fKy6z4cF7Ario2qXpy7Qcc3bSyi/exec';

export type EditorialMoat = 'data' | 'workflows' | 'orchestration' | 'operating-standard';

export interface ContentEngineSource {
  subject: string;
  sender: string;
  snippet: string;
  body: string;
  url?: string; // primary URL extracted from email body if any
  receivedAt: string;
}

export interface ContentTrend {
  author: 'Bill' | 'Drew';
  title: string; // working title of the trend
  argument: string; // one paragraph: what the trend is and why it matters
  moat: EditorialMoat;
  sources: Array<{ title: string; url?: string; sender: string; quote?: string }>;
}

export interface BlogPackage {
  slug: string;
  moat: EditorialMoat;
  blog: {
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    readingTime: number;
    category: string;
    tags: string[];
    seoTitle: string;
    seoDescription: string;
    featureImagePrompt: string;
    ogImagePrompt: string;
  };
  linkedinArticle: { title: string; body: string };
  linkedinPost: { title: string; body: string };
  canonAdherence: { score: number; failures: string[] };
}

export interface ContentEngineResult {
  date: string; // YYYY-MM-DD
  trends: ContentTrend[];
  packages: BlogPackage[];
  briefing: { title: string; body: string };
  summary: { title: string; body: string };
  drivePayload: Record<string, unknown>;
  driveResult?: { ok: boolean; status?: number; body?: unknown; error?: string };
}

export interface ContentEngineOptions {
  date: string; // YYYY-MM-DD
  sources: ContentEngineSource[];
  /** Override moat focus (otherwise inferred). */
  preferredMoat?: EditorialMoat;
  /** If true, POST to Drive Bridge after generation. */
  postToDrive?: boolean;
  /** Override the Drive Bridge URL. */
  driveBridgeUrl?: string;
}

interface Deps {
  anthropic: Anthropic;
  openai: OpenAI;
  db: Pool;
}

const ANTHROPIC_MODEL = process.env.CONTENT_ENGINE_MODEL || 'claude-sonnet-4-5-20250929';

/**
 * Identify two trends — one for Bill, one for Drew — using Claude. Returns
 * structured JSON. Forces the response to fit the required schema by asking
 * for JSON only and parsing it.
 */
async function identifyTrends(
  sources: ContentEngineSource[],
  deps: Deps,
  preferredMoat?: EditorialMoat
): Promise<ContentTrend[]> {
  const sourceDigest = sources
    .slice(0, 60)
    .map(
      (s, i) =>
        `[${i + 1}] FROM: ${s.sender}\nDATE: ${s.receivedAt}\nSUBJECT: ${s.subject}\nURL: ${s.url || ''}\nSNIPPET: ${s.snippet}\nBODY: ${s.body.slice(0, 1800)}`
    )
    .join('\n\n---\n\n');

  const moatHint = preferredMoat
    ? `\nPreferred moat focus this week: ${preferredMoat}.`
    : '\nChoose the moat that best fits each trend (data, workflows, orchestration, or operating-standard).';

  const prompt = `You are the editorial planner for the OpticWise Content Engine. From the source emails below, identify exactly TWO trends to ship this week — one for Bill (strategy / markets / AI / capital) and one for Drew (architecture / systems / OT / security).

Eligibility rules (strict):
- Each trend must be supported by 3+ sources from the list below.
- Cross-signal synthesis is worth more than the most-covered single story (a security incident + an M&A note + a panel pointing to the same owner problem is a stronger trend than three articles on the same topic).
- A trend is NOT eligible if its entry point is already covered by 3+ mainstream CRE trade publications in the same framing.
- Map each trend to one of the four moats: data, workflows, orchestration, operating-standard.${moatHint}

Bill's lanes: capital markets, AI developments, regulatory shifts, M&A patterns, owner strategy, broader tech moves. Bill does NOT write about: architecture details, integration patterns, vendor benchmarking.

Drew's lanes: building systems vendor patterns, integration reality, resilience, OT/network security, AI infrastructure at the building level, standards bodies, OT governance, connectivity as mission-critical. Drew does NOT write capital markets commentary or market-level strategy.

SOURCES:

${sourceDigest}

Return JSON ONLY (no prose, no markdown fences) matching this exact shape:

{
  "trends": [
    {
      "author": "Bill",
      "title": "working title — short",
      "argument": "one paragraph (3-5 sentences) describing the trend and why it matters to a CRE asset manager",
      "moat": "data|workflows|orchestration|operating-standard",
      "sources": [
        { "title": "subject or working title", "url": "https://...", "sender": "newsletter or person", "quote": "optional 1-line verbatim quote" }
      ]
    },
    {
      "author": "Drew",
      "title": "...",
      "argument": "...",
      "moat": "...",
      "sources": [...]
    }
  ]
}`;

  const resp = await deps.anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 3000,
    temperature: 0.4,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = resp.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('\n')
    .trim();

  // Strip any accidental fences
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(jsonText) as { trends: ContentTrend[] };
  if (!parsed?.trends?.length) {
    throw new Error('Trend planner returned no trends');
  }
  return parsed.trends;
}

/**
 * Generate a single author package (blog + LinkedIn article + LinkedIn short)
 * for the given trend, applying the May 2026 brand canon and injecting
 * voice exemplars.
 */
async function generateAuthorPackage(
  trend: ContentTrend,
  deps: Deps
): Promise<BlogPackage> {
  // Pull voice exemplars matching this author + content type
  const blogExemplars = await getVoiceExemplars(`${trend.title}. ${trend.argument}`, deps.db, deps.openai, {
    topK: 2,
    subcategory: 'blog',
    author: trend.author,
  });
  const articleExemplars = await getVoiceExemplars(`${trend.title}. ${trend.argument}`, deps.db, deps.openai, {
    topK: 1,
    subcategory: 'linkedin_article',
    author: trend.author,
  });
  const shortExemplars = await getVoiceExemplars(`${trend.title}. ${trend.argument}`, deps.db, deps.openai, {
    topK: 1,
    subcategory: 'linkedin_short',
    author: trend.author,
  });

  const exemplarBlock =
    formatVoiceExemplars(blogExemplars, 2400) +
    formatVoiceExemplars(articleExemplars, 1800) +
    formatVoiceExemplars(shortExemplars, 1200);

  const author: BrandAuthor = trend.author === 'Drew' ? 'drew' : 'bill';
  const systemPrompt = generateBrandScriptPrompt({
    currentDate: new Date(),
    author,
    audience: 'asset_manager',
    contentEngineMode: true,
    includeStyleContext: exemplarBlock,
  });

  const sourcesBlock = trend.sources
    .map((s) => `- ${s.title} (${s.sender})${s.url ? ` — ${s.url}` : ''}${s.quote ? ` — "${s.quote}"` : ''}`)
    .join('\n');

  const generationPrompt = `Produce ${trend.author}'s author package for this week's Content Engine run.

TREND: ${trend.title}
MOAT: ${trend.moat}
ARGUMENT: ${trend.argument}

SOURCES (use 3-5 in the blog with raw URLs; pick the 2-3 strongest for the LinkedIn article):
${sourcesBlock}

Return JSON ONLY (no prose, no markdown fences) with this exact shape:

{
  "slug": "url-friendly-slug-6-to-8-words",
  "moat": "${trend.moat}",
  "blog": {
    "title": "Direct, benefit-forward headline (no colons + buzzwords, no clickbait)",
    "slug": "same-as-top-level-slug",
    "excerpt": "1-2 sentences (30-55 words) that earn the click",
    "body": "Full blog body (900-1300 words). Use plain paragraphs separated by \\n\\n. NO markdown asterisks, NO pound-sign headers — use ALL-CAPS subheads on their own line if you need section breaks. Open with a sharp observation, striking data point, or provocative question (NEVER 'In today's world'). Build the SB7 arc. Include 3-5 references inline with raw URLs. Close with the canonical signoff: 'Own your data & digital infrastructure. Operate with strategic foresight. Build for the long game.'",
    "readingTime": 5,
    "category": "One of: Building Intelligence, Data & Infrastructure, Portfolio Strategy, AI & Technology, Operations & Efficiency, Capital & Investment, Owner Resources, Industry Trends",
    "tags": ["3-5 tags from the approved tag list"],
    "seoTitle": "50-60 character SEO title with primary keyword near the front",
    "seoDescription": "150-160 character meta description, compelling, includes primary keyword and CTA",
    "featureImagePrompt": "3-5 sentence detailed photorealistic image prompt for 1920x1080 hero. Modern CRE imagery (office towers, smart buildings, data infrastructure, control panels, portfolio dashboards). No people looking at cameras. No stock-photo cliches. Brand colors: deep navy, electric blue, clean white. Output 1920x1080 (16:9 landscape).",
    "ogImagePrompt": "2-4 sentence concept-driven graphic prompt for 1200x630 social share. Bold, high contrast, minimal detail, readable at thumbnail size. May include 4-words-or-fewer text overlay. Output 1200x630 (1.91:1)."
  },
  "linkedinArticle": {
    "title": "LinkedIn article title (distinct angle from the blog)",
    "body": "500-800 word LinkedIn article. Strong opening hook (uncomfortable truth or bold claim). Conversational, executive voice. ${trend.author === 'Bill' ? "Bill can use 'I' freely as a practitioner sharing hard-won perspective." : "Drew demystifies systems calmly; ties to owner outcome."} Shorter paragraphs than the blog — written to be read on a phone. Include 2-3 references with raw URLs. End with a SPECIFIC question that invites real responses (not 'what do you think?'). Close with: 'Own your data & digital infrastructure. Build for the long game.'"
  },
  "linkedinPost": {
    "title": "",
    "body": "100-230 word standalone short post. Hook in line one (no 'Excited to share' or 'I've been thinking about'). 3-5 short paragraphs separated by line breaks, 1-3 sentences each. Clear point of view. End with a simple engagement prompt or takeaway. Last line is hashtags: #OpticWise #CRE #BuildingIntelligence plus 1-2 topic-specific tags from #DataInfrastructure #AI #PortfolioStrategy #PropertyIntelligence #DataOwnership #CapitalStrategy."
  }
}

NON-NEGOTIABLE:
- Always say "data & digital infrastructure", never "infrastructure" alone.
- Never use ESG, leverage, synergy, ecosystem, holistic, seamless (except 'Seamless Mobility' in 5S), cutting-edge, PropTech (when describing OpticWise).
- First-use trademarks: Property Brain™, Portfolio Brain™, PPP 5C™, BoT®, ElasticISP®, 5S®, SIC®, Peak Property Performance®, PPP Audit™.
- Asset-manager audience by default. Translate operating outcomes into capitalized value (NOI × cap rate) where it fits.
- Do NOT invent client metrics. If a claim needs proof and no approved Win is available, write "a common pattern we see" with no numbers.
- Body fields are PLAIN TEXT — no markdown asterisks, no pound-sign headers. Subheads, if used, are ALL-CAPS on their own line.`;

  const resp = await deps.anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8000,
    temperature: 0.6,
    system: systemPrompt,
    messages: [{ role: 'user', content: generationPrompt }],
  });

  const raw = resp.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('\n')
    .trim();
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(jsonText) as Omit<BlogPackage, 'canonAdherence'>;

  // Brand-voice post-processing on the long bodies
  parsed.blog.body = enforceBrandVoice(injectReframingLineIfNeeded(parsed.blog.body));
  parsed.linkedinArticle.body = enforceBrandVoice(injectReframingLineIfNeeded(parsed.linkedinArticle.body));
  parsed.linkedinPost.body = enforceBrandVoice(parsed.linkedinPost.body);

  // Score the blog body against the canon for QA
  const adherence = scoreCanonAdherence(parsed.blog.body);

  return {
    ...parsed,
    canonAdherence: { score: adherence.score, failures: adherence.failures },
  };
}

/**
 * Build the Weekly Intelligence Briefing (top 10 useful intelligence points
 * from the inbox, with relevance to OpticWise and source attribution).
 */
async function buildBriefing(
  date: string,
  sources: ContentEngineSource[],
  trends: ContentTrend[],
  deps: Deps
): Promise<{ title: string; body: string }> {
  const digest = sources
    .slice(0, 50)
    .map((s, i) => `[${i + 1}] ${s.sender} | ${s.subject} | ${s.snippet}`)
    .join('\n');

  const trendDigest = trends.map((t) => `${t.author}: ${t.title} (${t.moat})`).join('\n');

  const prompt = `Produce the Weekly Intelligence Briefing for ${date}.

Pick the top 10 most useful intelligence points from the source list below — the ones that move OpticWise positioning, sales, or product thinking. Fewer than 10 is acceptable if the bar isn't met; do not pad.

For each point, provide:
- The insight in 1-2 sentences
- Why it matters to OpticWise (1-2 sentences, name the moat or layer when relevant)
- Source: publication, sender, or organization

Themes selected this week:
${trendDigest}

Sources:
${digest}

Return PLAIN TEXT (no markdown asterisks, no pound-sign headers; ALL-CAPS subheads on their own line are fine). Start the briefing with a 2-3 sentence editor's note tying the week's signals together.`;

  const resp = await deps.anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    temperature: 0.4,
    system: generateBrandScriptPrompt({
      currentDate: new Date(),
      audience: 'asset_manager',
    }),
    messages: [{ role: 'user', content: prompt }],
  });

  const body = resp.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('\n')
    .trim();

  return {
    title: `Weekly Intelligence Briefing — ${date}`,
    body: enforceBrandVoice(body),
  };
}

function buildContentSummary(
  date: string,
  trends: ContentTrend[],
  packages: BlogPackage[]
): { title: string; body: string } {
  const lines: string[] = [];
  lines.push(`Content Summary — ${date}`);
  lines.push('');
  lines.push(`Themes shipped this week: ${packages.length}`);
  for (let i = 0; i < trends.length; i++) {
    const t = trends[i];
    const p = packages[i];
    if (!p) continue;
    lines.push('');
    lines.push(`${i + 1}. ${t.author} — ${p.blog.title}`);
    lines.push(`   Slug: ${p.slug}`);
    lines.push(`   Moat: ${t.moat}`);
    lines.push(`   Sources used: ${t.sources.length}`);
    lines.push(`   Canon adherence: ${p.canonAdherence.score}/100${p.canonAdherence.failures.length ? ` (failures: ${p.canonAdherence.failures.join('; ')})` : ''}`);
  }

  const moatBreakdown: Record<string, number> = {};
  for (const t of trends) moatBreakdown[t.moat] = (moatBreakdown[t.moat] || 0) + 1;
  lines.push('');
  lines.push('Moat emphasis this week:');
  for (const [moat, n] of Object.entries(moatBreakdown)) lines.push(`  - ${moat}: ${n}`);

  return { title: `Content Summary — ${date}`, body: lines.join('\n') };
}

function buildDrivePayload(
  date: string,
  trends: ContentTrend[],
  packages: BlogPackage[],
  briefing: { title: string; body: string },
  summary: { title: string; body: string }
) {
  return {
    action: 'createFullWeek',
    date,
    themes: packages.map((p, i) => ({
      slug: p.slug,
      moat: p.moat,
      blog: p.blog,
      linkedinArticle: p.linkedinArticle,
      linkedinPost: p.linkedinPost,
      author: trends[i]?.author,
    })),
    briefing,
    summary,
  };
}

async function postToDriveBridge(
  url: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status?: number; body?: unknown; error?: string }> {
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await resp.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // leave as text
    }
    return { ok: resp.ok, status: resp.status, body };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function runContentEngine(
  options: ContentEngineOptions,
  deps: Deps
): Promise<ContentEngineResult> {
  const { date, sources, preferredMoat, postToDrive, driveBridgeUrl } = options;

  if (!sources?.length) {
    throw new Error('runContentEngine: no sources provided');
  }

  const trends = await identifyTrends(sources, deps, preferredMoat);
  if (trends.length < 2) {
    throw new Error(`runContentEngine: planner returned only ${trends.length} trend(s); need 2`);
  }

  const packages: BlogPackage[] = [];
  for (const t of trends.slice(0, 2)) {
    const pkg = await generateAuthorPackage(t, deps);
    packages.push(pkg);
  }

  const briefing = await buildBriefing(date, sources, trends, deps);
  const summary = buildContentSummary(date, trends, packages);
  const drivePayload = buildDrivePayload(date, trends, packages, briefing, summary);

  let driveResult;
  if (postToDrive) {
    const url = driveBridgeUrl || process.env.DRIVE_BRIDGE_URL || DEFAULT_DRIVE_BRIDGE_URL;
    driveResult = await postToDriveBridge(url, drivePayload);
  }

  return {
    date,
    trends: trends.slice(0, 2),
    packages,
    briefing,
    summary,
    drivePayload,
    driveResult,
  };
}

/**
 * Pull source emails from a Gmail label using the existing service-account
 * client. Used by the API route when the operator wants a live run.
 */
export async function loadGmailSources(
  labelQuery: string,
  maxMessages = 80
): Promise<ContentEngineSource[]> {
  const { getServiceAccountClient, getGmailClient } = await import('./google');
  const auth = getServiceAccountClient();
  const gmail = await getGmailClient(auth);

  const q = labelQuery.startsWith('label:') ? labelQuery : `label:${labelQuery}`;
  const collected: { id: string }[] = [];
  let pageToken: string | undefined;
  do {
    const list = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 100,
      q,
      pageToken,
    });
    for (const m of list.data.messages || []) {
      if (m.id) collected.push({ id: m.id });
      if (collected.length >= maxMessages) break;
    }
    pageToken = list.data.nextPageToken || undefined;
  } while (pageToken && collected.length < maxMessages);

  const out: ContentEngineSource[] = [];
  for (const { id } of collected) {
    try {
      const full = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
      const headers = full.data.payload?.headers || [];
      const getH = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
      const subject = getH('Subject');
      const sender = getH('From');
      const date = getH('Date');
      const snippet = full.data.snippet || '';

      const collectBody = (): string => {
        const parts: string[] = [];
        const visit = (p: typeof full.data.payload | undefined) => {
          if (!p) return;
          if (p.body?.data) {
            try {
              parts.push(Buffer.from(p.body.data, 'base64').toString('utf-8'));
            } catch {
              /* ignore */
            }
          }
          for (const child of p.parts || []) visit(child);
        };
        visit(full.data.payload);
        return parts.join('\n').slice(0, 8000);
      };
      const body = collectBody();
      const urlMatch = body.match(/https?:\/\/[^\s)>"]+/);

      out.push({
        subject,
        sender,
        snippet,
        body,
        url: urlMatch?.[0],
        receivedAt: date || new Date().toISOString(),
      });
    } catch {
      // skip individual failures
    }
  }
  return out;
}
