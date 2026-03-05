import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "BoT® (Building of Things®) | OpticWise",
  description:
    "BoT® is the connective layer that turns networks, sensors, systems, data environments, and AI into one owner-controlled digital nervous system.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="BoT® (Building of Things®)"
        badge="Product"
        lead="Most owners are familiar with the Internet of Things — sensors, devices, and platforms that promise smarter buildings. BoT® reframes this: if you own a building full of digital systems, you should operate it as your own Building of Things — not as a collection of vendor-controlled IoT deployments."
      />

      {/* ── The Challenge ── */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Problem</p>
            <h2 className="section-heading">The Challenge</h2>
            <p className="section-subtitle">
              Billions have been spent connecting things inside commercial properties. The problem is not a lack of connected devices — it&apos;s that those devices are operated by vendors, not by owners.
            </p>
          </div>

          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Networks Built in Silos</h3>
                <p>Every vendor installs its own network segment, creating overlapping infrastructure with no unified visibility. Each system operates independently — increasing cost, complexity, and risk.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>Low-Voltage / OT Decisions Without Governance</h3>
                <p>Low-voltage and operational technology decisions are made by contractors and integrators — not aligned to the owner&apos;s operating model, data strategy, or long-term asset plan.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">03</div>
              <div className="deliverable-body">
                <h3>Data Fragmented Across Vendor Dashboards</h3>
                <p>Operational data sits inside vendor platforms the owner cannot access, export, or compare. Intelligence resets every time a vendor changes.</p>
              </div>
            </div>
          </div>

          <div className="callout-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p>The problem is not that buildings lack connected things. The problem is that those things are operated by vendors — not by the owner.</p>
          </div>
        </div>
      </section>

      {/* ── The Shift ── */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The BoT® Approach</p>
            <h2 className="section-heading">The Shift</h2>
            <p className="section-subtitle">
              BoT® replaces vendor-fragmented IoT with an owner-controlled digital nervous system.
            </p>
          </div>

          <div className="outcome-grid">
            <div className="outcome-card">
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h3>Consolidate</h3>
              <p>Unify siloed networks and systems into a single, owner-visible digital backbone across the property.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3>Standardize</h3>
              <p>Establish consistent protocols, data formats, and governance rules that apply across every system and vendor.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Govern</h3>
              <p>Define who owns what, who accesses what, and how changes are managed — replacing ad-hoc vendor control with structured accountability.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
              </div>
              <h3>Scale Intelligence</h3>
              <p>When data flows through an owner-controlled layer, intelligence compounds — across buildings, across years, and into AI readiness.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">How It Works</p>
            <h2 className="section-heading">Architecture</h2>
            <p className="section-subtitle">
              BoT® operates as a two-layer model — a physical connectivity layer and a data &amp; intelligence layer — both under owner control.
            </p>
          </div>

          <div className="layers">
            <div className="layer layer-1">
              <div className="layer-header">
                <span className="layer-tag">Layer 1</span>
                <h3>Physical Connectivity</h3>
                <p className="layer-tagline">The owner-controlled digital backbone</p>
              </div>
              <ul className="layer-list">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Structured cabling, fiber, and low-voltage infrastructure
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Wi-Fi, cellular, DAS, and converged wireless networks
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Sensor and device connectivity across BAS, access control, metering
                </li>
              </ul>
            </div>

            <div className="layer-connector">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            </div>

            <div className="layer layer-2">
              <div className="layer-header">
                <span className="layer-tag layer-tag-green">Layer 2</span>
                <h3>Data &amp; Intelligence</h3>
                <p className="layer-tagline">The owner-controlled data plane</p>
              </div>
              <p className="layer-desc">
                Data from every connected system flows through a trust plane — a governed layer where the owner defines access rights, retention policies, and integration rules. This is where raw signals become operational intelligence.
              </p>
              <div className="layer-formula">
                <span>Signals</span>
                <span className="formula-arrow">&rarr;</span>
                <span>Governed Data</span>
                <span className="formula-arrow">&rarr;</span>
                <span>Operational Intelligence</span>
                <span className="formula-arrow">&rarr;</span>
                <span>AI-Ready Foundation</span>
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
              BoT® delivers measurable value by consolidating infrastructure under owner control.
            </p>
          </div>

          <div className="audience-grid">
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              <h3>Lower build costs</h3>
              <p>Consolidating networks eliminates redundant cabling, switches, and vendor-installed infrastructure.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              <h3>Lower operating costs</h3>
              <p>Unified management replaces overlapping vendor contracts, support agreements, and monitoring tools.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <h3>Higher operational control</h3>
              <p>A single pane of glass across all building systems — owned by the property, not the vendor.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <h3>Reduced lock-in</h3>
              <p>Standardized, portable architecture means vendors can be swapped without losing data or continuity.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <h3>Portfolio compounding</h3>
              <p>Each building strengthens the data set. Intelligence grows with scale — not linearly, but exponentially.</p>
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
                <span className="faq-q">How is BoT® different from IoT?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                IoT describes connected devices. BoT® describes <strong>owner-controlled operation</strong> of all digital things within a building as a unified system. IoT is a technology category. BoT® is an operating model — one where the owner governs the connectivity, data, and intelligence layer instead of outsourcing it to vendors.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Do we need to replace our existing systems to implement BoT®?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                No. BoT® is designed to consolidate and govern existing systems — not replace them. The architecture layers over your current infrastructure, standardizes data flows, and creates owner-controlled visibility without ripping and replacing what&apos;s already in place.
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
