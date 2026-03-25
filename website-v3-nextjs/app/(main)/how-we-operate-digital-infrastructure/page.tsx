import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How OpticWise Operates Data & Digital Infrastructure | OpticWise",
  description:
    "Most owners have an IT strategy. Almost nobody has an OT strategy. OpticWise designs, deploys, manages, and governs owner-controlled digital infrastructure across portfolios.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="How OpticWise Operates Data &amp; Digital Infrastructure"
        badge="Operations"
        lead="Most owners have an IT strategy. Almost nobody has an OT strategy. OpticWise bridges that gap — designing, deploying, managing, and governing owner-controlled digital infrastructure so that networks, wireless, sensors, and data environments operate as a single coordinated system."
      />

      {/* ── Layer 1: Design · Implementation · Operations ── */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">Foundation</p>
            <h2 className="section-heading">Layer 1 — Physical &amp; Operational</h2>
            <p className="section-subtitle">
              The infrastructure you can see, touch, and measure — and the operational discipline that keeps it performing.
            </p>
          </div>

          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Design</h3>
                <p>Every engagement starts with architecture that aligns to owner goals — not vendor convenience.</p>
                <ul>
                  <li>Building-specific network and wireless design</li>
                  <li>Low-voltage and OT pathway planning</li>
                  <li>Convergence strategy across BAS, access control, metering, and AV</li>
                  <li>Capacity planning for current and future tenant density</li>
                </ul>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>Implementation</h3>
                <p>Deployment managed to owner specifications — with governance built into the process, not bolted on after.</p>
                <ul>
                  <li>Vendor coordination and low-voltage oversight</li>
                  <li>Commissioning, testing, and acceptance protocols</li>
                  <li>Documentation and as-built records under owner control</li>
                  <li>Handoff to managed operations with no knowledge gaps</li>
                </ul>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">03</div>
              <div className="deliverable-body">
                <h3>Operations</h3>
                <p>Ongoing management that ensures infrastructure continues to serve the owner&apos;s operating model — not degrade into vendor dependency.</p>
                <ul>
                  <li>24/7 monitoring, alerting, and proactive maintenance</li>
                  <li>SLA management and vendor accountability</li>
                  <li>Lifecycle management and technology refresh planning</li>
                  <li>Reporting aligned to owner KPIs and NOI targets</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Layer 2: Data & Intelligence ── */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">Intelligence Layer</p>
            <h2 className="section-heading">Layer 2 — Data &amp; Trust</h2>
            <p className="section-subtitle">
              Infrastructure generates signals. Layer 2 turns those signals into governed, owner-controlled intelligence.
            </p>
          </div>

          <div className="layers" style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="layer layer-2">
              <div className="layer-header">
                <span className="layer-tag layer-tag-green">Data + Trust Plane</span>
                <h3>Owner-Controlled Intelligence</h3>
                <p className="layer-tagline">Where signals become decisions</p>
              </div>
              <p className="layer-desc">
                The <strong>data plane</strong> aggregates signals from every connected system — networks, wireless, sensors, BAS, access control, metering — into a unified, structured data environment the owner controls.
              </p>
              <p className="layer-desc" style={{ marginTop: 12 }}>
                The <strong>trust plane</strong> governs that data: who can access it, how it&apos;s retained, where it flows, and what decisions it feeds. Without trust, data is noise. With it, data becomes the foundation for operational intelligence and AI readiness.
              </p>
              <div className="layer-formula">
                <span>Raw Signals</span>
                <span className="formula-arrow">&rarr;</span>
                <span>Governed Data</span>
                <span className="formula-arrow">&rarr;</span>
                <span>Operational Intelligence</span>
                <span className="formula-arrow">&rarr;</span>
                <span>AI-Ready CRE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Outcomes ── */}
      <section className="section section-dark">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow section-eyebrow-light">Results</p>
            <h2 className="section-heading section-heading-light">Outcomes</h2>
            <p className="section-subtitle" style={{ color: "rgba(255,255,255,.7)" }}>
              Owner-controlled operations produce measurable, compounding value.
            </p>
          </div>

          <div className="audience-grid">
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              <h3>NOI growth</h3>
              <p>Infrastructure becomes a revenue and efficiency driver — not just a cost center. Reduced vendor overhead, eliminated redundancy, and new monetization paths.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              <h3>Tenant experience outcomes</h3>
              <p>Seamless connectivity, faster issue resolution, and reliable services — the baseline tenants now expect and renew for.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <h3>Operational control</h3>
              <p>Single pane of glass across all building systems. Vendor accountability enforced. Data and decisions stay with the owner.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <h3>Future-proofing / AI readiness</h3>
              <p>Clean, governed, continuously available data is the prerequisite for reliable AI. Controlled infrastructure delivers it — fragmented infrastructure never will.</p>
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
                <span className="faq-q">What&apos;s the difference between IT operations and what OpticWise does?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                IT operations focus on user-facing systems — laptops, email, SaaS applications. OpticWise operates <strong>building-level digital infrastructure</strong>: networks, wireless connectivity, sensors, OT systems, and the data environments that tie them together. This is the layer beneath IT — and the layer most owners don&apos;t control.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Do we need to replace our existing vendors?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Not necessarily. OpticWise can work alongside existing vendors or consolidate where overlap creates cost and risk. The goal is not to replace — it&apos;s to govern. We ensure that every vendor operates within a framework the owner controls.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">How does this scale across a portfolio?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Every building is assessed, designed, and operated under the same standard — the PPP model. This creates consistency across a portfolio: same governance, same data structure, same reporting. Intelligence from one building informs decisions across all of them.
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
