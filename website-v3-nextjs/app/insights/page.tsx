import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/ghost";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Insights for Owners Who Want Control",
  description: "Owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset.",
};

export default async function InsightsPage() {
  const posts = await getAllPosts();

  return (
    <>
      <SubpageHero
        title="Insights for Owners Who Want Control"
        lead="This is where we publish the owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset."
        badge="Resources"
        bgImage="/images/hero-industry.jpg"
      />

      <section className="ow-section bg-white">
        <div className="ow-container max-w-4xl mx-auto">
          {posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/insights/${post.slug}/`}
                  className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 hover:border-ow-blue/20 transition-all"
                >
                  {post.primary_tag && (
                    <span className="text-xs font-semibold text-ow-blue bg-blue-50 px-3 py-1 rounded-full">
                      {post.primary_tag.name}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 mt-3 group-hover:text-ow-blue transition-colors">
                    {post.title}
                  </h3>
                  {post.custom_excerpt && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{post.custom_excerpt}</p>
                  )}
                  {post.published_at && (
                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-2">Insights coming soon.</p>
              <p className="text-sm">Blog posts will appear here once Ghost CMS is connected and content is published.</p>
            </div>
          )}
        </div>
      </section>

      <CTASection />
    </>
  );
}
