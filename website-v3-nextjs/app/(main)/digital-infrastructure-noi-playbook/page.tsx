import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure NOI Playbook",
  description:
    "A repeatable, owner-led framework that turns commercial real estate data & digital infrastructure into predictable NOI instead of unmanaged operating costs.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Data & Digital Infrastructure NOI Playbook"
        lead="A repeatable, owner-led framework that turns commercial real estate data & digital infrastructure into predictable NOI instead of unmanaged operating costs."
        badge="Pillar"
      />

      {/* The Why */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">The Why</span>
            <h2 className="section-heading">Why a Playbook (Not a One-Off Project)</h2>
            <div className="accent-bar accent-bar-center"></div>
          </div>
          <div className="deliverables">
            <div className="deliverable">
              <div className="deliverable-num">01</div>
              <div className="deliverable-body">
                <h3>Implementations Fail. Operating Models Scale.</h3>
                <p>Most smart building efforts fail because they&rsquo;re treated as implementations&mdash;a vendor installs a system, trains a team, and moves on. Six months later, the integration drifts, the data degrades, and the next renovation starts from scratch.</p>
                <p>A playbook changes that. It makes NOI repeatable across assets, vendors, renovations, and acquisitions.</p>
              </div>
            </div>
            <div className="deliverable">
              <div className="deliverable-num">02</div>
              <div className="deliverable-body">
                <h3>What a Playbook Gives You</h3>
                <ul>
                  <li>A single standard that every building follows</li>
                  <li>Rules that vendors must comply with</li>
                  <li>Governance that survives team turnover and asset trades</li>
                  <li>A compounding foundation that gets stronger with each property</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Framework */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">The Framework</span>
            <h2 className="section-heading">The PPP 5C&trade; Owner Path (Detailed)</h2>
            <div className="accent-bar accent-bar-center"></div>
            <p className="section-subtitle">Each step builds on the last. Skip one and the system doesn&rsquo;t compound.</p>
          </div>
          <div className="ppp-timeline">
            <div className="ppp-step ppp-step-active">
              <div className="ppp-step-num">1</div>
              <div className="ppp-step-body">
                <h3>Clarify <span className="ppp-badge">PPP Audit&trade;</span></h3>
                <p>Map what you own, where value leaks, who&rsquo;s accountable, and what data is trustworthy and portable. This is the ownership reset&mdash;the foundation for every step that follows.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">2</div>
              <div className="ppp-step-body">
                <h3>Connect</h3>
                <p>Build a resilient, owner-controlled digital backbone&mdash;segmented, documented, and governed. Replace shadow networks with infrastructure you can see, manage, and scale.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">3</div>
              <div className="ppp-step-body">
                <h3>Collect</h3>
                <p>Aggregate high-fidelity, usable data across the property. Not more data&mdash;better data. Data you can export, combine, and trust.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">4</div>
              <div className="ppp-step-body">
                <h3>Coordinate</h3>
                <p>Align vendors, workflows, and automation using governed data. Replace manual handoffs and one-off integrations with orchestrated operations.</p>
              </div>
            </div>
            <div className="ppp-step">
              <div className="ppp-step-num">5</div>
              <div className="ppp-step-body">
                <h3>Control</h3>
                <p>Reclaim full ownership of your data &amp; digital infrastructure. Stay platform-flexible. Swap vendors without losing data, context, or governance.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How NOI Compounds */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">How NOI Compounds</span>
            <h2 className="section-heading">The Two-Layer Model</h2>
            <div className="accent-bar accent-bar-center"></div>
            <p className="section-subtitle">Layer 1 creates the foundation. Layer 2 turns it into intelligence. Together, they make NOI repeatable.</p>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  <div><strong>Design:</strong> repeatable standards across properties</div>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  <div><strong>Implementation:</strong> governance baked in (segmentation, access rules, documentation)</div>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  <div><strong>Operations:</strong> ongoing digital management without taxing on-site teams</div>
                </li>
              </ul>
            </div>
            <div className="layer-connector">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
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

      {/* FAQ */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">Questions</span>
            <h2 className="section-heading">Frequently Asked Questions</h2>
            <div className="accent-bar accent-bar-center"></div>
          </div>
          <div className="faq-list">
            <details className="faq-item" open>
              <summary>
                <span className="faq-q">Is this about adding more technology?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">No. It&rsquo;s about creating an owner-controlled foundation that makes technology decisions strategic instead of reactive. The playbook ensures every vendor, system, and integration follows your standard&mdash;not the other way around.</div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">What is PPP 5C&trade; in plain language?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">Clarify what you own. Connect the foundation. Collect usable data. Coordinate vendors and workflows. Control the economics. It&rsquo;s the path from fragmented, vendor-dependent operations to a standardized, owner-controlled model that scales.</div>
            </details>
            <details className="faq-item">
              <summary>
                <span className="faq-q">What&rsquo;s the business outcome?</span>
                <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div className="faq-a">One standard intelligence substrate, many decision engines, scaled across buildings. Predictable NOI. Lower operational risk. A foundation that compounds with every property you add to the portfolio.</div>
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
