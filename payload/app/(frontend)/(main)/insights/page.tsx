import type { Metadata } from "next";
import { getAllPosts } from "@/lib/payload-helpers";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";
import { InsightsGrid } from "@/components/InsightsGrid";
import { getMediaUrl } from "@/lib/payload-helpers";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Insights for Owners Who Want Control",
  description:
    "Owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset.",
};

export default async function InsightsPage() {
  const posts = await getAllPosts();

  const postCards = posts.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    featureImageUrl: getMediaUrl(p.featureImage),
    categoryName: typeof p.category === "object" ? p.category?.title : null,
    publishedAt: p.publishedAt,
    readingTime: p.readingTime,
    tags: (p.tags || []).map((t: any) => (typeof t === "object" ? t.title : t)).filter(Boolean),
  }));

  const allTags = Array.from(
    new Set(postCards.flatMap((p: any) => p.tags || []))
  ).sort() as string[];

  return (
    <>
      <SubpageHero
        title="Insights for Owners Who Want Control"
        lead="This is where we publish the owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset."
        badge="Resources"
      />

      <InsightsGrid posts={postCards} tags={allTags} />

      <CTASection />

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
