import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Control of CRE Digital Visibility",
  description:
    "Control of CRE digital visibility is the ability of a commercial real estate owner to govern how their building, performance, and data context are represented across search engines, AI systems, and digital platforms.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Control of CRE Digital Visibility"
        lead="The ability to govern how your building, performance, and data context are represented across search engines, AI systems, and digital platforms."
        badge="Pillar"
      />

      {/* Context */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">Context</p>
            <h2 className="section-heading">Visibility Is an Infrastructure Outcome</h2>
            <p className="section-subtitle">
              How your building appears online is no longer a marketing problem. It is a data and infrastructure problem.
            </p>
          </div>

          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Beyond Listings &amp; Reviews</h3>
                <p>Digital visibility is not just your Google profile. It is every data point about your building that search engines, AI systems, and platforms use to rank, describe, and recommend your property.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>Fragmented Data, Fragmented Narrative</h3>
                <p>When building data lives in vendor silos, the story your property tells online is written by those vendors — not by you. Inconsistencies, gaps, and outdated information become your default identity.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">03</div>
              <div className="deliverable-body">
                <h3>The New Default</h3>
                <p>AI systems now synthesize building data from dozens of sources to generate summaries, comparisons, and recommendations. If you don&apos;t control your data, you don&apos;t control what AI says about your building.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Problem</p>
            <h2 className="section-heading">How Owners Lose Control of Visibility</h2>
            <p className="section-subtitle">
              Visibility erodes silently. By the time you notice, the narrative has already been set by someone else.
            </p>
          </div>

          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3>Search Engines Define You</h3>
              <p>Google and AI search tools pull data from wherever they find it — often incomplete, outdated, or vendor-filtered</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <h3>Vendors Control the Narrative</h3>
              <p>Listing platforms, review sites, and service providers publish their version of your property — not yours</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3>AI Summaries Are Unverified</h3>
              <p>AI tools synthesize building data from scattered sources — creating confident-sounding summaries that may be wrong</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </div>
              <h3>No Single Source of Truth</h3>
              <p>Without owner-controlled data, there is no authoritative version of your building&apos;s digital identity</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Alternative */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Alternative</p>
            <h2 className="section-heading">Owner-Controlled Visibility</h2>
            <p className="section-subtitle">
              When owners control their infrastructure and data, they control the story. Visibility becomes an asset, not a liability.
            </p>
          </div>

          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Authoritative Data Source</h3>
              <p>Your building&apos;s data comes from your infrastructure — verified, current, and owner-controlled</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3>Search &amp; AI Alignment</h3>
              <p>Structured data feeds ensure search engines and AI systems represent your property accurately</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8m8 4H8m2-8H8"/></svg>
              </div>
              <h3>Consistent Narrative</h3>
              <p>One version of truth across all platforms — listings, reviews, AI summaries, and investor materials</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3>Competitive Differentiation</h3>
              <p>Properties that control their visibility stand out — to tenants, investors, and AI-driven discovery tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Framework */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Framework</p>
            <h2 className="section-heading">PPP 5C&trade; — The Path to Controlled Visibility</h2>
            <p className="section-subtitle">
              Visibility is not a marketing project. It is an infrastructure outcome built through the same ownership framework.
            </p>
          </div>

          <div className="ppp-timeline">
            <div className="ppp-step ppp-step-active">
              <div className="ppp-step-num">1</div>
              <div className="ppp-step-body">
                <h3>Clarify <span className="ppp-badge">PPP Audit&trade;</span></h3>
                <p>Map how your building appears across search, AI, and vendor platforms. Identify who controls the data that defines your digital identity.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">2</div>
              <div className="ppp-step-body">
                <h3>Connect</h3>
                <p>Build an owner-controlled data backbone that feeds accurate, structured information to search engines, AI systems, and digital platforms.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">3</div>
              <div className="ppp-step-body">
                <h3>Collect</h3>
                <p>Aggregate building performance data, tenant context, and operational metrics in formats that can be published and verified by the owner.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">4</div>
              <div className="ppp-step-body">
                <h3>Coordinate</h3>
                <p>Align vendors, listing platforms, and data feeds so your building&apos;s digital identity is consistent, current, and owner-authorized.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">5</div>
              <div className="ppp-step-body">
                <h3>Control</h3>
                <p>Maintain ongoing governance of your digital visibility — ensuring accuracy, authority, and competitive positioning as AI discovery evolves.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-heading">Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            <details className="faq-item">
              <summary>
                <span className="faq-q">Isn&apos;t digital visibility just a marketing problem?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Not anymore. AI systems, search engines, and platforms now pull data from operational systems — not just marketing materials. If you don&apos;t control the data infrastructure, you don&apos;t control what the world sees. Visibility is now an infrastructure outcome.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">How does AI affect my building&apos;s digital presence?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                AI tools like ChatGPT, Google SGE, and Perplexity synthesize building data from dozens of sources to generate summaries and recommendations. Without owner-controlled structured data, these summaries may be inaccurate, outdated, or based on vendor-filtered information.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">What can I do right now to improve my building&apos;s digital visibility?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Start with a PPP Audit&trade; to map how your building currently appears across digital platforms, which vendors control which data, and where gaps or inaccuracies exist. From there, the 5C framework builds a path to owner-controlled visibility.
              </div>
            </details>
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
