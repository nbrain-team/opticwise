import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/ghost";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";
import { InsightsGrid } from "@/components/InsightsGrid";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Insights for Owners Who Want Control",
  description:
    "Owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset.",
};

export default async function InsightsPage() {
  const posts = await getAllPosts();

  const allTags = Array.from(
    new Set(posts.flatMap((p) => p.tags?.map((t) => t.name) ?? []))
  ).sort();

  return (
    <>
      <SubpageHero
        title="Insights for Owners Who Want Control"
        lead="This is where we publish the owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset."
        badge="Resources"
      />

      <InsightsGrid posts={posts} tags={allTags} />

      <CTASection />

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
