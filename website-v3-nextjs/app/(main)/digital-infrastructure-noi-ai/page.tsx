import type { Metadata } from "next";
import Link from "next/link";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure, NOI, and AI in Commercial Real Estate",
  description:
    "Commercial real estate is entering a structural shift—not a technology cycle, a control cycle. Explore the pillars of owner-controlled data & digital infrastructure, NOI, and AI readiness.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Data & Digital Infrastructure, NOI, and AI in Commercial Real Estate"
        badge="Hub"
        lead="Commercial real estate is entering a structural shift. Not a technology cycle. A control cycle."
        description="For decades, owners outsourced networks, data, and integrations to vendors—one contract at a time. The result: fragmented infrastructure, trapped data, and operating models that don't scale."
      />

      {/* ── The Convergence ── */}
      <section className="section section-white">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">The Convergence</span>
            <h2 className="section-heading">Why These Topics Are Now One Conversation</h2>
            <div className="accent-bar accent-bar-center" />
          </div>
          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>NOI, Infrastructure, AI, and Visibility Were Never Separate</h3>
                <p>For years, owners treated NOI (finance), digital infrastructure (IT), AI (innovation), and visibility (marketing) as separate line items managed by separate teams. That separation no longer holds.</p>
                <p>Digital infrastructure ownership sits upstream of all of them. It determines who controls connectivity economics, whether operations are manual or coordinated, whether data is usable or trapped, and whether AI can function at all.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>The Question Has Changed</h3>
                <p>The question is no longer &ldquo;which platform should we buy?&rdquo; It&rsquo;s: <strong>who controls the foundation those platforms run on?</strong></p>
                <p>If the answer is &ldquo;the vendor,&rdquo; every downstream decision&mdash;NOI, tenant experience, AI, risk&mdash;is shaped by someone else&rsquo;s economics.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Shift ── */}
      <section className="section section-light">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">The Shift</span>
            <h2 className="section-heading">From Vendor Convenience to Owner Control</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle">Most owners didn&rsquo;t give up control intentionally. It happened one contract at a time.</p>
          </div>
          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon audit-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              </div>
              <h3>Shadow Networks</h3>
              <p>Vendor-installed infrastructure you don&rsquo;t control or even see</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3>Siloed Integrations</h3>
              <p>Systems that don&rsquo;t talk to each other&mdash;by design</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
              </div>
              <h3>Data Trapped in Platforms</h3>
              <p>Can&rsquo;t export, can&rsquo;t combine, can&rsquo;t govern</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3>Revenue-Share Agreements</h3>
              <p>Vendors capture the economics you should own</p>
            </div>
          </div>
          <div className="callout-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>This is not a technology problem. It&rsquo;s an ownership and operating model problem.</p>
          </div>
        </div>
      </section>

      {/* ── The Model ── */}
      <section className="section section-white">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">The Model</span>
            <h2 className="section-heading">The Two-Layer Model</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle">Owner-controlled infrastructure below. Intelligence above. Standardize once, scale everywhere.</p>
          </div>
          <div className="layers">
            <div className="layer layer-1">
              <div className="layer-header">
                <span className="layer-tag">Layer 1</span>
                <h3>Managed Data &amp; Digital Infrastructure</h3>
                <p className="layer-tagline">The foundation you own</p>
              </div>
              <ul className="layer-list">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  <div><strong>Standards:</strong> repeatable design across properties</div>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  <div><strong>Governance:</strong> segmentation, access rules, documentation baked in</div>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  <div><strong>Operations:</strong> ongoing digital management without taxing on-site teams</div>
                </li>
              </ul>
            </div>
            <div className="layer-connector">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
            </div>
            <div className="layer layer-2">
              <div className="layer-header">
                <span className="layer-tag layer-tag-green">Layer 2</span>
                <h3>Owner-Controlled Intelligence Layer</h3>
                <p className="layer-tagline">OpticWise Brain</p>
              </div>
              <p className="layer-desc">A vendor- and LLM-agnostic <strong>Property Intelligence Layer</strong>: a governed <strong>data plane + trust plane</strong> enabling autonomous activities and intelligence&mdash;so you can plug in any systems and decision engines you want, and swap them over time.</p>
              <div className="layer-formula">
                <span>One standard intelligence substrate</span>
                <span className="formula-arrow">&rarr;</span>
                <span>Many decision engines</span>
                <span className="formula-arrow">&rarr;</span>
                <span>Scaled across buildings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Owner Path ── */}
      <section className="section section-light">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">The Owner Path</span>
            <h2 className="section-heading">PPP 5C&trade;</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle">Five steps from fragmented to scaled. Each builds on the last.</p>
          </div>
          <div className="ppp-timeline">
            <div className="ppp-step ppp-step-active">
              <div className="ppp-step-num">1</div>
              <div className="ppp-step-body">
                <h3>Clarify <span className="ppp-badge">PPP Audit&trade;</span></h3>
                <p>Establish what you own, where value leaks, and what&rsquo;s trustworthy and portable</p>
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

      {/* ── Deep Dives ── */}
      <section className="section section-white">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Deep Dives</span>
            <h2 className="section-heading">The Pillars (Explore by Outcome)</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle">Each pillar addresses a different dimension of owner-controlled data &amp; digital infrastructure.</p>
          </div>
          <div className="outcome-grid">
            <div className="outcome-card">
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3>NOI Strategy</h3>
              <p>How digital infrastructure ownership directly increases net operating income</p>
              <Link href="/digital-infrastructure-noi-strategy/" className="btn btn-primary" style={{ marginTop: '16px', fontSize: '.8rem', padding: '8px 20px' }}>Explore &rarr;</Link>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <h3>NOI Playbook</h3>
              <p>A repeatable, owner-led framework that turns infrastructure into predictable NOI</p>
              <Link href="/digital-infrastructure-noi-playbook/" className="btn btn-primary" style={{ marginTop: '16px', fontSize: '.8rem', padding: '8px 20px' }}>Explore &rarr;</Link>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3>CRE AI Readiness</h3>
              <p>What it actually takes for AI to produce reliable, actionable insights in buildings</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <h3>AI-Ready CRE</h3>
              <p>The structural requirements for AI-ready commercial real estate assets</p>
              <Link href="/ai-ready-commercial-real-estate/" className="btn btn-primary" style={{ marginTop: '16px', fontSize: '.8rem', padding: '8px 20px' }}>Explore &rarr;</Link>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
              </div>
              <h3>Own vs Lease Data</h3>
              <p>Why owning your building data is the most important decision you&rsquo;ll make</p>
              <Link href="/own-vs-lease-cre-building-data/" className="btn btn-primary" style={{ marginTop: '16px', fontSize: '.8rem', padding: '8px 20px' }}>Explore &rarr;</Link>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3>Digital Visibility</h3>
              <p>Control how your properties appear, perform, and compete online</p>
              <Link href="/control-cre-digital-visibility/" className="btn btn-primary" style={{ marginTop: '16px', fontSize: '.8rem', padding: '8px 20px' }}>Explore &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MORE ==================== */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">More</span>
            <h2 className="section-heading">Explore Further</h2>
            <div className="accent-bar accent-bar-center" />
          </div>
          <div className="deliverables">
            <Link href="/brains/" className="deliverable" style={{ textDecoration: 'none' }}>
              <div className="deliverable-num">&rarr;</div>
              <div className="deliverable-body">
                <h3>Property Brain&trade; &rarr; Portfolio Brain&trade;</h3>
                <p>The intelligence layer that senses, decides, and drives execution at each asset&mdash;then compounds across the portfolio.</p>
              </div>
            </Link>
            <Link href="/advisory-services/" className="deliverable" style={{ textDecoration: 'none' }}>
              <div className="deliverable-num">&rarr;</div>
              <div className="deliverable-body">
                <h3>Advisory Services</h3>
                <p>For owners/operators who want to self-perform or co-manage with an owner standard for data &amp; digital infrastructure.</p>
              </div>
            </Link>
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
