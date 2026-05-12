/**
 * Ported from opticwise-html/scripts/build-insights-index.mjs — regenerates
 * insights listing splice HTML + search-index.json entries from post metadata.
 */

export const INITIAL_VISIBLE = 30;
export const BODY_CHAR_CAP = 5000;
export const EAGER_IMG_COUNT = 6;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ldquo: "\u201c",
  rdquo: "\u201d",
  lsquo: "\u2018",
  rsquo: "\u2019",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  trade: "\u2122",
  reg: "\u00ae",
  copy: "\u00a9",
  deg: "\u00b0",
};

export function decodeEntities(s: string): string {
  if (!s) return "";
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16))
    )
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function escapeAttr(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const GENERIC_TITLE_RE = /^OpticWise\s*\|/i;
const GENERIC_DESC_RE =
  /^OpticWise\s+helps\s+commercial\s+real\s+estate\s+owners/i;
const GENERIC_IMAGE_RE = /\/og-default\.png(?:[?#]|$)/i;

function isGenericTitle(s: string) {
  return !!s && GENERIC_TITLE_RE.test(s);
}
function isGenericDescription(s: string) {
  return !!s && GENERIC_DESC_RE.test(s);
}
function isGenericImage(s: string) {
  return !!s && GENERIC_IMAGE_RE.test(s);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(
      /<\/(p|div|li|h[1-6]|section|article|figure|blockquote)\s*>/gi,
      " "
    )
    .replace(/<[^>]+>/g, " ");
}

export function extractH1Text(html: string): string {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return "";
  return decodeEntities(m[1].replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function findJsonLdArticleField(html: string, field: string): string {
  const blockRe =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const fieldRe = new RegExp(
    '"' + field + '"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"'
  );
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    const block = m[1];
    if (!/"@type"\s*:\s*"Article"/i.test(block)) continue;
    const fm = block.match(fieldRe);
    if (!fm) continue;
    try {
      const decoded = JSON.parse('"' + fm[1] + '"');
      return decodeEntities(decoded).replace(/\s+/g, " ").trim();
    } catch {
      return decodeEntities(fm[1]).replace(/\s+/g, " ").trim();
    }
  }
  return "";
}

function extractFirstParagraphFromGhost(ghostHtml: string): string {
  if (!ghostHtml) return "";
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(ghostHtml)) !== null) {
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const cleaned = text.replace(/^TL;DR:\s*/i, "").trim();
    if (cleaned.length < 60) continue;
    return cleaned;
  }
  return "";
}

function normalizeText(html: string): string {
  const stripped = htmlToText(html);
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

export function formatDateLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function normalizeImagePath(image: string): string {
  if (!image) return "";
  const ABS = "https://www.opticwise.com";
  if (image.startsWith(ABS)) return ".." + image.slice(ABS.length);
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return ".." + image;
  return image;
}

export type ExtractedPost = {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  secondaryCategories: string[];
  date: string;
  dateIso: string;
  image: string;
  body: string;
};

export function extractPost(slug: string, html: string): ExtractedPost {
  let ghostHtml = "";
  let body = "";
  const ghostMarker = '<div class="ghost-content">';
  const ghostStart = html.indexOf(ghostMarker);
  if (ghostStart !== -1) {
    const after = html.slice(ghostStart + ghostMarker.length);
    const closeIdx = after.indexOf("</div></div></section>");
    ghostHtml = closeIdx !== -1 ? after.slice(0, closeIdx) : after;
    body = normalizeText(ghostHtml).slice(0, BODY_CHAR_CAP);
  }

  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleM ? decodeEntities(titleM[1]).trim() : "";
  const h1Title = extractH1Text(html);
  const jsonLdHeadline = findJsonLdArticleField(html, "headline");

  let title: string;
  if (h1Title) title = h1Title;
  else if (jsonLdHeadline) title = jsonLdHeadline;
  else if (rawTitle && !isGenericTitle(rawTitle)) title = rawTitle;
  else title = slug;

  const descM = html.match(
    /<meta\s+name=["']description["']\s+content=(?:"([^"]*)"|'([^']*)')/i
  );
  const rawDesc = descM
    ? decodeEntities(descM[1] ?? descM[2] ?? "").trim()
    : "";
  const jsonLdDesc = findJsonLdArticleField(html, "description");

  let excerpt = "";
  if (rawDesc && !isGenericDescription(rawDesc)) excerpt = rawDesc;
  else if (jsonLdDesc && !isGenericDescription(jsonLdDesc))
    excerpt = jsonLdDesc;
  else excerpt = extractFirstParagraphFromGhost(ghostHtml);

  const ogImageM = html.match(
    /<meta\s+property=["']og:image["']\s+content=(?:"([^"]+)"|'([^']+)')/i
  );
  const rawImage = ogImageM ? (ogImageM[1] ?? ogImageM[2] ?? "") : "";
  const image =
    rawImage && !isGenericImage(rawImage) ? normalizeImagePath(rawImage) : "";

  const catM = html.match(
    /<span class="block text-xs font-bold text-blue-300 bg-blue-400\/10[^"]*">([\s\S]*?)<\/span>/
  );
  const category = catM ? decodeEntities(catM[1]).trim() : "";

  const secM = html.match(
    /<span\s+hidden\s+data-ow-secondary-cats="([^"]*)"\s*><\/span>/
  );
  const secondaryCategories = secM
    ? decodeEntities(secM[1])
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const dateM = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  const dateIso = dateM ? dateM[1] : "";
  const dateLabel = formatDateLabel(dateIso);

  return {
    slug,
    href: `../insights/${slug}/index.html`,
    title,
    excerpt,
    category,
    secondaryCategories,
    date: dateLabel,
    dateIso,
    image,
    body,
  };
}

export type SearchIndexEntry = {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  secondaryCategories: string[];
  date: string;
  image: string;
  body: string;
};

export function sortPostsNewestFirst(posts: ExtractedPost[]): ExtractedPost[] {
  return [...posts].sort((a, b) => {
    const ad = a.dateIso || "";
    const bd = b.dateIso || "";
    if (!ad && bd) return 1;
    if (ad && !bd) return -1;
    return bd.localeCompare(ad);
  });
}

export function toSearchIndexEntries(
  posts: ExtractedPost[]
): SearchIndexEntry[] {
  return posts.map((p) => ({
    slug: p.slug,
    href: p.href,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    secondaryCategories: p.secondaryCategories,
    date: p.date,
    image: p.image,
    body: p.body,
  }));
}

export function renderCard(p: ExtractedPost, index: number): string {
  const hidden = index >= INITIAL_VISIBLE ? " hidden" : "";
  const loading = index < EAGER_IMG_COUNT ? "eager" : "lazy";
  const altTitle = escapeAttr(p.title);

  const imgBlock = p.image
    ? `<div class="aspect-[16/9] overflow-hidden bg-gray-100"><img src="${escapeAttr(p.image)}" alt="${altTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="${loading}" decoding="async"/></div>`
    : `<div class="aspect-[16/9] overflow-hidden bg-gray-100"></div>`;

  const categoryBlock = p.category
    ? `<span class="inline-block text-xs font-bold text-ow-blue bg-blue-50 px-3 py-1 rounded-full mb-3">${escapeHtml(p.category)}</span>`
    : "";

  const excerptBlock = p.excerpt
    ? `<p class="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">${escapeHtml(p.excerpt)}</p>`
    : "";

  const dateBlock = p.date
    ? `<div class="flex items-center gap-2 text-xs text-gray-400"><span>${escapeHtml(p.date)}</span></div>`
    : `<div class="flex items-center gap-2 text-xs text-gray-400"></div>`;

  return (
    `<a class="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-ow-blue/20 transition-all no-underline" href="${escapeAttr(p.href)}" data-ow-slug="${escapeAttr(p.slug)}" data-ow-cat="${escapeAttr(p.category)}"${hidden}>` +
    imgBlock +
    `<div class="p-6">` +
    categoryBlock +
    `<h3 class="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-ow-blue transition-colors">${escapeHtml(p.title)}</h3>` +
    excerptBlock +
    dateBlock +
    `</div></a>`
  );
}

export function renderButtons(categories: string[]): string {
  const parts = [
    `<button class="role-tab active" data-ow-cat="All">All</button>`,
  ];
  for (const c of categories) {
    parts.push(
      `<button class="role-tab" data-ow-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>`
    );
  }
  return parts.join("");
}

export function replaceFiltersRow(html: string, buttonsHtml: string): string {
  const open = '<div class="flex flex-wrap justify-center gap-2">';
  const start = html.indexOf(open);
  if (start === -1)
    throw new Error("Filters row anchor not found in listing HTML");
  const innerStart = start + open.length;
  const close = "</div>";
  const end = html.indexOf(close, innerStart);
  if (end === -1) throw new Error("Filters row close not found in listing HTML");
  return html.slice(0, innerStart) + buttonsHtml + html.slice(end);
}

export function replaceGridSection(
  html: string,
  cardsHtml: string,
  totalCount: number
): string {
  const startMarker = '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"';
  const endAnchor = '<section class="relative overflow-hidden py-24">';
  const start = html.indexOf(startMarker);
  if (start === -1) throw new Error("Grid start anchor not found in listing HTML");
  const end = html.indexOf(endAnchor, start);
  if (end === -1) throw new Error("Grid end anchor not found in listing HTML");

  const initial = Math.min(INITIAL_VISIBLE, totalCount);
  const remaining = Math.max(0, totalCount - initial);
  const wrapStyle = remaining > 0 ? "" : ' style="display:none"';
  const loadMoreText =
    remaining > 0
      ? `Load more (<!-- -->${remaining}<!-- --> remaining)`
      : `Load more`;

  const replacement =
    `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" data-ow-insights-grid>` +
    cardsHtml +
    `</div>` +
    `<div aria-hidden="true" class="h-1 w-full"></div>` +
    `<div class="flex justify-center mt-10" data-ow-insights-loadmore-wrap${wrapStyle}>` +
    `<button type="button" class="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-ow-blue hover:text-ow-blue transition-colors" data-ow-insights-loadmore>${loadMoreText}</button>` +
    `</div>` +
    `<p class="mt-6 text-center text-xs text-gray-400" data-ow-insights-count>Showing <!-- -->${initial}<!-- --> of <!-- -->${totalCount}</p>` +
    `</div></section>`;

  return html.slice(0, start) + replacement + html.slice(end);
}

export function rebuildInsightsListingHtml(
  listingHtml: string,
  posts: ExtractedPost[]
): string {
  const sorted = sortPostsNewestFirst(posts);
  const categories = Array.from(
    new Set(sorted.map((p) => p.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "en"));
  const buttonsHtml = renderButtons(categories);
  const cardsHtml = sorted.map((p, i) => renderCard(p, i)).join("");
  let listing = listingHtml;
  listing = replaceFiltersRow(listing, buttonsHtml);
  listing = replaceGridSection(listing, cardsHtml, sorted.length);
  return listing;
}

export function rebuildSearchIndexJson(posts: ExtractedPost[]): string {
  const sorted = sortPostsNewestFirst(posts);
  return JSON.stringify(toSearchIndexEntries(sorted)) + "\n";
}
