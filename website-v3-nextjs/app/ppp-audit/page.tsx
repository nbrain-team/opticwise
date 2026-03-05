import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "PPP Audit™ | OpticWise",
  description:
    "The PPP Audit™ is OpticWise's Clarify entry point — mapping what you own, where value leaks, and who controls your data & digital infrastructure.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="PPP Audit™"
        badge="Service · Clarify"
        lead="PPP — Property. Platform. Provider. — is OpticWise's owner-first operating model for data &amp; digital infrastructure. The PPP Audit™ is the Clarify entry point: a structured diagnostic that maps what you own, where value leaks, and who is actually accountable across your building's digital stack."
      />

      {/* ── What It Does ── */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">Diagnostic</p>
            <h2 className="section-heading">What It Does</h2>
            <p className="section-subtitle">
              The PPP Audit™ answers five questions every owner should be able to answer — but almost none can today.
            </p>
          </div>

          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <h3>What you own</h3>
              <p>Infrastructure, contracts, data rights, and control points mapped clearly.</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3>Where value is leaking</h3>
              <p>Revenue-share agreements, redundant spend, and hidden vendor margin identified.</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <h3>Who is accountable</h3>
              <p>Vendor roles, SLAs, and ownership gaps surfaced across every system.</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3>What data is trustworthy</h3>
              <p>Data sources evaluated for accuracy, accessibility, and portability.</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <h3>Where you have least control</h3>
              <p>Lock-in risks, data silos, and single-vendor dependencies exposed.</p>
            </div>
          </div>

          <div className="callout-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p>This is not a &ldquo;tech assessment.&rdquo; It&rsquo;s an ownership and operating model reset.</p>
          </div>
        </div>
      </section>

      {/* ── Deliverables ── */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">What You Receive</p>
            <h2 className="section-heading">Deliverables</h2>
          </div>

          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Ownership + Control Map</h3>
                <p>A visual map of every system, vendor, data source, and contract — showing who owns what, who controls what, and where gaps exist.</p>
                <ul>
                  <li>Network and connectivity inventory</li>
                  <li>Vendor contract and SLA alignment</li>
                  <li>Data access and portability assessment</li>
                </ul>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>KPI Alignment Scoreboard</h3>
                <p>A scoring framework that maps every digital system to the KPIs it should be supporting — and shows where misalignment creates cost or risk.</p>
                <ul>
                  <li>NOI impact per system category</li>
                  <li>Tenant experience alignment</li>
                  <li>Operational burden vs. value delivered</li>
                </ul>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">03</div>
              <div className="deliverable-body">
                <h3>A Repeatable Standard</h3>
                <p>Not a one-time report. The PPP Audit™ creates a baseline that can be applied across every property in a portfolio — making infrastructure governance scalable.</p>
                <ul>
                  <li>Portfolio-ready scoring template</li>
                  <li>Benchmarking across buildings</li>
                  <li>Foundation for PPP 5C™ execution</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Framework ── */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">PPP 5C™ Framework</p>
            <h2 className="section-heading">The Framework</h2>
            <p className="section-subtitle">
              The PPP Audit™ is the first step in OpticWise&apos;s PPP 5C™ framework — a repeatable process that moves owners from clarity to control.
            </p>
          </div>

          <div className="ppp-timeline">
            <div className="ppp-step ppp-step-active">
              <div className="ppp-step-num">1</div>
              <div className="ppp-step-body">
                <h3>Clarify <span className="ppp-badge">PPP Audit™</span></h3>
                <p>Map what you own, where value leaks, and who is accountable. Establish the baseline.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">2</div>
              <div className="ppp-step-body">
                <h3>Connect</h3>
                <p>Create a resilient digital backbone that links systems, platforms, and devices under owner control.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">3</div>
              <div className="ppp-step-body">
                <h3>Collect</h3>
                <p>Aggregate high-fidelity, usable data from across your property in formats you control.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">4</div>
              <div className="ppp-step-body">
                <h3>Coordinate</h3>
                <p>Align vendors, workflows, and accountability so operations become predictable.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">5</div>
              <div className="ppp-step-body">
                <h3>Control</h3>
                <p>Reclaim ownership and stay platform-flexible over time. Infrastructure serves your NOI.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Audience ── */}
      <section className="section section-dark">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow section-eyebrow-light">Who It&apos;s For</p>
            <h2 className="section-heading section-heading-light">Audience</h2>
            <p className="section-subtitle" style={{ color: "rgba(255,255,255,.7)" }}>
              The PPP Audit™ is designed for CRE owners, operators, and asset managers who want to move from reactive vendor management to proactive infrastructure governance.
            </p>
          </div>

          <div className="audience-grid">
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <h3>Operational control</h3>
              <p>Owners who need to know what they actually control — and what vendors control for them.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              <h3>Portfolio repeatability</h3>
              <p>Asset managers who need a consistent standard across every building in a portfolio.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <h3>Reduced lock-in</h3>
              <p>Teams facing vendor consolidation, contract renewals, or platform migration decisions.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <h3>AI readiness</h3>
              <p>Operators who want AI to work but know their data foundation isn&apos;t there yet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">Questions</p>
            <h2 className="section-heading">Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            <details className="faq-item">
              <summary>
                <span className="faq-q">What do we get out of a PPP Review / Audit?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                An Ownership + Control Map, a KPI Alignment Scoreboard, and a repeatable baseline that can be applied across your portfolio. The audit gives you a single source of truth about what you own, where value is leaking, and what to prioritize next.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Is this an &ldquo;audit&rdquo; in the accounting sense?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                No. The PPP Audit™ is an operational and ownership diagnostic — not a financial or compliance audit. It evaluates infrastructure control, vendor alignment, data trustworthiness, and operating model gaps across your digital stack.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">What happens after the PPP Audit™?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                The audit output feeds directly into the PPP 5C™ framework — moving from Clarify into Connect, Collect, Coordinate, and Control. Most owners begin with one building, then roll the standard across their portfolio.
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
