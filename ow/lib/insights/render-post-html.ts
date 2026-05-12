import fs from "node:fs";
import path from "node:path";
import { escapeHtml, escapeAttr } from "./index-builder";

const SITE = "https://www.opticwise.com";
const libDir = path.join(process.cwd(), "lib", "insights");

function loadFragment(name: string): string {
  return fs.readFileSync(path.join(libDir, name), "utf8");
}

let navHtml: string | null = null;
let footerHtml: string | null = null;

export function getNavHtml(): string {
  if (!navHtml) navHtml = loadFragment("nav-insight.html");
  return navHtml;
}

export function getFooterHtml(): string {
  if (!footerHtml) footerHtml = loadFragment("footer-insight.html");
  return footerHtml;
}

export type InsightRenderInput = {
  slug: string;
  title: string;
  /** Page <title> — often shorter SEO title */
  documentTitle: string;
  excerpt: string;
  category: string;
  secondaryCategories: string[];
  bodyHtml: string;
  heroImageRelative: string;
  ogImageAbsolute: string;
  twitterImageAbsolute: string;
  seoDescription: string;
  ogTitle: string;
  twitterTitle: string;
  twitterDescription: string;
  datePublishedIso: string;
  dateModifiedIso: string;
  authorName: string;
  authorSlug: string;
  readingMinutes: number;
  topicClusterPaths: string[];
};

function heroSubtitle(excerpt: string, maxLen = 280): string {
  const t = excerpt.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1).trim() + "…";
}

export function renderInsightDocumentHtml(p: InsightRenderInput): string {
  const canonical = `${SITE}/insights/${p.slug}/`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: p.title,
        item: `${SITE}/insights/${p.slug}`,
      },
    ],
  };

  const authorUrl = `${SITE}/authors/${p.authorSlug}/`;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.seoDescription,
    image: p.ogImageAbsolute,
    datePublished: p.datePublishedIso,
    dateModified: p.dateModifiedIso,
    publisher: {
      "@type": "Organization",
      name: "OpticWise",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/images/ow_logo.png`,
      },
    },
    author: {
      "@type": "Person",
      "@id": `${authorUrl}#person`,
      name: p.authorName,
      url: authorUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
  };

  const secCats = p.secondaryCategories.filter(Boolean);
  const secondaryHidden =
    secCats.length > 0
      ? `<span hidden data-ow-secondary-cats="${escapeAttr(secCats.join(", "))}"></span>`
      : "";

  const publishedDate = new Date(p.datePublishedIso);
  const dateLine = publishedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const topicSection =
    p.topicClusterPaths.length > 0
      ? `<section class="topic-clusters" id="topic-clusters" style="padding:2rem 1rem 1rem;background:#f6f8fc;border-top:1px solid #d9deea"><div class="container" style="max-width:760px;margin:0 auto"><p class="eyebrow" style="color:#123b6d;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 .5rem">Topic clusters</p><p style="margin:0 0 .75rem;color:#5b6475;font-size:.95rem">This article is part of the following OpticWise topic clusters. Each pillar page summarises the topic and links to related Insights pieces:</p><div>${p.topicClusterPaths
          .map((href) => {
            const label = href
              .replace(/^\.\.\/\.\.\//, "")
              .replace(/\/index\.html$/, "")
              .replace(/-/g, " ");
            return `<a href="${escapeAttr(href)}" style="display:inline-block;margin:0 .5rem .5rem 0;padding:.4rem .9rem;border:1px solid #d9deea;border-radius:999px;font-size:.85rem;color:#123b6d;text-decoration:none">${escapeHtml(
              label
            )}</a>`;
          })
          .join("")}</div></div></section>`
      : "";

  const head = `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="image" imageSrcSet="../../images/ow_logo.png 1x, ../../images/ow_logo.png 2x"/><link rel="preload" as="image" href="${escapeAttr(p.heroImageRelative)}"/><link rel="preload" as="image" href="../../images/testimonial-bg.jpg"/><link rel="preconnect" href="https://fonts.googleapis.com/"/><link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="anonymous"/><title>${escapeHtml(p.documentTitle)}</title><meta name="description" content="${escapeAttr(p.seoDescription)}"/><link rel="canonical" href="${escapeAttr(canonical)}"/><meta property="og:title" content="${escapeAttr(p.ogTitle)}"/><meta property="og:description" content="${escapeAttr(p.seoDescription)}"/><meta property="og:url" content="${escapeAttr(`${SITE}/insights/${p.slug}`)}"/><meta property="og:site_name" content="OpticWise"/><meta property="og:image" content="${escapeAttr(p.ogImageAbsolute)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:type" content="article"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escapeAttr(p.twitterTitle)}"/><meta name="twitter:description" content="${escapeAttr(p.twitterDescription)}"/><meta name="twitter:image" content="${escapeAttr(p.twitterImageAbsolute)}"/><link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48"/><link rel="icon" href="/favicon.ico" sizes="32x32"/><link rel="icon" href="/favicon.png" type="image/png" sizes="32x32"/><link rel="icon" href="/icon.png" type="image/png" sizes="192x192"/><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&amp;family=Playfair+Display:wght@400;500;600;700;800;900&amp;display=swap" rel="stylesheet"/>
<!-- ow:strip-nextjs:assets -->
<link rel="stylesheet" href="/styles.css"/>
<link rel="stylesheet" href="/site.css"/>
<script src="/site.js" defer></script>
<script src="https://ownet.opticwise.com/forms/embed.js" defer></script>
<script src="/forms-embed.js?v=2" defer></script>
</head>`;

  const main = `<main><script type="application/ld+json">${JSON.stringify(breadcrumb)}</script><script type="application/ld+json">${JSON.stringify(article)}</script><section class="relative overflow-hidden pt-36 pb-16"><div class="absolute inset-0 z-0"><img src="${escapeAttr(p.heroImageRelative)}" alt="Cover image for &quot;${escapeAttr(p.title)}&quot;" class="w-full h-full object-cover"/></div><div class="hero-overlay"></div><div class="hero-grid-lines"></div><div class="relative z-10 ow-container max-w-3xl"><a class="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 mb-6 transition-colors" href="../../insights/index.html">← Back to Insights</a><span class="block text-xs font-bold text-blue-300 bg-blue-400/10 px-4 py-1.5 rounded-full w-fit mb-4">${escapeHtml(p.category)}</span>${secondaryHidden}<h1 class="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">${escapeHtml(p.title)}</h1><p class="text-lg text-white/70">${escapeHtml(heroSubtitle(p.excerpt))}</p><p class="text-sm text-white/40 mt-4">${escapeHtml(dateLine)}<!-- --> · ${p.readingMinutes} min read · By <a class="underline decoration-white/30 hover:decoration-white/70" href="../../authors/${escapeAttr(p.authorSlug)}/index.html">${escapeHtml(p.authorName)}</a></p></div></section><section class="ow-section bg-white"><div class="ow-container max-w-3xl mx-auto"><div class="ghost-content">${p.bodyHtml}</div></div></section><section class="relative overflow-hidden py-24"><div class="absolute inset-0 z-0"><img src="../../images/testimonial-bg.jpg" alt="" class="w-full h-full object-cover"/></div><div class="absolute inset-0 z-[1]" style="background:linear-gradient(135deg, rgba(43,108,176,.92), rgba(30,78,140,.95))"></div><div class="relative z-10 ow-container text-center"><p class="text-xs font-bold uppercase tracking-widest text-blue-200 mb-4">Your Next Step</p><h2 class="text-2xl lg:text-3xl font-extrabold text-white mb-4 leading-tight">Complimentary CRE Data &amp; Digital Review Session</h2><p class="text-base text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">One building. Map who owns what, where data lives, and where operational burden stacks up vs your KPIs.</p><div data-opticwise-form="schedule-review" data-eyebrow="YOUR NEXT STEP" data-heading="Complimentary CRE Data &amp; Digital Review Session" data-description="One building. Map who owns what, where data lives, and where operational burden stacks up vs your KPIs." data-show-header="false" class="ow-fe-cta-mount-inline"></div></div></section>${topicSection}</main>`;

  return `${head}<body><div hidden=""><!--$--></div>${getNavHtml()}${main}${getFooterHtml()}</body></html>`;
}

export function computeReadingMinutes(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function rewriteAssetUrlsInBody(
  body: string,
  insightId: string,
  slug: string,
  assets: { id: string; filename: string }[]
): string {
  let out = body;
  const relBase = `../../images/insights/${slug}/`;
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://ownet.opticwise.com");
  for (const a of assets) {
    const rel = `${relBase}${a.filename}`;
    const patterns = [
      `src="/api/insights/${insightId}/assets/${a.id}"`,
      `src='/api/insights/${insightId}/assets/${a.id}'`,
      `src="${origin}/api/insights/${insightId}/assets/${a.id}"`,
    ];
    for (const pat of patterns) {
      const rep = pat.startsWith(`src='`)
        ? `src='${rel}'`
        : `src="${rel}"`;
      out = out.split(pat).join(rep);
    }
  }
  return out;
}
