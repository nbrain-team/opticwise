import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEditor } from "@/lib/require-editor";
import {
  computeReadingMinutes,
  renderInsightDocumentHtml,
  rewriteAssetUrlsInBody,
} from "@/lib/insights/render-post-html";
import { slugifySegment } from "@/lib/insights/publish";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const insight = await prisma.insight.findUnique({
    where: { id },
    include: { assets: true, author: true },
  });
  if (!insight) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const slug = insight.slug;
  const heroAsset = insight.assets.find((a) => a.kind === "hero");
  const imageDir = `images/insights/${slug}`;
  const heroFileName = heroAsset?.filename ?? "placeholder.png";
  const heroRelative = heroAsset
    ? `../../${imageDir}/${heroAsset.filename}`
    : "../../images/ow_logo.png";
  const ogAbsolute = heroAsset
    ? `https://www.opticwise.com/${imageDir}/${heroAsset.filename}`
    : "https://www.opticwise.com/images/ow_logo.png";

  const bodyProcessed = rewriteAssetUrlsInBody(
    insight.bodyHtml,
    insight.id,
    slug,
    insight.assets.map((a) => ({ id: a.id, filename: a.filename }))
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

  const dp = insight.datePublished ?? new Date();

  const html = renderInsightDocumentHtml({
    slug,
    title: insight.title,
    documentTitle: docTitle + " [Preview]",
    excerpt: excerpt || seoDescription,
    category: insight.category || "Category",
    secondaryCategories: insight.secondaryCategories || [],
    bodyHtml: bodyProcessed || "<p><em>Start writing in the editor.</em></p>",
    heroImageRelative: heroRelative,
    ogImageAbsolute: ogAbsolute,
    twitterImageAbsolute: ogAbsolute,
    seoDescription,
    ogTitle,
    twitterTitle,
    twitterDescription,
    datePublishedIso: dp.toISOString(),
    dateModifiedIso: new Date().toISOString(),
    authorName,
    authorSlug,
    readingMinutes,
    topicClusterPaths: insight.topicClusterPaths || [],
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
