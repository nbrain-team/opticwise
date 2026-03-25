import type { Metadata } from "next";
import Link from "next/link";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Insights for Owners Who Want Control",
  description:
    "Owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset.",
};

const OWNER_PLAYS = [
  "Admin Credentials: Who holds the keys to your building systems?",
  "Export Rights: Can you pull clean data from every vendor platform?",
  "No Shadow Networks: Eliminate vendor-installed pathways you don\u2019t control.",
  "Portfolio Standard: Standardize once, deploy across every asset.",
  "Connectivity Economics: Stop leaking revenue through fragmented ISP deals.",
  "Diligence Story: Build the infrastructure narrative that institutional buyers want.",
];

export default function InsightsPage() {
  return (
    <>
      <SubpageHero
        title="Insights for Owners Who Want Control"
        lead="This is where we publish the owner plays: how to reclaim control, reduce operational risk, and turn data & digital infrastructure into a compounding portfolio asset."
        badge="Resources"
      />

      {/* ==================== FEATURED INSIGHTS ==================== */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">Start Here</span>
            <h2 className="section-heading">Featured Insights</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle">Essential reads for any CRE owner ready to take control of their data &amp; digital infrastructure.</p>
          </div>
          <div className="outcome-grid" style={{ maxWidth: 800, margin: "0 auto" }}>
            <Link href="/insights/owner-play-stop-vendor-control/" className="outcome-card" style={{ textDecoration: "none" }}>
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3>Owner Play: Stop Letting Vendors Own Your D&amp;DI</h3>
              <p>A simple monthly play to reclaim control without adding burden to your on-site team.</p>
            </Link>
            <Link href="/insights/noi-is-data-and-digital-infrastructure/" className="outcome-card" style={{ textDecoration: "none" }}>
              <div className="outcome-icon" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3>NOI Isn&rsquo;t Just Finance&mdash;It&rsquo;s Data &amp; Digital Infrastructure</h3>
              <p>Where NOI leaks when connectivity and data rights are treated as vendor decisions.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== OWNER PLAYS ==================== */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">Most Read</span>
            <h2 className="section-heading">Owner Plays</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle">The operational plays CRE owners are using to reclaim control, building by building.</p>
          </div>
          <div className="deliverables">
            {OWNER_PLAYS.map((play, i) => (
              <div key={i} className="deliverable">
                <div className="deliverable-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="deliverable-body">
                  <h3 style={{ marginBottom: 0 }}>{play}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CATEGORIES ==================== */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">Browse</span>
            <h2 className="section-heading">Categories</h2>
            <div className="accent-bar accent-bar-center" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "NOI Growth", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "Tenant Experience Outcomes", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { label: "Operational Control", color: "bg-amber-50 text-amber-700 border-amber-200" },
              { label: "Future-Proofing / AI Readiness", color: "bg-violet-50 text-violet-700 border-violet-200" },
            ].map((cat) => (
              <span key={cat.label} className={`inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold border ${cat.color}`}>
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW TO USE ==================== */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="callout-bar" style={{ maxWidth: 720 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p><strong>How to use these insights:</strong> Don&rsquo;t treat this as content. Treat it as an operating cadence. Pick one play per month. Run it against one building. Measure what changes.</p>
          </div>
        </div>
      </section>

      <CTASection />

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
