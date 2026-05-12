import {
  type ExtractedPost,
  formatDateLabel,
  htmlToText,
  normalizeImagePath,
  rebuildInsightsListingHtml,
  rebuildSearchIndexJson,
  BODY_CHAR_CAP,
  type SearchIndexEntry,
  parseListingDateLabelToIso,
} from "./index-builder";
import {
  buildInsightRssItem,
  insertOrReplaceInsightSitemapUrl,
  insertRssItem,
} from "./sitemap-rss";
import {
  computeReadingMinutes,
  renderInsightDocumentHtml,
  rewriteAssetUrlsInBody,
} from "./render-post-html";
import { fetchRepoFileUtf8, pushFilesToRepo, type RepoFile } from "./github-push";
import type { Insight, InsightAsset, User } from "@prisma/client";

const SITE = "https://www.opticwise.com";

export function slugifySegment(s: string): string {
  const x = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
  return x || "post";
}

function searchEntryToExtracted(e: SearchIndexEntry): ExtractedPost {
  const dateIso =
    e.dateIso && e.dateIso.length > 0
      ? e.dateIso
      : parseListingDateLabelToIso(e.date);
  return {
    slug: e.slug,
    href: e.href,
    title: e.title,
    excerpt: e.excerpt,
    category: e.category,
    secondaryCategories: e.secondaryCategories || [],
    date: e.date,
    dateIso,
    image: e.image,
    body: e.body,
  };
}

function publishedInsightToExtracted(
  insight: Insight & { assets: InsightAsset[] },
  slug: string,
  heroFileName: string,
  bodyHtml: string
): ExtractedPost {
  const dp = insight.datePublished ?? new Date();
  const dateIso = dp.toISOString();
  const body = htmlToText(bodyHtml)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, BODY_CHAR_CAP);
  const absImg = `${SITE}/images/insights/${slug}/${heroFileName}`;
  return {
    slug,
    href: `../insights/${slug}/index.html`,
    title: insight.title,
    excerpt: insight.excerpt || insight.seoDescription || "",
    category: insight.category,
    secondaryCategories: insight.secondaryCategories || [],
    date: formatDateLabel(dateIso),
    dateIso,
    image: normalizeImagePath(absImg),
    body,
  };
}

export function buildPublishedHtmlAndFiles(
  insight: Insight & { assets: InsightAsset[]; author: User }
): { files: RepoFile[]; commitMessage: string; bodyProcessed: string; slug: string } {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(insight.slug)) {
    throw new Error("Slug must be lowercase letters, numbers, and hyphens only");
  }
  if (!insight.title?.trim()) throw new Error("Title is required");
  if (!insight.category?.trim()) throw new Error("Category is required");
  if (!insight.bodyHtml?.trim()) throw new Error("Body is required");

  const heroAsset = insight.assets.find((a) => a.kind === "hero");
  if (!heroAsset) {
    throw new Error('Upload a hero image (use "Set as hero" / hero upload on the form)');
  }

  const slug = insight.slug;
  const now = new Date();
  const datePublished = insight.datePublished ?? now;
  const dateModified = now;

  const imageDir = `images/insights/${slug}`;
  const heroFileName = heroAsset.filename;
  const heroRelative = `../../${imageDir}/${heroFileName}`;
  const ogAbsolute = `${SITE}/${imageDir}/${heroFileName}`;

  const allAssetsForRewrite = insight.assets.map((a) => ({
    id: a.id,
    filename: a.filename,
  }));
  const bodyProcessed = rewriteAssetUrlsInBody(
    insight.bodyHtml,
    insight.id,
    slug,
    allAssetsForRewrite
  );

  const authorSlug =
    insight.authorSlug ||
    slugifySegment(insight.author.name || insight.author.email.split("@")[0]);
  const authorName = insight.author.name || "OpticWise";
  const readingMinutes =
    insight.readingTimeMinutes ?? computeReadingMinutes(bodyProcessed);

  const excerpt = (insight.excerpt || insight.seoDescription || "").trim();
  const seoDescription = (insight.seoDescription || excerpt || insight.title).slice(
    0,
    320
  );
  const docTitle =
    (insight.seoTitle?.trim() && `${insight.seoTitle.trim()} | OpticWise`) ||
    `${insight.title} | OpticWise`;
  const ogTitle = insight.seoTitle?.trim() || insight.title;
  const twitterTitle =
    insight.twitterTitle?.trim() || insight.seoTitle?.trim() || insight.title;
  const twitterDescription =
    insight.twitterDescription?.trim() || seoDescription;

  let twitterImageAbsolute = ogAbsolute;
  const twPath = insight.twitterImagePath?.trim();
  if (twPath) {
    twitterImageAbsolute = twPath.startsWith("http")
      ? twPath
      : `${SITE}/${twPath.replace(/^\//, "")}`;
  }

  const docHtml = renderInsightDocumentHtml({
    slug,
    title: insight.title,
    documentTitle: docTitle,
    excerpt: excerpt || seoDescription,
    category: insight.category,
    secondaryCategories: insight.secondaryCategories || [],
    bodyHtml: bodyProcessed,
    heroImageRelative: heroRelative,
    ogImageAbsolute: ogAbsolute,
    twitterImageAbsolute,
    seoDescription,
    ogTitle,
    twitterTitle,
    twitterDescription,
    datePublishedIso: datePublished.toISOString(),
    dateModifiedIso: dateModified.toISOString(),
    authorName,
    authorSlug,
    readingMinutes,
    topicClusterPaths: insight.topicClusterPaths || [],
  });

  const files: RepoFile[] = [{ path: `insights/${slug}/index.html`, content: docHtml }];

  for (const a of insight.assets) {
    const buf = Buffer.from(a.bytes);
    files.push({
      path: `${imageDir}/${a.filename}`,
      content: buf,
    });
  }

  const commitMessage = `insight: publish "${insight.title}" (${slug})`;
  return { files, commitMessage, bodyProcessed, slug };
}

export async function publishInsightToGitHub(
  insight: Insight & { assets: InsightAsset[]; author: User }
): Promise<{ sha: string }> {
  const heroAsset = insight.assets.find((a) => a.kind === "hero");
  if (!heroAsset) throw new Error("Hero image missing");

  const { files: staticFiles, commitMessage, bodyProcessed, slug } =
    buildPublishedHtmlAndFiles(insight);

  const listingHtml = await fetchRepoFileUtf8("insights/index.html");
  if (!listingHtml) {
    throw new Error("Could not fetch insights/index.html from opticwise-html");
  }

  const searchJsonRaw = await fetchRepoFileUtf8("insights/search-index.json");
  if (!searchJsonRaw) {
    throw new Error("Could not fetch insights/search-index.json");
  }
  const searchEntries = JSON.parse(searchJsonRaw) as SearchIndexEntry[];
  const without = searchEntries.filter((e) => e.slug !== slug);

  const newEntry = publishedInsightToExtracted(
    insight,
    slug,
    heroAsset.filename,
    bodyProcessed
  );

  const posts: ExtractedPost[] = [
    ...without.map(searchEntryToExtracted),
    newEntry,
  ];

  const listingOut = rebuildInsightsListingHtml(listingHtml, posts);
  const searchOut = rebuildSearchIndexJson(posts);

  const sitemapXml = await fetchRepoFileUtf8("sitemap.xml");
  if (!sitemapXml) throw new Error("Could not fetch sitemap.xml");
  const sitemapOut = insertOrReplaceInsightSitemapUrl(
    sitemapXml,
    slug,
    (insight.datePublished ?? new Date()).toISOString()
  );

  const feedXml = await fetchRepoFileUtf8("blog/feed.xml");
  if (!feedXml) throw new Error("Could not fetch blog/feed.xml");

  const rssItem = buildInsightRssItem({
    title: insight.title,
    slug,
    description: (insight.seoDescription || insight.excerpt || insight.title).slice(
      0,
      500
    ),
    datePublishedIso: (insight.datePublished ?? new Date()).toISOString(),
  });
  const feedOut = insertRssItem(feedXml, rssItem);

  const allFiles: RepoFile[] = [
    ...staticFiles,
    { path: "insights/index.html", content: listingOut },
    { path: "insights/search-index.json", content: searchOut },
    { path: "sitemap.xml", content: sitemapOut },
    { path: "blog/feed.xml", content: feedOut },
  ];

  return pushFilesToRepo(allFiles, commitMessage);
}
