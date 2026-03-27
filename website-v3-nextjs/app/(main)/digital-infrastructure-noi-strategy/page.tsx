import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure NOI Strategy",
  description:
    "Data & digital infrastructure NOI strategy is the intentional design, ownership, and control of a property\u2019s networks, systems, and data to directly increase net operating income.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Data & Digital Infrastructure NOI Strategy"
        lead="Data & digital infrastructure NOI strategy is the intentional design, ownership, and control of a property&#8217;s networks, systems, and data to directly increase net operating income, reduce operational risk, and protect long-term asset value."
        badge="Pillar"
      />

      {/* The Shift */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">The Shift</span>
            <h2 className="section-heading">Why NOI Is Now a Data &amp; Digital Infrastructure Decision</h2>
            <div className="accent-bar accent-bar-center"></div>
          </div>
          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Networks Are No Longer Background Utilities</h3>
                <p>For years, owners treated networks as background utilities&mdash;something the IT vendor handled. Today, the foundation determines everything downstream:</p>
                <ul>
                  <li>Who controls connectivity economics</li>
                  <li>Whether operations are manual or coordinated</li>
                  <li>Whether data is usable or trapped</li>
                  <li>Whether AI can function at all</li>
                </ul>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>The Foundation Shapes Every Outcome</h3>
                <p>NOI isn&rsquo;t just a financial metric anymore. It&rsquo;s determined by who owns the infrastructure that generates, moves, and governs the data your building runs on.</p>
                <p>If that infrastructure is fragmented, siloed, or vendor-controlled, NOI leaks&mdash;quietly, consistently, and at scale.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where NOI Leaks Today */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">The Problem</span>
            <h2 className="section-heading">Where NOI Leaks Today</h2>
            <div className="accent-bar accent-bar-center"></div>
            <p className="section-subtitle">Most owners don&rsquo;t see these leaks because they&rsquo;re embedded in contracts, workflows, and vendor defaults.</p>
          </div>
          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              </div>
              <h3>Revenue-Share Agreements</h3>
              <p>Vendors capture the economics of connectivity you should own</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              </div>
              <h3>Redundant Infrastructure</h3>
              <p>Multiple overlapping networks nobody mapped or consolidated</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>
              </div>
              <h3>Data Trapped in Dashboards</h3>
              <p>Insights you can see but can&rsquo;t export, combine, or govern</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <h3>Manual Operations</h3>
              <p>Workflows that should be automated but aren&rsquo;t because systems don&rsquo;t talk</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
              </div>
              <h3>Integration Fragility</h3>
              <p>One vendor change breaks three others</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <h3>Portfolio Inconsistency</h3>
              <p>Every building is a one-off; nothing compounds</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Owner-Control Advantage */}
      <section className="section section-dark">
        <div className="ow-container">
          <div className="section-header section-header-light">
            <span className="section-eyebrow section-eyebrow-light">The Advantage</span>
            <h2 className="section-heading section-heading-light">The Owner-Control Advantage</h2>
            <div className="accent-bar accent-bar-center"></div>
            <p className="section-subtitle" style={{ color: "rgba(255,255,255,.7)" }}>You&rsquo;re not upgrading tech. You&rsquo;re upgrading your business model.</p>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              <h3>Higher Effective Revenue</h3>
              <p>Own connectivity economics instead of sharing them with vendors</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <h3>Lower OpEx</h3>
              <p>Coordinated operations replace manual patchwork</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              <h3>Reduced Risk</h3>
              <p>Governance baked in means fewer surprises during diligence</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              <h3>Portfolio Compounding</h3>
              <p>Standardize once, scale across every building</p>
            </div>
          </div>
        </div>
      </section>

      {/* PPP 5C */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">The Path</span>
            <h2 className="section-heading">The Path: PPP 5C&trade;</h2>
            <div className="accent-bar accent-bar-center"></div>
            <p className="section-subtitle">From fragmented to owner-controlled. Five steps that build on each other.</p>
          </div>
          <div className="ppp-timeline">
            <div className="ppp-step ppp-step-active">
              <div className="ppp-step-num">1</div>
              <div className="ppp-step-body">
                <h3>Clarify <span className="ppp-badge">PPP Audit&trade;</span></h3>
                <p>Map what you own, where value leaks, and what&rsquo;s trustworthy and portable</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">2</div>
              <div className="ppp-step-body">
                <h3>Connect</h3>
                <p>Create a resilient digital backbone that links systems, platforms, and devices</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">3</div>
              <div className="ppp-step-body">
                <h3>Collect</h3>
                <p>Aggregate high-fidelity usable data across the property</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">4</div>
              <div className="ppp-step-body">
                <h3>Coordinate</h3>
                <p>Align vendors, workflows, and automation using governed data</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">5</div>
              <div className="ppp-step-body">
                <h3>Control</h3>
                <p>Reclaim ownership of your data &amp; digital infrastructure so you stay platform-flexible</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">Questions</span>
            <h2 className="section-heading">Frequently Asked Questions</h2>
            <div className="accent-bar accent-bar-center"></div>
          </div>
          <div className="faq-list">
            <details className="faq-item" open>
              <summary>
                <span className="faq-q">How does data &amp; digital infrastructure increase NOI?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">Four ways: (1) revenue economics&mdash;own connectivity instead of sharing margins with vendors; (2) lower costs&mdash;coordinated operations replace manual patchwork; (3) lower risk&mdash;governance baked in reduces diligence exposure; (4) long-term control&mdash;a standardized foundation compounds across every property.</div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Is this about adding more technology?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">No. It&rsquo;s about who controls the economics. Technology is the means; ownership is the strategy. When you control the foundation, you control the outcomes&mdash;regardless of which platforms, vendors, or tools sit on top.</div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">What&rsquo;s the first step?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">Start with Clarify. The PPP Audit&trade; maps what you own, where value is leaking, who&rsquo;s accountable, and what data is trustworthy and portable&mdash;so you can standardize once and scale.</div>
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
