import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Property Brain\u2122 \u2192 Portfolio Brain\u2122",
  description:
    "OpticWise's owner-controlled intelligence layer: Property Brain at each asset, Portfolio Brain across the portfolio.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Property Brain\u2122 \u2192 Portfolio Brain\u2122"
        lead="Most portfolios have pieces of &quot;intelligence,&quot; but it&apos;s fragmented across vendors and tools\u2014so performance resets building by building."
        badge="Intelligence Layer"
      />

      {/* Property Brain vs Portfolio Brain */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">The Model</span>
            <h2 className="section-heading">Two Layers of Intelligence</h2>
            <div className="accent-bar accent-bar-center" />
          </div>
          <div className="layers">
            <div className="layer layer-1">
              <div className="layer-header">
                <span className="layer-tag">Property Level</span>
                <h3>Property Brain&trade;</h3>
                <p className="layer-tagline">The intelligence layer at each asset</p>
              </div>
              <p className="layer-desc">
                Senses what&rsquo;s happening, decides what to do next, and drives execution&mdash;under owner permissions. Every building becomes a self-aware operating unit.
              </p>
            </div>
            <div className="layer-connector">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
            </div>
            <div className="layer layer-2">
              <div className="layer-header">
                <span className="layer-tag layer-tag-green">Portfolio Level</span>
                <h3>Portfolio Brain&trade;</h3>
                <p className="layer-tagline">The coordination layer across assets</p>
              </div>
              <p className="layer-desc">
                Sets strategy, standards, and allocates focus/capital&mdash;so results compound across the portfolio instead of resetting at every building.
              </p>
              <div className="layer-formula">
                <span>Owner-controlled intelligence</span>
                <span className="formula-arrow">&rarr;</span>
                <span>Governed data plane + trust plane</span>
                <span className="formula-arrow">&rarr;</span>
                <span>Autonomous activities under owner permissions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B.R.A.I.N. Loop */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">How It Works</span>
            <h2 className="section-heading">The B.R.A.I.N. Loop</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle">What a real Property Brain&trade; does at every asset, continuously.</p>
          </div>
          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">B</div>
              <div className="deliverable-body">
                <h3>Baseline</h3>
                <p>What&rsquo;s happening&mdash;continuous sensing across all building systems and data streams.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">R</div>
              <div className="deliverable-body">
                <h3>Reason</h3>
                <p>Why it&rsquo;s happening&mdash;root cause analysis, pattern detection, and contextual understanding.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">A</div>
              <div className="deliverable-body">
                <h3>Action</h3>
                <p>The 2&ndash;3 plays to run next&mdash;prioritized recommendations based on governed data.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">I</div>
              <div className="deliverable-body">
                <h3>Implementation</h3>
                <p>Did it get done&mdash;execution tracking and accountability against the plays.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">N</div>
              <div className="deliverable-body">
                <h3>Net Impact</h3>
                <p>Did it work&mdash;verified outcomes tied back to KPIs and NOI impact.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PPP 5C */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">The Path</span>
            <h2 className="section-heading">How OpticWise Helps You Build It (PPP 5C&trade;)</h2>
            <div className="accent-bar accent-bar-center" />
          </div>
          <div className="ppp-timeline">
            <div className="ppp-step ppp-step-active">
              <div className="ppp-step-num">1</div>
              <div className="ppp-step-body">
                <h3>Clarify <span className="ppp-badge">PPP Review / Audit</span></h3>
                <p>Establish what you own, where value leaks, and what data is trustworthy and portable</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">2</div>
              <div className="ppp-step-body">
                <h3>Connect</h3>
                <p>Create the resilient digital backbone that links systems, platforms, and devices</p>
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
                <p>Reclaim ownership and stay platform-flexible over time</p>
              </div>
            </div>
          </div>
          <div className="callout-bar" style={{ marginTop: 40 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>Pilot one property to establish the Property Brain&trade; and prove portability by plugging in a decision engine.</p>
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
