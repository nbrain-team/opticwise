import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI-Ready Commercial Real Estate",
  description:
    "AI-ready commercial real estate refers to properties designed and operated with owner-controlled digital infrastructure and high-fidelity data, enabling predictive operations, resilience, and long-term competitive advantage.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="AI-Ready Commercial Real Estate"
        lead="Properties designed and operated with owner-controlled digital infrastructure and high-fidelity data, enabling predictive operations and long-term competitive advantage."
        badge="Pillar"
      />

      {/* Foundation */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">Foundation</p>
            <h2 className="section-heading">What Makes a Property AI-Ready</h2>
            <p className="section-subtitle">
              AI-ready is not a feature set. It is a structural condition — four foundations that determine whether AI can function reliably.
            </p>
          </div>

          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Governed Access &amp; Identity</h3>
              <p>Owner controls who accesses systems, data, and infrastructure — not vendors</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              </div>
              <h3>Reliable Data Capture</h3>
              <p>High-fidelity, continuously available data from across building systems in open formats</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </div>
              <h3>Documented Integration Pathways</h3>
              <p>Systems connected through owner-controlled, auditable, and portable pathways</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <h3>Portability</h3>
              <p>The ability to change platforms, vendors, or AI models without losing data or operational continuity</p>
            </div>
          </div>

          <div className="callout-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
            <p>AI-ready is a precondition, not an upgrade. Without these foundations, AI investments underperform.</p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Problem</p>
            <h2 className="section-heading">Why Most Properties Are Not AI-Ready</h2>
            <p className="section-subtitle">
              The gap is structural — not technological. Most buildings lack the ownership conditions AI requires.
            </p>
          </div>

          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Data Is Fragmented</h3>
                <p>Operational data lives across dozens of vendor platforms with no unified access layer. AI sees fragments, not the whole picture.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>The Network Wasn&apos;t Designed for Reuse</h3>
                <p>Infrastructure was built for connectivity, not intelligence. Systems pass data through but don&apos;t preserve, structure, or govern it.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">03</div>
              <div className="deliverable-body">
                <h3>Visibility Is Trapped</h3>
                <p>Vendor dashboards show what they want to show. Owners can see metrics but can&apos;t export, combine, or act on data independently.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">04</div>
              <div className="deliverable-body">
                <h3>No Governance</h3>
                <p>No rules for data retention, access permissions, or integration accountability. Without governance, AI outputs are unpredictable and untrustworthy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Model */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Model</p>
            <h2 className="section-heading">Two-Layer AI Readiness Architecture</h2>
            <p className="section-subtitle">
              AI-ready properties operate on two layers. Both must be owner-controlled.
            </p>
          </div>

          <div className="layers">
            <div className="layer layer-1">
              <div className="layer-header">
                <span className="layer-tag">Layer 1</span>
                <h3>Data Plane — Trust the Inputs</h3>
                <p className="layer-tagline">Governed, clean, exportable data under owner control</p>
              </div>
              <ul className="layer-list">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Identity, access, and permissions controlled by the property
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Data captured continuously in open, portable formats
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Integration pathways documented and auditable
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Governance policies enforced by the owner
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
                <p className="layer-tagline">Predictive operations, portfolio intelligence, adaptive systems</p>
              </div>
              <p className="layer-desc">
                When the data plane is solid, AI delivers real value — predictive maintenance, energy optimization, tenant analytics, and portfolio-level decision support. Without it, AI is a cost center producing noise.
              </p>
              <div className="layer-formula">
                <span>Governed Data</span>
                <span className="formula-arrow">→</span>
                <span>Reliable AI</span>
                <span className="formula-arrow">→</span>
                <span>Competitive Advantage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="section section-dark">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow section-eyebrow-light">Outcomes</p>
            <h2 className="section-heading section-heading-light">What AI-Ready Properties Deliver</h2>
            <p className="section-subtitle" style={{ color: "rgba(255,255,255,.7)" }}>
              When infrastructure is owner-controlled and data is governed, outcomes shift from reactive to predictive.
            </p>
          </div>

          <div className="audience-grid">
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <h3>Fewer Surprises</h3>
              <p>Predictive systems catch failures before they become emergencies, reducing downtime and emergency spend</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <h3>Faster Decisions</h3>
              <p>Real-time, trusted data replaces quarterly reports and vendor-filtered dashboards</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <h3>Lower Risk</h3>
              <p>Governed infrastructure reduces compliance exposure, cybersecurity gaps, and vendor dependency</p>
            </div>
            <div className="audience-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8m-4-4v4"/></svg>
              <h3>Portfolio Scalability</h3>
              <p>Standardized infrastructure enables intelligence to compound across properties, not reset at each one</p>
            </div>
          </div>

          <div className="callout-bar" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.85)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#60a5fa" }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
            <p>AI-ready properties are not smarter. They are structurally prepared for intelligence to compound over time.</p>
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
                <span className="faq-q">What does &ldquo;AI-ready&rdquo; actually mean for a building?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                It means the property&apos;s digital infrastructure is owner-controlled, data is governed and exportable, and integration pathways are documented — so AI can produce reliable, actionable insights instead of noise.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Is AI-ready the same as having smart building technology?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                No. Smart building technology often adds sensors and dashboards without addressing ownership or governance. AI-ready means the owner controls the data, the infrastructure, and the integration layer — which is what AI actually depends on.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">How does AI readiness affect property valuation?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                AI-ready properties demonstrate data continuity, operational resilience, and adaptability — signals that increasingly influence investor confidence, underwriting assumptions, and long-term pricing.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Where do I start if my building is not AI-ready?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Start with a PPP Audit&trade;. It maps what you own, where data lives, where control gaps exist, and what needs to change before AI can function reliably across your property or portfolio.
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
