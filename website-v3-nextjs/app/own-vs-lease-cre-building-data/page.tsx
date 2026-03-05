import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Own vs Lease CRE Building Data",
  description:
    "Owning CRE building data means the property owner retains full control, access, and decision rights over operational and tenant-generated data, while leasing data places those rights in the hands of vendors and platforms.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Own vs Lease CRE Building Data"
        lead="Owning your data means retaining full control, access, and decision rights. Leasing it places those rights in the hands of vendors and platforms."
        badge="Pillar"
      />

      {/* Context */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">Context</p>
            <h2 className="section-heading">The Ownership Question</h2>
            <p className="section-subtitle">
              Data ownership in CRE is not a legal abstraction. It is an operational reality that determines who controls value.
            </p>
          </div>

          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Who Can Export</h3>
                <p>Can you extract your operational data in open formats without vendor approval, fees, or delays? If not, you are leasing your data.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>Who Holds Admin Credentials</h3>
                <p>If your vendor controls the master admin account, they control the system. Ownership starts with credentials and access rights.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">03</div>
              <div className="deliverable-body">
                <h3>Who Defines &ldquo;Truth&rdquo;</h3>
                <p>Vendor dashboards define what you see. If you cannot validate, cross-reference, or challenge the data, you are operating on someone else&apos;s version of truth.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">04</div>
              <div className="deliverable-body">
                <h3>Who Can Change Platforms</h3>
                <p>If switching vendors means losing historical data, you never owned it. Portability is the ultimate test of ownership.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Risk */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Risk</p>
            <h2 className="section-heading">What Happens When You Lease Data</h2>
            <p className="section-subtitle">
              Leased data creates compounding risk. Each year, the cost of switching grows and the cost of staying gets worse.
            </p>
          </div>

          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <h3>Vendor Lock-In</h3>
              <p>Data lives inside platforms you don&apos;t control — switching costs escalate every year</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <h3>Rising Costs</h3>
              <p>Vendors increase fees knowing you cannot leave without losing operational continuity</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3>Lost History</h3>
              <p>When contracts end, historical data disappears — years of operational intelligence gone</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <h3>No AI Foundation</h3>
              <p>Leased data cannot be governed, audited, or structured for AI — making AI investments unreliable</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h3>Blind Spots</h3>
              <p>Vendor dashboards show filtered views — owners cannot see the full picture of their own operations</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Alternative */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Alternative</p>
            <h2 className="section-heading">What Happens When You Own Data</h2>
            <p className="section-subtitle">
              Owned data compounds. Every year of clean, governed data increases the intelligence, resilience, and value of the asset.
            </p>
          </div>

          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg>
              </div>
              <h3>Platform Flexibility</h3>
              <p>Change vendors without losing data, access, or operational continuity</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3>Cost Control</h3>
              <p>Negotiate from strength when you can leave any vendor relationship cleanly</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              </div>
              <h3>Data Continuity</h3>
              <p>Historical data compounds — years of operational intelligence preserved and accessible</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
              </div>
              <h3>AI-Ready Foundation</h3>
              <p>Governed, structured data enables reliable AI — predictive operations become possible</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h3>Full Visibility</h3>
              <p>See the complete picture of your operations — unfiltered, unmediated, owner-controlled</p>
            </div>
          </div>

          <div className="callout-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
            <p>Owned data is not a feature. It is the structural difference between assets that appreciate and assets that degrade.</p>
          </div>
        </div>
      </section>

      {/* The Framework */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <p className="section-eyebrow">The Framework</p>
            <h2 className="section-heading">PPP 5C&trade; — The Path to Data Ownership</h2>
            <p className="section-subtitle">
              A repeatable framework that transitions buildings from leased data to owned data, one step at a time.
            </p>
          </div>

          <div className="ppp-timeline">
            <div className="ppp-step ppp-step-active">
              <div className="ppp-step-num">1</div>
              <div className="ppp-step-body">
                <h3>Clarify <span className="ppp-badge">PPP Audit&trade;</span></h3>
                <p>Map what data you own vs lease. Identify where control gaps exist, where vendor lock-in is deepest, and where ownership transitions are needed.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">2</div>
              <div className="ppp-step-body">
                <h3>Connect</h3>
                <p>Build an owner-controlled network backbone that links systems, replaces vendor-siloed data paths, and creates a unified data layer.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">3</div>
              <div className="ppp-step-body">
                <h3>Collect</h3>
                <p>Aggregate data from across building systems in open, portable formats. Establish pipelines that capture data continuously — not just when vendors choose to share.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">4</div>
              <div className="ppp-step-body">
                <h3>Coordinate</h3>
                <p>Align vendor contracts, workflows, and access rights so data governance is enforceable and operational accountability is clear.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">5</div>
              <div className="ppp-step-body">
                <h3>Control</h3>
                <p>Reclaim full ownership of data, infrastructure, and vendor relationships. Ensure platform flexibility and long-term asset value protection.</p>
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
                <span className="faq-q">How do I know if I own or lease my building data?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Ask four questions: Can you export your data in open formats without vendor permission? Do you hold the master admin credentials? Can you switch vendors without losing historical data? Do you define the retention and access policies? If any answer is no, you are leasing.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">What happens to my data when a vendor contract ends?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                If you lease your data, it typically stays with the vendor or is deleted when the contract ends. Years of operational intelligence vanish. If you own your data, it persists regardless of vendor changes — it lives in your infrastructure, governed by your policies.
              </div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">Can I transition from leased to owned data without replacing all my vendors?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">
                Yes. The PPP 5C&trade; framework is designed for staged transitions. You can begin by mapping ownership gaps (Clarify), building parallel data pipelines (Connect/Collect), and renegotiating contracts with data ownership clauses (Coordinate/Control) — all without a wholesale vendor replacement.
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
