import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "5S® Wireless Connectivity | OpticWise",
  description:
    "OpticWise's wireless connectivity product delivering seamless mobility, security, stability, speed, and service — across Wi-Fi, in-building cellular, DAS, and future protocols.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="5S® Wireless Connectivity"
        badge="Product"
        lead="5S® is OpticWise's wireless connectivity product — delivering Seamless mobility, Security, Stability, Speed, and Service. It operates across Wi-Fi, in-building cellular, DAS, and future wireless protocols, all under owner control."
      />

      {/* ── The 5S® Experience ── */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Standard</p>
            <h2 className="section-heading">The 5S® Experience</h2>
            <p className="section-subtitle">
              Every wireless deployment is measured against five non-negotiable experience pillars.
            </p>
          </div>

          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
              </div>
              <h3>Seamless Mobility</h3>
              <p>Continuous connectivity across floors, elevators, lobbies, and outdoor areas — no dead zones, no drops.</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Security</h3>
              <p>Enterprise-grade segmentation, encryption, and access control — protecting tenant data and building operations.</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3>Stability / Resilience</h3>
              <p>Redundant paths, failover design, and proactive monitoring to keep connectivity reliable under load.</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <h3>Speed</h3>
              <p>Bandwidth and throughput engineered for today&apos;s demand — and scalable for the next wave of devices and applications.</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <h3>Service</h3>
              <p>Support that doesn&apos;t land on your on-site staff — managed, monitored, and resolved before tenants notice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Delivery ── */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">How It&apos;s Built</p>
            <h2 className="section-heading">Delivery</h2>
          </div>

          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Protocol-Agnostic by Design</h3>
                <p>5S® is not a Wi-Fi product. It is a wireless connectivity standard that spans every protocol a building needs — today and tomorrow.</p>
                <ul>
                  <li>Wi-Fi 6/6E/7 enterprise networks</li>
                  <li>In-building cellular and DAS</li>
                  <li>Private 5G / CBRS where applicable</li>
                  <li>IoT and sensor-grade wireless (BLE, Zigbee, LoRa)</li>
                </ul>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>Owner Control Is the Point</h3>
                <p>Wireless connectivity is often the first thing tenants experience and the last thing owners control. 5S® changes that.</p>
                <ul>
                  <li>Owner-controlled infrastructure and data</li>
                  <li>Vendor-swappable architecture — no lock-in</li>
                  <li>Visibility into usage, performance, and cost</li>
                  <li>SLAs aligned to owner KPIs, not vendor convenience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Owner Value ── */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">Why It Matters</p>
            <h2 className="section-heading">Owner Value</h2>
            <p className="section-subtitle">
              5S® delivers tenant experience without surrendering control.
            </p>
          </div>

          <div className="outcome-grid">
            <div className="outcome-card">
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </div>
              <h3>Higher Retention</h3>
              <p>Reliable, seamless connectivity is now a baseline expectation. Meeting it reduces churn and strengthens renewal conversations.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3>Lower On-Site Burden</h3>
              <p>Managed, proactively monitored wireless means fewer help desk tickets, fewer truck rolls, and less demand on property management teams.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Reduced Operational Risk</h3>
              <p>Segmented networks, encrypted traffic, and proactive monitoring reduce exposure to outages, breaches, and compliance gaps.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <h3>Portfolio Repeatability</h3>
              <p>The 5S® standard applies across every building. One framework, consistent tenant experience, scalable operations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── In Practice ── */}
      <section className="section section-dark">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow section-eyebrow-light">Real-World Application</p>
            <h2 className="section-heading section-heading-light">In Practice</h2>
            <p className="section-subtitle" style={{ color: "rgba(255,255,255,.7)" }}>
              What 5S® looks like inside an actual building.
            </p>
          </div>

          <div className="audience-grid">
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <h3>Coverage matching building use</h3>
              <p>Designed around actual floor plans, tenant types, and building operations — not generic vendor templates.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <h3>Capacity for today and next wave</h3>
              <p>Engineered with headroom for growing device density, video calls, IoT sensors, and emerging protocols.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              <h3>Wi-Fi calling deep inside</h3>
              <p>Reliable voice over Wi-Fi in elevators, parking garages, stairwells, and interior spaces where cellular fails.</p>
            </div>
            <div className="audience-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              <h3>Support that doesn&apos;t land on your staff</h3>
              <p>24/7 managed operations with proactive issue resolution — your property team focuses on property, not IT.</p>
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
                <span className="faq-q">Is 5S® just a Wi-Fi product?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                No. 5S® is a wireless connectivity standard — not a single-protocol product. It spans Wi-Fi, in-building cellular, DAS, private 5G/CBRS, and IoT wireless. The standard ensures every protocol meets the same five experience pillars.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Who manages the wireless network once it&apos;s deployed?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                OpticWise manages operations, monitoring, and support. The infrastructure and data remain under owner control. Your property team is freed from day-to-day wireless management while maintaining full visibility and governance.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Can 5S® work alongside existing carrier agreements?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Yes. 5S® is designed to complement or consolidate existing carrier and managed service agreements — not necessarily replace them. The architecture ensures that regardless of carrier relationships, the owner retains control of the connectivity layer.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">How does 5S® improve NOI?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                By reducing vendor overhead, eliminating redundant contracts, lowering help desk volume, improving tenant retention, and creating a connectivity asset the owner controls — rather than a recurring cost someone else profits from.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Does 5S® apply across a portfolio?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Yes. The 5S® standard is designed for portfolio-wide deployment. Consistent connectivity experience, operations, and reporting across every building — regardless of size, location, or existing infrastructure.
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
