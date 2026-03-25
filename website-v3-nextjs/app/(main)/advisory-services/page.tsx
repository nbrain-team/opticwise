import type { Metadata } from "next";
import Link from "next/link";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Advisory Services",
  description:
    "Owner-controlled data & digital infrastructure advisory for CRE owners who want to self-perform or co-manage.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Advisory Services"
        lead="You may have internal IT/OT resources. The question is whether you have an owner standard for data & digital infrastructure\u2014and the governance to keep it portable as vendors, systems, and decision engines change."
        badge="Advisory"
      />

      {/* Who this is for */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">Audience</span>
            <h2 className="section-heading">Who This Is For</h2>
            <div className="accent-bar accent-bar-center" />
          </div>
          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Owners / Operators Who Want to Self-Perform or Co-Manage</h3>
                <p>You have internal capabilities but need a repeatable owner standard that every vendor, system, and property follows.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>Portfolios with Third-Party PM Constraints</h3>
                <p>Non-negotiable tools and fragmented vendor relationships that need governance without disrupting existing operations.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">03</div>
              <div className="deliverable-body">
                <h3>Teams Tired of &ldquo;Smart Building&rdquo; One-Offs</h3>
                <p>Point solutions that don&rsquo;t scale, integrations that break, and intelligence that resets with every vendor change.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">Deliverables</span>
            <h2 className="section-heading">What You Get</h2>
            <div className="accent-bar accent-bar-center" />
          </div>
          <div className="audit-grid">
            <div className="audit-card">
              <div className="audit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h3>Owner Standard (Repeatable)</h3>
              <p>Documented standards across properties: segmentation, access rules, naming, documentation, export rights</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3>Governance That Survives Change</h3>
              <p>Identity, access, privacy, lineage, retention, and rules of use</p>
            </div>
            <div className="audit-card">
              <div className="audit-icon audit-icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              <h3>Portability by Design</h3>
              <p>Vendor- and LLM-agnostic foundations so you can plug in any systems and swap them over time</p>
            </div>
          </div>
        </div>
      </section>

      {/* How we work: PPP 5C */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">The Framework</span>
            <h2 className="section-heading">How We Work: PPP 5C&trade;</h2>
            <div className="accent-bar accent-bar-center" />
          </div>
          <div className="ppp-timeline">
            <div className="ppp-step ppp-step-active">
              <div className="ppp-step-num">1</div>
              <div className="ppp-step-body">
                <h3>Clarify <span className="ppp-badge">PPP Review / Audit</span></h3>
                <p>Define success metrics, map ownership, identify leakage, document what&rsquo;s trustworthy and portable</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">2</div>
              <div className="ppp-step-body">
                <h3>Connect</h3>
                <p>Secure, owner-controlled connectivity repeatable property-to-property</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">3</div>
              <div className="ppp-step-body">
                <h3>Collect</h3>
                <p>Capture/normalize high-fidelity usable data into a consistent model</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">4</div>
              <div className="ppp-step-body">
                <h3>Coordinate</h3>
                <p>Govern identity, access, privacy, lineage, retention, and rules of use</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">5</div>
              <div className="ppp-step-body">
                <h3>Control</h3>
                <p>Enable decision engines/workflows (vendor platform, internal analytics, any LLM) to act under owner permissions</p>
              </div>
            </div>
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
