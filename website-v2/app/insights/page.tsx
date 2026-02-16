import type { Metadata } from "next";
import Link from "next/link";
import { listInsightPosts } from "@/lib/content";
import { SchemaJsonLd } from "@/components/SchemaJsonLd";
import { PageHero } from "@/components/PageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Insights for Owners Who Want Control",
  description:
    "Owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset.",
};

const categories = [
  { name: "NOI Growth", color: "bg-blue-100 text-blue-700" },
  { name: "Tenant Experience", color: "bg-green-100 text-green-700" },
  { name: "Operational Control", color: "bg-purple-100 text-purple-700" },
  { name: "Future-proofing / AI Readiness", color: "bg-amber-100 text-amber-700" },
];

const ownerPlays = [
  'The "Admin Credentials" play (who really controls the building)',
  'The "Export Rights" play (contract language that prevents lock-in)',
  'The "No Shadow Networks" play (OT governance that stops fragmentation)',
  'The "Portfolio Standard" play (standardize once so outcomes compound)',
  'The "Connectivity Economics" play (stop revenue-share leakage)',
  'The "Diligence Story" play (reduce risk with governed, auditable data)',
];

export default function InsightsPage() {
  const posts = listInsightPosts();

  return (
    <>
      <SchemaJsonLd path="/insights/" />

      <PageHero
        title="Insights for Owners Who Want Control"
        description="This is where we publish the owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset."
        showCTA={false}
        compact
      />

      {/* Featured Insights */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="max-w-5xl mx-auto">
            <h2 className="ow-section-title">Featured Insights</h2>
            <p className="text-gray-600 mb-8">
              Start here if you&apos;re making decisions this quarter:
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              {[
                "Own vs lease your building's data (what changes when vendors control exports)",
                "NOI isn't just finance anymore — it's data & digital infrastructure",
                "AI readiness is a data & digital infrastructure ownership decision",
              ].map((item, i) => (
                <div key={i} className="ow-card ow-card-hover p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ow-blue/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-ow-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {item}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Most Read */}
            <h2 className="ow-section-title">Most Read (Owner Plays)</h2>
            <p className="text-gray-600 mb-6">
              Recurring plays you can run without a data team:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-12">
              {ownerPlays.map((play, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-ow-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm text-gray-700">{play}</span>
                </div>
              ))}
            </div>

            {/* Categories */}
            <h2 className="ow-section-title">Categories</h2>
            <p className="text-gray-600 mb-6">
              Explore by outcomes (not tech):
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className={`rounded-xl px-4 py-3 text-sm font-medium text-center ${cat.color}`}
                >
                  {cat.name}
                </div>
              ))}
            </div>

            {/* All Posts */}
            {posts.length > 0 && (
              <>
                <h2 className="ow-section-title">All Insights</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {posts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/insights/${post.slug}/`}
                      className="ow-card ow-card-hover group"
                    >
                      {post.category && (
                        <span className="text-xs font-medium text-ow-blue bg-ow-blue/10 px-2.5 py-1 rounded-full">
                          {post.category}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 mt-3 group-hover:text-ow-blue transition-colors">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {post.description}
                        </p>
                      )}
                      {post.date && (
                        <p className="text-xs text-gray-400 mt-3">
                          {post.date}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* How to Use */}
            <div className="ow-callout mt-12">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                How to Use These Insights
              </h3>
              <p className="text-gray-600 mb-2">
                Don&apos;t treat this as content. Treat it as an operating cadence.
              </p>
              <p className="text-gray-500 italic text-sm m-0">
                If you had monthly &quot;plays&quot; (not dashboards), what 3 decisions
                would you want to make better?
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTASection variant="blue" />
    </>
  );
}
