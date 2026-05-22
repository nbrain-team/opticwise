/**
 * scripts/generate-ppp-blog-posts.ts
 *
 * Generates OpticWise Insights blog posts from Peak Property Performance®
 * podcast episode transcripts. Each post is a 1,500-2,000 word article
 * summary written in OpticWise's blended Bill/Drew voice.
 *
 * Two-phase workflow:
 *   Phase 1 — Generate: Reads transcripts, calls AI, saves post JSON to _output/
 *   Phase 2 — Publish: Reads post JSON, creates DB records, pushes to GitHub
 *
 * Usage:
 *   npx tsx scripts/generate-ppp-blog-posts.ts --generate --episodes 1,2
 *   npx tsx scripts/generate-ppp-blog-posts.ts --publish --episodes 1,2
 *   npx tsx scripts/generate-ppp-blog-posts.ts --generate              # all episodes
 *   npx tsx scripts/generate-ppp-blog-posts.ts --publish               # all generated
 *
 * Generate requires: OPENAI_API_KEY
 * Publish requires:  DATABASE_URL, GITHUB_TOKEN
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

let prisma: any = null;
function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = require("@prisma/client");
    prisma = new PrismaClient();
  }
  return prisma;
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PPP_HTML_ROOT = path.resolve(__dirname, "../../../../ppp-html");
const EPISODE_INDEX_PATH = path.join(PPP_HTML_ROOT, "scripts/podcast/_episode_index.json");
const PODCAST_DIR = path.join(PPP_HTML_ROOT, "podcast");
const OUTPUT_DIR = path.join(__dirname, "_ppp-blog-output");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO_OWNER = "nbrain-team";
const REPO_NAME = "opticwise-html";
const BRANCH = "main";
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

const CATEGORY = "Peak Property Performance®";
const AUTHOR = "Bill Douglas & Drew Hall";

const PPP_PODCAST_URL = "https://peakpropertyperformance.com/podcast/index.html";
const PPP_BOOK_URL = "https://peakpropertyperformance.com/book/index.html";
const PPP_BE_ON_SHOW_URL = "https://peakpropertyperformance.com/be-on-the-show/";

// Secondary category mapping based on common episode themes
const SECONDARY_CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Data Ownership": ["data ownership", "own your data", "data control", "vendor lock", "data silos"],
  "Digital Infrastructure": ["digital infrastructure", "connectivity", "network", "fiber", "backbone", "BoT"],
  "AI Readiness": ["ai ", "artificial intelligence", "machine learning", "llm", "automation"],
  "Tenant Experience": ["tenant", "resident", "occupant", "experience", "satisfaction"],
  "NOI & Revenue": ["noi", "revenue", "cost", "savings", "roi", "cap rate", "valuation"],
  "Operational Control": ["operations", "operational", "management", "property manager", "facility"],
  "Smart Buildings": ["smart building", "iot", "sensor", "building automation", "bms", "bas"],
  "CRE Strategy": ["strategy", "investment", "portfolio", "underwriting", "due diligence", "acquisition"],
  "Vendor Control & Governance": ["vendor", "governance", "compliance", "security", "risk"],
  "The 5C™ Plan": ["5c", "clarify", "connect", "collect", "coordinate", "control", "five c"],
};

interface EpisodeData {
  rss_ep_num: number;
  rss_title: string;
  rss_title_raw: string;
  rss_description_html: string;
  rss_pub_date: string;
  slug: string;
  youtube_thumb_maxres?: string;
  youtube_thumb_hq?: string;
  youtube_video_id?: string;
  youtube_url?: string;
  drive_folder_url?: string;
}

interface EpisodeIndex {
  episodes: EpisodeData[];
}

function ghHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function getFile(filePath: string): Promise<{ sha: string; content: string } | null> {
  const res = await fetch(`${BASE_URL}/contents/${filePath}?ref=${BRANCH}`, {
    headers: ghHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub getFile(${filePath}) failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    sha: data.sha,
    content: Buffer.from(data.content, "base64").toString("utf-8"),
  };
}

async function commitMultipleFiles(
  files: Array<{ path: string; content: string | null }>,
  message: string
): Promise<void> {
  const branchRes = await fetch(`${BASE_URL}/git/ref/heads/${BRANCH}`, { headers: ghHeaders() });
  if (!branchRes.ok) throw new Error(`getRef failed: ${branchRes.status} ${await branchRes.text()}`);
  const branchData = await branchRes.json();
  const headSha: string = branchData.object.sha;

  const commitRes = await fetch(`${BASE_URL}/git/commits/${headSha}`, { headers: ghHeaders() });
  if (!commitRes.ok) throw new Error(`getCommit failed: ${commitRes.status} ${await commitRes.text()}`);
  const commitData = await commitRes.json();
  const baseTreeSha: string = commitData.tree.sha;

  const treeItems = await Promise.all(
    files.map(async (file) => {
      if (file.content === null) {
        return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: null };
      }
      const blobRes = await fetch(`${BASE_URL}/git/blobs`, {
        method: "POST",
        headers: ghHeaders(),
        body: JSON.stringify({
          content: Buffer.from(file.content, "utf-8").toString("base64"),
          encoding: "base64",
        }),
      });
      if (!blobRes.ok)
        throw new Error(`createBlob(${file.path}) failed: ${blobRes.status} ${await blobRes.text()}`);
      const blobData = await blobRes.json();
      return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: blobData.sha as string };
    })
  );

  const treeRes = await fetch(`${BASE_URL}/git/trees`, {
    method: "POST",
    headers: ghHeaders(),
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });
  if (!treeRes.ok) throw new Error(`createTree failed: ${treeRes.status} ${await treeRes.text()}`);
  const treeData = await treeRes.json();

  const newCommitRes = await fetch(`${BASE_URL}/git/commits`, {
    method: "POST",
    headers: ghHeaders(),
    body: JSON.stringify({ message, tree: treeData.sha, parents: [headSha] }),
  });
  if (!newCommitRes.ok) throw new Error(`createCommit failed: ${newCommitRes.status} ${await newCommitRes.text()}`);
  const newCommitData = await newCommitRes.json();

  const updateRefRes = await fetch(`${BASE_URL}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    headers: ghHeaders(),
    body: JSON.stringify({ sha: newCommitData.sha }),
  });
  if (!updateRefRes.ok) throw new Error(`updateRef failed: ${updateRefRes.status} ${await updateRefRes.text()}`);
}

function removeAllCardsForSlug(content: string, slug: string): string {
  const slugAttr = `data-ow-slug="${slug}"`;
  let result = content;
  while (result.includes(slugAttr)) {
    const slugPos = result.indexOf(slugAttr);
    const openTag = '<a class="group block';
    let cardStart = slugPos;
    while (cardStart > 0 && result.slice(cardStart, cardStart + openTag.length) !== openTag) {
      cardStart--;
    }
    const closeTag = "</a>";
    const rawEnd = result.indexOf(closeTag, slugPos);
    if (rawEnd === -1) break;
    const cardEnd = rawEnd + closeTag.length;
    result = result.slice(0, cardStart) + result.slice(cardEnd);
  }
  return result;
}

function extractTranscript(slug: string): string | null {
  const htmlPath = path.join(PODCAST_DIR, slug, "index.html");
  if (!fs.existsSync(htmlPath)) return null;

  const html = fs.readFileSync(htmlPath, "utf-8");

  // Extract transcript from the episode-transcript__body div
  const bodyMatch = html.match(
    /<(?:div|section)[^>]*class="episode-transcript(?:__body)?[^"]*"[^>]*>([\s\S]*?)(?:<\/(?:div|section)>\s*<\/section>|<\/section>)/
  );
  if (!bodyMatch) return null;

  let text = bodyMatch[1];
  // Strip HTML tags but preserve paragraph breaks
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<h[1-6][^>]*>/gi, "\n\n### ");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  text = text.replace(/<[^>]+>/g, "");
  // Decode HTML entities
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

function inferSecondaryCategory(title: string, transcript: string): string {
  const combined = (title + " " + transcript).toLowerCase();
  let bestCat = "CRE Strategy";
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(SECONDARY_CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw, "gi");
      const matches = combined.match(regex);
      if (matches) score += matches.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }
  return bestCat;
}

function inferTags(title: string, transcript: string, secondaryCat: string): string[] {
  const tags = new Set<string>(["podcast", "Peak Property Performance®"]);
  tags.add(secondaryCat);

  const tagKeywords: Record<string, string> = {
    "data ownership": "data ownership",
    "digital infrastructure": "digital infrastructure",
    "property manager": "property management",
    "asset manager": "asset management",
    "tenant": "tenant experience",
    "noi": "NOI",
    "ai ": "artificial intelligence",
    "cybersecurity": "cybersecurity",
    "energy": "energy management",
    "sustainability": "sustainability",
    "multifamily": "multifamily",
    "student housing": "student housing",
    "hotel": "hospitality",
    "parking": "parking",
    "tokenization": "tokenization",
    "due diligence": "due diligence",
    "underwriting": "underwriting",
    "5c": "PPP 5C™",
    "vendor": "vendor management",
  };

  const combined = (title + " " + transcript.slice(0, 3000)).toLowerCase();
  for (const [kw, tag] of Object.entries(tagKeywords)) {
    if (combined.includes(kw)) tags.add(tag);
  }
  return Array.from(tags).slice(0, 8);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function authorSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function buildEpisodeUrl(slug: string): string {
  return `https://peakpropertyperformance.com/podcast/${slug}/index.html`;
}

async function generateArticle(ep: EpisodeData, transcript: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}> {
  const episodeUrl = buildEpisodeUrl(ep.slug);
  const truncatedTranscript = transcript.length > 25000
    ? transcript.slice(0, 25000) + "\n\n[transcript truncated]"
    : transcript;

  const voiceGuidelines = `You are OpticWise's content engine, writing Insights blog posts that blend the voices of Bill Douglas (CEO) and Drew Hall (Co-Founder & Chief Architect).

VOICE RULES:
- Write as OpticWise — the trusted guide for CRE owners navigating data & digital infrastructure
- Blend Bill's owner/operator perspective (strategic, big-picture, relationship-driven) with Drew's architect perspective (technical depth, "let's demystify this", practical problem-solving)
- Use "we" when referencing OpticWise perspectives shared on the podcast
- Never say "PropTech" — always "data & digital infrastructure"
- The reframe line is: "If you don't own your data & digital infrastructure, your vendors do."
- Reference the PPP 5C™ framework (Clarify, Connect, Collect, Coordinate, Control) when relevant
- Be direct, operator-to-operator. No jargon-heavy academic tone.
- Use concrete examples from the episode — real scenarios, real problems, real solutions
- Always use the registered mark: Peak Property Performance®`;

  const showNotes = ep.rss_description_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // Step 1a: Generate first half of the article (sections 1-3)
  const part1Response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 6000,
    messages: [{
      role: "user",
      content: `${voiceGuidelines}

Write the FIRST HALF of a long-form blog article (approximately 800-1,000 words) based on this Peak Property Performance® podcast episode. Output HTML only.

Include:
- An engaging opening paragraph that hooks the reader with the core problem or insight
- 3 strong sections with <h2> headings, each with 3-4 paragraphs
- 1-2 direct quotes from the episode using <blockquote> tags
- Link to the episode: <a href="${episodeUrl}">listen to the full episode</a>
- Deep, specific examples from the transcript — not surface-level summaries

Use <h2>, <p>, <blockquote>, <a>, <ul>/<li> tags. Output ONLY raw HTML — no code fences, no wrappers.

EPISODE: ${ep.rss_title} (Episode ${ep.rss_ep_num})

SHOW NOTES: ${showNotes}

TRANSCRIPT:
${truncatedTranscript.slice(0, 15000)}`,
    }],
  });

  let part1 = part1Response.choices[0]?.message?.content;
  if (!part1) throw new Error(`Empty part1 response for episode ${ep.rss_ep_num}`);
  part1 = part1.replace(/^```html?\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  // Step 1b: Generate second half of the article (sections 4-6 + closing)
  const part2Response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 6000,
    messages: [{
      role: "user",
      content: `${voiceGuidelines}

You are continuing a blog article. Here is what was written so far:

${part1.slice(0, 3000)}
[... article continues ...]

Write the SECOND HALF of this article (approximately 800-1,000 more words). Output HTML only.

Include:
- 3 more sections with <h2> headings, each with 3-4 paragraphs
- 1-2 more direct quotes from the episode using <blockquote> tags
- Link to the book: <a href="${PPP_BOOK_URL}">Peak Property Performance® book</a>
- Link to the podcast hub: <a href="${PPP_PODCAST_URL}">Peak Property Performance® Podcast</a>
- A strong closing section with actionable takeaways for CRE owners
- End with this exact CTA block:

<div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 40px; text-align: center; margin-top: 48px;">
<p style="color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 12px;">Peak Property Performance® Podcast</p>
<h3 style="color: white; font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;">Have a story to share?</h3>
<p style="color: rgba(255,255,255,0.7); margin-bottom: 24px;">We're always looking for CRE leaders with real-world experience in data, digital infrastructure, and building operations.</p>
<a href="${PPP_BE_ON_SHOW_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; border-radius: 8px; font-weight: 600; text-decoration: none;">Request to Be on the Show</a>
</div>

Draw from these later sections of the transcript:
${truncatedTranscript.slice(8000)}

Output ONLY raw HTML — no code fences, no wrappers. Do NOT repeat any h2 headings from the first half.`,
    }],
  });

  let part2 = part2Response.choices[0]?.message?.content;
  if (!part2) throw new Error(`Empty part2 response for episode ${ep.rss_ep_num}`);
  part2 = part2.replace(/^```html?\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  const content = part1 + "\n\n" + part2;

  // Step 2: Generate metadata (title, excerpt, SEO) via a quick JSON call
  const metaResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    max_tokens: 512,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You generate SEO metadata for OpticWise blog posts. Return JSON with:
- "title": Engaging article title, different from the episode title (max 80 chars)
- "excerpt": 1-2 sentence summary (max 200 chars)
- "metaTitle": SEO title with "CRE" or "OpticWise" (max 60 chars)
- "metaDescription": SEO description (max 155 chars)
Always use the registered mark: Peak Property Performance®`,
      },
      {
        role: "user",
        content: `Episode title: ${ep.rss_title}\n\nArticle opening:\n${content.slice(0, 1500)}`,
      },
    ],
  });

  const metaRaw = metaResponse.choices[0]?.message?.content;
  if (!metaRaw) throw new Error(`Empty meta response for episode ${ep.rss_ep_num}`);
  const meta = JSON.parse(metaRaw);

  return {
    title: meta.title,
    excerpt: meta.excerpt,
    content,
    metaTitle: meta.metaTitle,
    metaDescription: meta.metaDescription,
  };
}

function generatePostHtml(post: {
  title: string; slug: string; excerpt: string; content: string;
  coverImageUrl: string; author: string; category: string;
  secondaryCats?: string | null; tags: string[];
  metaTitle?: string | null; metaDescription?: string | null;
  metaKeywords?: string | null; publishedAt: Date;
}): string {
  // Dynamically import the generator from the lib
  // Since we're in scripts/ and can't easily import from lib/, we inline the essential logic
  const title = escapeHtml(post.title);
  const metaTitle = escapeHtml(post.metaTitle || post.title);
  const metaDesc = escapeHtml(post.metaDescription || post.excerpt);
  const excerpt = escapeHtml(post.excerpt);
  const author = escapeHtml(post.author);
  const category = escapeHtml(post.category);
  const coverUrl = post.coverImageUrl || "https://www.opticwise.com/images/og-insights.png";
  const canonicalUrl = `https://www.opticwise.com/insights/${post.slug}/`;
  const publishedIso = post.publishedAt.toISOString();
  const keywords = post.metaKeywords
    ? escapeHtml(post.metaKeywords)
    : escapeHtml([...post.tags, post.category, "commercial real estate", "OpticWise"].join(", "));

  const tagMetas = post.tags
    .map((t) => `<meta property="article:tag" content="${escapeHtml(t)}"/>`)
    .join("");

  const secondaryCatsAttr = post.secondaryCats
    ? `<span hidden data-ow-secondary-cats="${escapeHtml(post.secondaryCats)}"></span>`
    : "";

  const jsonLdBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.opticwise.com" },
      { "@type": "ListItem", position: 2, name: "Insights", item: "https://www.opticwise.com/insights" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://www.opticwise.com/insights/${post.slug}` },
    ],
  });

  const jsonLdArticle = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: coverUrl,
    datePublished: publishedIso,
    dateModified: publishedIso,
    articleSection: post.category,
    keywords: post.tags,
    publisher: {
      "@type": "Organization",
      name: "OpticWise",
      logo: { "@type": "ImageObject", url: "https://www.opticwise.com/images/ow_logo.png" },
    },
    author: {
      "@type": "Person",
      name: post.author,
      url: `https://www.opticwise.com/authors/${authorSlug(post.author)}/`,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  });

  const NAV_HTML = `<nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4"><div class="ow-container flex items-center justify-between"><a href="../../index.html"><img alt="OpticWise" width="150" height="36" decoding="async" data-nimg="1" class="h-9 w-auto" style="color:transparent" srcSet="../../images/ow_logo.png 1x, ../../images/ow_logo.png 2x" src="../../images/ow_logo.png"/></a><ul class="hidden lg:flex items-center gap-8"><li class="nav__dropdown" tabindex="0"><span class="nav__dropdown-trigger text-sm font-medium !text-white/85">Solutions</span><div class="nav__dropdown-menu"><a class="nav__link" href="../../property-brain/index.html">Property Brain™</a><a class="nav__link" href="../../portfolio-brain/index.html">Portfolio Brain™</a><a class="nav__link" href="../../ppp-audit/index.html">PPP Audit™</a><a class="nav__link" href="../../bot-building-of-things/index.html">BoT® — Building of Things®</a><a class="nav__link" href="../../5s-user-experience-standard/index.html">5S® Standard</a><a class="nav__link" href="../../advisory-services/index.html">Advisory Services</a></div></li><li class="nav__dropdown" tabindex="0"><span class="nav__dropdown-trigger text-sm font-medium !text-white/85">Audiences</span><div class="nav__dropdown-menu"><a class="nav__link" href="../../for-lps-and-financiers/index.html">For LPs &amp; Financiers</a><a class="nav__link" href="../../for-asset-managers/index.html">For Asset Managers</a><a class="nav__link" href="../../for-it-executives/index.html">For IT Executives</a><a class="nav__link" href="../../for-property-managers-and-engineers/index.html">For PMs &amp; Engineers</a><a class="nav__link" href="../../for-tenants/index.html">For Tenants</a></div></li><li class="nav__dropdown" tabindex="0"><span class="nav__dropdown-trigger text-sm font-medium !text-white/85">Why OpticWise</span><div class="nav__dropdown-menu"><a class="nav__link" href="../../how-we-operate/index.html">How It Works</a><a class="nav__link" href="../../customer-outcomes/index.html">Customer Outcomes</a><a class="nav__link" href="../../working-with-us/index.html">Working With Us</a></div></li><li class="nav__dropdown" tabindex="0"><a class="nav__dropdown-trigger text-sm font-medium !text-white/85" href="../../insights/index.html">Insights</a><div class="nav__dropdown-menu"><a class="nav__link" href="../../insights/index.html">Blog Articles</a><a class="nav__link" href="../../faq/index.html">FAQ</a><a class="nav__link" href="../../glossary/index.html">Glossary</a></div></li><li class="nav__dropdown" tabindex="0"><span class="nav__dropdown-trigger text-sm font-medium !text-white/85">About</span><div class="nav__dropdown-menu"><a class="nav__link" href="../../about/index.html">Company</a><a class="nav__link" href="../../contact/index.html">Contact</a></div></li><li><button type="button" class="btn btn-nav">Schedule Review</button></li></ul><button class="lg:hidden p-2" aria-label="Menu"><span class="block w-5 h-0.5 rounded bg-white mb-1.5"></span><span class="block w-5 h-0.5 rounded bg-white mb-1.5"></span><span class="block w-5 h-0.5 rounded bg-white "></span></button></div></nav>`;

  const FOOTER_HTML = `<footer class="bg-ow-navy text-white/60"><div class="ow-container py-16"><div class="grid grid-cols-1 gap-8 mb-12 pb-12 border-b border-white/10 md:grid-cols-2 md:gap-12 ow-footer-newsletter"><div><p class="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Insights Newsletter</p><h4 class="text-base font-bold text-white mb-2">Owner-controlled CRE insights, delivered.</h4><p class="text-sm text-white/55 leading-relaxed">A short dispatch from the OpticWise team — what&#x27;s actually working in CRE data &amp; digital infrastructure, the plays we&#x27;re running this month, and the moves smart owners are making. No fluff, no cadence padding.</p></div><div data-opticwise-form="insights-newsletter" data-theme="dark" data-align="left" data-show-header="false"></div></div><div class="grid grid-cols-1 gap-10 pb-12 border-b border-white/10 md:grid-cols-5"><div><img alt="OpticWise" loading="lazy" width="120" height="32" decoding="async" data-nimg="1" class="h-8 w-auto mb-4" style="color:transparent" srcSet="../../images/ow_logo.png 1x, ../../images/ow_logo.png 2x" src="../../images/ow_logo.png"/><p class="text-sm text-white/50 leading-relaxed">Owner-controlled data &amp; digital infrastructure for commercial real estate.</p></div><div><h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Explore</h4><ul class="space-y-2.5"><li><a class="text-sm hover:text-white transition-colors" href="../../digital-infrastructure-noi-strategy/index.html">NOI Strategy</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../digital-infrastructure-noi-playbook/index.html">NOI Playbook</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../ai-ready-commercial-real-estate/index.html">AI-Ready CRE</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../own-vs-lease-cre-building-data/index.html">Own vs Lease Data</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../control-cre-digital-visibility/index.html">Digital Visibility</a></li></ul></div><div><h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Solutions</h4><ul class="space-y-2.5"><li><a class="text-sm hover:text-white transition-colors" href="../../property-brain/index.html">Property Brain™</a></li><li><a class="nav__link" href="../../portfolio-brain/index.html">Portfolio Brain™</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../ppp-audit/index.html">PPP Audit™</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../bot-building-of-things/index.html">BoT® — Building of Things®</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../5s-user-experience-standard/index.html">5S® Standard</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../advisory-services/index.html">Advisory Services</a></li></ul></div><div><h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">By Audience</h4><ul class="space-y-2.5"><li><a class="text-sm hover:text-white transition-colors" href="../../for-lps-and-financiers/index.html">For LPs &amp; Financiers</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../for-asset-managers/index.html">For Asset Managers</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../for-it-executives/index.html">For IT Executives</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../for-property-managers-and-engineers/index.html">For PMs &amp; Engineers</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../for-tenants/index.html">For Tenants</a></li></ul></div><div><h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Resources</h4><ul class="space-y-2.5"><li><a class="text-sm hover:text-white transition-colors" href="../../insights/index.html">Insights (Blog)</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../faq/index.html">FAQ</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../glossary/index.html">Glossary</a></li><li><a class="text-sm hover:text-white transition-colors" href="https://www.peakpropertyperformance.com/" target="_blank" rel="noopener">PPP Book &amp; Podcast</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../how-we-operate/index.html">How It Works</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../about/index.html">About</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../contact/index.html">Contact</a></li></ul></div></div><div class="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"><p class="text-xs text-white/30">© 2026 OpticWise. All rights reserved.</p><p class="text-xs text-white/25 max-w-sm text-center md:text-right">Own your data &amp; digital infrastructure. Operate with strategic foresight. Build for the long game.</p></div></div></footer>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="image" imageSrcSet="../../images/ow_logo.png 1x, ../../images/ow_logo.png 2x"/><link rel="preload" as="image" href="${coverUrl}"/><link rel="preload" as="image" href="../../images/testimonial-bg.jpg"/><link rel="preconnect" href="https://fonts.googleapis.com/"/><link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="anonymous"/><title>${metaTitle}</title><meta name="description" content="${metaDesc}"/><link rel="canonical" href="${canonicalUrl}"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${metaDesc}"/><meta property="og:url" content="${canonicalUrl}"/><meta property="og:site_name" content="OpticWise"/><meta property="og:image" content="${coverUrl}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:type" content="article"/><meta property="article:published_time" content="${publishedIso}"/><meta property="article:modified_time" content="${publishedIso}"/><meta property="article:author" content="${author}"/><meta property="article:section" content="${category}"/>${tagMetas}<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${title}"/><meta name="twitter:description" content="${metaDesc}"/><meta name="twitter:image" content="${coverUrl}"/><meta name="keywords" content="${keywords}"/><meta name="robots" content="index,follow,max-image-preview:large"/><meta name="author" content="${author}"/><link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48"/><link rel="icon" href="/favicon.ico" sizes="32x32"/><link rel="icon" href="/favicon.png" type="image/png" sizes="32x32"/><link rel="icon" href="/icon.png" type="image/png" sizes="192x192"/><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<!-- ow:strip-nextjs:assets -->
<link rel="stylesheet" href="/styles.css"/>
<link rel="stylesheet" href="/site.css"/>
<script src="/site.js" defer></script>
<script src="https://ownet.opticwise.com/forms/embed.js" defer></script>
<script src="/forms-embed.js?v=2" defer></script>
</head><body><div hidden=""><!--$--></div>${NAV_HTML}<main><script type="application/ld+json">${jsonLdBreadcrumb}</script><script type="application/ld+json">${jsonLdArticle}</script><section class="relative overflow-hidden pt-36 pb-16"><div class="absolute inset-0 z-0"><img src="${coverUrl}" alt="" class="w-full h-full object-cover"/></div><div class="hero-overlay"></div><div class="hero-grid-lines"></div><div class="relative z-10 ow-container max-w-3xl"><a class="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 mb-6 transition-colors" href="../../insights/index.html">\u2190 Back to Insights</a><span class="block text-xs font-bold text-blue-300 bg-blue-400/10 px-4 py-1.5 rounded-full w-fit mb-4">${category}</span>${secondaryCatsAttr}<h1 class="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">${title}</h1><p class="text-lg text-white/70">${excerpt}</p><p class="text-sm text-white/40 mt-4">${formatDate(post.publishedAt)} \u00b7 By <a href="../../authors/${authorSlug(post.author)}/index.html" class="text-white/60 hover:text-white underline">${author}</a></p></div></section><section class="ow-section bg-white"><div class="ow-container max-w-3xl mx-auto"><div class="ghost-content">${post.content}</div></div></section><section class="relative overflow-hidden py-24"><div class="absolute inset-0 z-0"><img src="../../images/testimonial-bg.jpg" alt="" class="w-full h-full object-cover"/></div><div class="absolute inset-0 z-[1]" style="background:linear-gradient(135deg, rgba(43,108,176,.92), rgba(30,78,140,.95))"></div><div class="relative z-10 ow-container text-center"><p class="text-xs font-bold uppercase tracking-widest text-blue-200 mb-4">Your Next Step</p><h2 class="text-2xl lg:text-3xl font-extrabold text-white mb-4 leading-tight">Complimentary CRE Data &amp; Digital Review Session</h2><p class="text-base text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">One building. Map who owns what, where data lives, who has permission to act on it, and where operational burden stacks up vs your KPIs.</p><div data-opticwise-form="schedule-review" data-eyebrow="YOUR NEXT STEP" data-heading="Complimentary CRE Data &amp; Digital Review Session" data-description="One building. Map who owns what, where data lives, and where operational burden stacks up vs your KPIs." data-show-header="false" class="ow-fe-cta-mount-inline"></div></div></section><!--$--></main>${FOOTER_HTML}</body></html>`;
}

function generateIndexCard(post: {
  title: string; slug: string; excerpt: string;
  coverImageUrl: string; author: string; category: string;
  publishedAt: Date;
}): string {
  const title = escapeHtml(post.title);
  const excerpt = escapeHtml(post.excerpt);
  const author = escapeHtml(post.author);
  const category = escapeHtml(post.category);
  const coverUrl = post.coverImageUrl || "https://www.opticwise.com/images/og-insights.png";
  const dateStr = formatDate(post.publishedAt);

  return `<a class="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-ow-blue/20 transition-all no-underline" href="../insights/${post.slug}/index.html" data-ow-slug="${post.slug}" data-ow-cat="${category}"><div class="aspect-[16/9] overflow-hidden bg-gray-100"><img src="${coverUrl}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="eager" decoding="async"/></div><div class="p-6"><span class="inline-block text-xs font-bold text-ow-blue bg-blue-50 px-3 py-1 rounded-full mb-3">${category}</span><h3 class="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-ow-blue transition-colors">${title}</h3><p class="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">${excerpt}</p><div class="flex items-center gap-2 text-xs text-gray-400"><span>${dateStr}</span><span>\u00b7</span><span>${author}</span></div></div></a>`;
}

async function publishPost(
  slug: string,
  postHtml: string,
  indexCardHtml: string,
  title: string
): Promise<string> {
  const indexFile = await getFile("insights/index.html");
  if (!indexFile) throw new Error("insights/index.html not found in repo");

  const GRID_MARKER = "data-ow-insights-grid>";
  const markerIdx = indexFile.content.indexOf(GRID_MARKER);
  if (markerIdx === -1) throw new Error("Could not find grid marker in insights/index.html");

  const deduped = removeAllCardsForSlug(indexFile.content, slug);
  const insertAt = deduped.indexOf(GRID_MARKER) + GRID_MARKER.length;
  const updatedIndex = deduped.slice(0, insertAt) + indexCardHtml + deduped.slice(insertAt);

  await commitMultipleFiles(
    [
      { path: `insights/${slug}/index.html`, content: postHtml },
      { path: "insights/index.html", content: updatedIndex },
    ],
    `feat(blog): publish PPP podcast "${title}"`
  );

  return `https://www.opticwise.com/insights/${slug}/`;
}

// ── Phase 1: Generate ────────────────────────────────────────────────

async function generateEpisode(ep: EpisodeData): Promise<void> {
  const blogSlug = `ppp-${ep.slug}`;
  const outPath = path.join(OUTPUT_DIR, `${blogSlug}.json`);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Episode ${ep.rss_ep_num}: ${ep.rss_title}`);
  console.log(`Slug: ${blogSlug}`);

  if (fs.existsSync(outPath)) {
    console.log(`  SKIP: Output already exists at ${outPath}`);
    return;
  }

  const transcript = extractTranscript(ep.slug);
  if (!transcript || transcript.length < 200) {
    console.log(`  SKIP: No transcript found or too short (${transcript?.length || 0} chars)`);
    return;
  }
  console.log(`  Transcript: ${transcript.length} chars`);

  const secondaryCat = inferSecondaryCategory(ep.rss_title, transcript);
  const tags = inferTags(ep.rss_title, transcript, secondaryCat);
  console.log(`  Secondary category: ${secondaryCat}`);

  console.log(`  Generating article via AI...`);
  const article = await generateArticle(ep, transcript);
  console.log(`  Title: ${article.title}`);
  console.log(`  Content length: ${article.content.length} chars`);

  const postData = {
    episodeNum: ep.rss_ep_num,
    title: article.title,
    slug: blogSlug,
    excerpt: article.excerpt,
    content: article.content,
    coverImageUrl: ep.youtube_thumb_maxres || ep.youtube_thumb_hq || "",
    author: AUTHOR,
    category: CATEGORY,
    secondaryCats: secondaryCat,
    tags,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    publishedAt: ep.rss_pub_date + "T12:00:00Z",
    episodeSlug: ep.slug,
    episodeTitle: ep.rss_title,
  };

  fs.writeFileSync(outPath, JSON.stringify(postData, null, 2), "utf-8");
  console.log(`  SAVED: ${outPath}`);

  // Rate-limit between AI calls
  await new Promise((r) => setTimeout(r, 2000));
}

// ── Phase 2: Publish (local filesystem) ──────────────────────────────

const OPTICWISE_HTML_ROOT = path.resolve(__dirname, "../../../../opticwise-html");

const OW_ABOUT_BLOCK =
  '<p style="margin-top:32px;padding:20px 24px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;font-size:0.95em;line-height:1.7;color:#334155">' +
  '<strong>About OpticWise:</strong> OpticWise provides owner-controlled ' +
  '<a href="https://www.opticwise.com/property-brain/">data &amp; digital infrastructure</a> ' +
  'for commercial real estate — from ' +
  '<a href="https://www.opticwise.com/ppp-audit/">PPP Audits</a> to ' +
  '<a href="https://www.opticwise.com/portfolio-brain/">portfolio-wide intelligence</a>. ' +
  '<a href="https://www.opticwise.com/how-we-operate/">See how we operate</a> or ' +
  '<a href="https://www.opticwise.com/customer-outcomes/">read customer outcomes</a>.' +
  '</p>';

function injectAboutBlock(content: string): string {
  if (content.includes("About OpticWise:")) return content;
  const ctaMarker = '<div style="background: linear-gradient(135deg, #0f172a';
  const idx = content.indexOf(ctaMarker);
  if (idx === -1) return content + "\n\n" + OW_ABOUT_BLOCK;
  return content.slice(0, idx) + OW_ABOUT_BLOCK + "\n\n" + content.slice(idx);
}

function addBacklinkToPPPPage(episodeSlug: string, owUrl: string): void {
  const pppPage = path.join(PPP_HTML_ROOT, "podcast", episodeSlug, "index.html");
  if (!fs.existsSync(pppPage)) return;

  let html = fs.readFileSync(pppPage, "utf-8");
  if (html.includes("opticwise.com/insights/ppp-")) return;

  const insightsCard =
    '<div class="aside-card" style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;border-color:#1e40af">' +
    '<h4 style="color:white">Read the Article</h4>' +
    '<p style="color:rgba(255,255,255,0.85);font-size:var(--fs-body-sm);margin-block:var(--space-3)">Read a full summary of this episode on OpticWise Insights.</p>' +
    '<a class="btn" style="width:100%;background:white;color:#1e40af;font-weight:600" href="' + owUrl + '" target="_blank" rel="noopener noreferrer">Read on OpticWise</a>' +
    '</div>';

  const marker = '<div class="aside-card"><h4>Recent Episodes</h4>';
  if (html.includes(marker)) {
    html = html.replace(marker, insightsCard + marker);
    fs.writeFileSync(pppPage, html, "utf-8");
    console.log(`  PPP backlink: added to ${episodeSlug}`);
  }
}

function sortInsightsIndex(indexPath: string): void {
  let html = fs.readFileSync(indexPath, "utf-8");
  const GRID_MARKER = "data-ow-insights-grid>";
  const gridStart = html.indexOf(GRID_MARKER);
  if (gridStart === -1) return;
  const contentStart = gridStart + GRID_MARKER.length;

  const cardOpen = '<a class="group block';
  const cardClose = "</a>";
  let pos = contentStart;
  const cards: Array<{ html: string; dateMs: number }> = [];
  let lastCardEnd = contentStart;

  while (true) {
    const start = html.indexOf(cardOpen, pos);
    if (start === -1) break;
    const nextSection = html.indexOf("</section>", contentStart);
    if (start > nextSection) break;
    const end = html.indexOf(cardClose, start);
    if (end === -1) break;
    const cardHtml = html.slice(start, end + cardClose.length);
    const dateMatch = cardHtml.match(/<span>([A-Z][a-z]+ \d{1,2}, \d{4})<\/span>/);
    const dateMs = dateMatch ? new Date(dateMatch[1]).getTime() : 0;
    cards.push({ html: cardHtml, dateMs });
    lastCardEnd = end + cardClose.length;
    pos = lastCardEnd;
  }

  if (cards.length < 2) return;
  cards.sort((a, b) => b.dateMs - a.dateMs);
  const sorted = cards.map((c) => c.html).join("");
  const newHtml = html.slice(0, contentStart) + sorted + html.slice(lastCardEnd);
  fs.writeFileSync(indexPath, newHtml, "utf-8");
  console.log(`  Sorted: ${cards.length} cards by date`);
}

function publishEpisodeLocal(jsonPath: string): void {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const blogSlug = raw.slug as string;
  const publishedAt = new Date(raw.publishedAt);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Publishing: ${raw.title}`);
  console.log(`Slug: ${blogSlug}`);

  const postDir = path.join(OPTICWISE_HTML_ROOT, "insights", blogSlug);
  if (fs.existsSync(path.join(postDir, "index.html"))) {
    console.log(`  SKIP: Already exists at ${postDir}`);
    return;
  }

  // Inject "About OpticWise" cross-link block into the article content
  const enrichedContent = injectAboutBlock(raw.content);

  const postData = {
    title: raw.title,
    slug: blogSlug,
    excerpt: raw.excerpt,
    content: enrichedContent,
    coverImageUrl: raw.coverImageUrl,
    author: raw.author,
    category: raw.category,
    secondaryCats: raw.secondaryCats,
    tags: raw.tags,
    metaTitle: raw.metaTitle,
    metaDescription: raw.metaDescription,
    metaKeywords: null as string | null,
    publishedAt,
  };

  // Generate HTML
  const postHtml = generatePostHtml(postData);
  const indexCard = generateIndexCard(postData);

  // Write post file
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, "index.html"), postHtml, "utf-8");
  console.log(`  Wrote: ${postDir}/index.html`);

  // Update insights/index.html — add card and sort by date
  const indexPath = path.join(OPTICWISE_HTML_ROOT, "insights", "index.html");
  let indexHtml = fs.readFileSync(indexPath, "utf-8");

  // Dedup: remove existing cards for this slug
  const slugAttr = `data-ow-slug="${blogSlug}"`;
  while (indexHtml.includes(slugAttr)) {
    const slugPos = indexHtml.indexOf(slugAttr);
    const openTag = '<a class="group block';
    let cardStart = slugPos;
    while (cardStart > 0 && indexHtml.slice(cardStart, cardStart + openTag.length) !== openTag) {
      cardStart--;
    }
    const closeTag = "</a>";
    const rawEnd = indexHtml.indexOf(closeTag, slugPos);
    if (rawEnd === -1) break;
    indexHtml = indexHtml.slice(0, cardStart) + indexHtml.slice(rawEnd + closeTag.length);
  }

  // Insert card at the top of the grid
  const GRID_MARKER = "data-ow-insights-grid>";
  const markerIdx = indexHtml.indexOf(GRID_MARKER);
  if (markerIdx === -1) {
    console.error(`  ERROR: Could not find grid marker in index.html`);
    return;
  }
  const insertAt = markerIdx + GRID_MARKER.length;
  indexHtml = indexHtml.slice(0, insertAt) + indexCard + indexHtml.slice(insertAt);
  fs.writeFileSync(indexPath, indexHtml, "utf-8");

  // Sort the full index by publish date (newest first)
  sortInsightsIndex(indexPath);

  console.log(`  Updated: insights/index.html`);

  // Add "Read the Article" backlink to the PPP episode page
  const owUrl = `https://www.opticwise.com/insights/${blogSlug}/`;
  addBacklinkToPPPPage(raw.episodeSlug, owUrl);

  console.log(`  DONE: ${owUrl}`);
}

// ── CLI ──────────────────────────────────────────────────────────────

function parseEpisodeArgs(args: string[]): number[] | null {
  const epIdx = args.indexOf("--episodes");
  if (epIdx !== -1 && args[epIdx + 1]) {
    return args[epIdx + 1].split(",").map(Number).filter((n) => !isNaN(n));
  }
  const episodeFlag = args.find((a) => a.startsWith("--episodes="));
  if (episodeFlag) {
    return episodeFlag.split("=")[1].split(",").map(Number).filter((n) => !isNaN(n));
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const doGenerate = args.includes("--generate");
  const doPublish = args.includes("--publish");
  const requestedEpisodes = parseEpisodeArgs(args);

  if (!doGenerate && !doPublish) {
    console.log("Usage:");
    console.log("  --generate [--episodes 1,2]   Generate article JSON from transcripts (needs OPENAI_API_KEY)");
    console.log("  --publish  [--episodes 1,2]   Publish generated JSON to DB + GitHub (needs DATABASE_URL, GITHUB_TOKEN)");
    process.exit(0);
  }

  // Load episode index
  if (!fs.existsSync(EPISODE_INDEX_PATH)) {
    console.error(`ERROR: Episode index not found at ${EPISODE_INDEX_PATH}`);
    process.exit(1);
  }
  const index: EpisodeIndex = JSON.parse(fs.readFileSync(EPISODE_INDEX_PATH, "utf-8"));

  if (doGenerate) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("ERROR: OPENAI_API_KEY is required for --generate");
      process.exit(1);
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    let episodes = index.episodes.filter((ep) => ep.rss_ep_num && ep.rss_ep_num > 0);
    if (requestedEpisodes) {
      episodes = episodes.filter((ep) => requestedEpisodes!.includes(ep.rss_ep_num));
    }
    episodes.sort((a, b) => a.rss_ep_num - b.rss_ep_num);

    console.log(`Generating ${episodes.length} episodes → ${OUTPUT_DIR}`);
    for (const ep of episodes) {
      try {
        await generateEpisode(ep);
      } catch (err) {
        console.error(`  ERROR on episode ${ep.rss_ep_num}:`, err);
      }
    }
  }

  if (doPublish) {
    if (!fs.existsSync(OPTICWISE_HTML_ROOT)) {
      console.error(`ERROR: opticwise-html repo not found at ${OPTICWISE_HTML_ROOT}`);
      process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      console.error(`ERROR: No generated output found at ${OUTPUT_DIR}. Run --generate first.`);
      process.exit(1);
    }

    let jsonFiles = fs.readdirSync(OUTPUT_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(OUTPUT_DIR, f))
      .sort();

    if (requestedEpisodes) {
      jsonFiles = jsonFiles.filter((f) => {
        const data = JSON.parse(fs.readFileSync(f, "utf-8"));
        return requestedEpisodes!.includes(data.episodeNum);
      });
    }

    console.log(`Publishing ${jsonFiles.length} posts to ${OPTICWISE_HTML_ROOT}/insights/`);
    for (const f of jsonFiles) {
      try {
        publishEpisodeLocal(f);
      } catch (err) {
        console.error(`  ERROR publishing ${f}:`, err);
      }
    }
  }

  console.log(`\nDone!`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
