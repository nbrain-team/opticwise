import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "CRE AI Readiness",
  description:
    "CRE AI readiness is the condition in which a commercial real estate owner controls their digital infrastructure, data access, and system integration well enough for AI to produce reliable, actionable insights.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="CRE AI Readiness"
        lead="The condition in which a CRE owner controls their digital infrastructure well enough for AI to produce reliable, actionable insights."
        badge="Pillar"
      />

      {/* The Definition */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Definition</p>
            <h2 className="section-heading">What AI Readiness Requires</h2>
            <p className="section-subtitle">
              AI readiness is not a software purchase. It is an infrastructure ownership condition built on five measurable foundations.
            </p>
          </div>

          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6m3-3h-6"/></svg>
              </div>
              <h3>Identity &amp; Permissions</h3>
              <p>Who has access to what systems and data — and who granted it</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
              </div>
              <h3>Data Access &amp; Export</h3>
              <p>Can you extract, move, and use your own data without vendor permission</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </div>
              <h3>Integration Accountability</h3>
              <p>Are your systems connected through documented, owner-controlled pathways</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8m8 4H8m2-8H8"/></svg>
              </div>
              <h3>Documentation</h3>
              <p>Is your infrastructure mapped, versioned, and accessible to your team</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <h3>Portability</h3>
              <p>Can you change vendors without losing data, access, or operational continuity</p>
            </div>
          </div>

          <div className="callout-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
            <p>If you cannot answer &ldquo;yes&rdquo; to all five, AI will produce unreliable outputs no matter what model you deploy.</p>
          </div>
        </div>
      </section>

      {/* The Reality */}
      <section className="section section-dark">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow section-eyebrow-light">The Reality</p>
            <h2 className="section-heading section-heading-light">Why AI Fails in Most Buildings</h2>
            <p className="section-subtitle" style={{ color: "rgba(255,255,255,.7)" }}>
              The problem is not the model. The problem is the foundation it sits on.
            </p>
          </div>

          <div className="audience-grid">
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <h3>Fragmented Inputs</h3>
              <p>Data spread across vendors, platforms, and formats with no unified access layer</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98"/></svg>
              <h3>Shadow Networks</h3>
              <p>Systems installed by vendors that the owner cannot see, audit, or control</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <h3>Platforms That Can&apos;t Export</h3>
              <p>Vendor dashboards that hold data hostage — visible but not portable</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              <h3>Missing Context</h3>
              <p>AI cannot interpret building operations without clean, structured, and continuously available data</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <h3>No Rules for Privacy / Retention</h3>
              <p>No governance over what data is collected, how long it is kept, or who has access</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Solution</p>
            <h2 className="section-heading">Two-Layer AI Readiness Model</h2>
            <p className="section-subtitle">
              AI readiness sits on two layers. Both must be owner-controlled.
            </p>
          </div>

          <div className="layers">
            <div className="layer layer-1">
              <div className="layer-header">
                <span className="layer-tag">Layer 1</span>
                <h3>Data Plane — Trust the Inputs</h3>
                <p className="layer-tagline">Clean data, governed access, documented lineage</p>
              </div>
              <ul className="layer-list">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Identity &amp; access controls owned by the property
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Data exportable in open formats without vendor permission
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Integration pathways documented and auditable
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Privacy and retention policies defined by the owner
                </li>
              </ul>
            </div>

            <div className="layer-connector">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7l7 7 7-7"/></svg>
            </div>

            <div className="layer layer-2">
              <div className="layer-header">
                <span className="layer-tag layer-tag-green">Layer 2</span>
                <h3>Intelligence Plane — Trust the Outputs</h3>
                <p className="layer-tagline">Reliable AI built on governed, owner-controlled data</p>
              </div>
              <p className="layer-desc">
                When Layer 1 is solid, AI can deliver actionable insights — predictive maintenance, energy optimization, tenant behavior analysis, and portfolio-level intelligence. Without it, every model produces noise.
              </p>
              <div className="layer-formula">
                <span>Governed Data</span>
                <span className="formula-arrow">→</span>
                <span>Reliable AI</span>
                <span className="formula-arrow">→</span>
                <span>Actionable Intelligence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-heading">Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            <details className="faq-item">
              <summary>
                <span className="faq-q">Is AI readiness about buying AI tools?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                No. AI readiness is about controlling the infrastructure AI depends on — the network, data pipelines, identity controls, and integration pathways. Without that foundation, even the best AI tools produce unreliable outputs.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">What is the OpticWise Brain?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                The OpticWise Brain is the AI layer that sits on top of owner-controlled infrastructure. It aggregates governed data from across building systems to deliver predictive insights, anomaly detection, and portfolio-level intelligence — but only when the data plane is trustworthy.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">What is the difference between the data plane and the trust plane?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                The data plane ensures inputs are clean, accessible, and governed by the owner. The trust plane (intelligence layer) ensures that AI outputs are reliable and actionable. Both must be owner-controlled — if you don&apos;t trust the data, you can&apos;t trust what AI tells you.
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
