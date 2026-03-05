import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure NOI Strategy",
  description:
    "The intentional design, ownership, and control of a property's networks, systems, and data to directly increase net operating income.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Data & Digital Infrastructure NOI Strategy"
        lead="The intentional design, ownership, and control of a property's networks, systems, and data to directly increase net operating income."
        badge="Pillar"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <div className="definition-box">
              <p className="definition-label">Definition</p>
              <p className="definition-text">
                Data &amp; digital infrastructure NOI strategy is the intentional design,
                ownership, and control of a property&apos;s networks, systems, and data to
                directly increase net operating income, reduce operational risk, and protect
                long-term asset value.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Why NOI Is Now an Infrastructure Issue</h2>
            <p className="content-text">
              For decades, digital infrastructure was treated as a background utility —
              connectivity was outsourced, systems ran in silos, and data belonged to whoever
              installed the platform. That model worked when buildings were simpler. It no
              longer does.
            </p>
            <p className="content-text">
              Today, four forces tie infrastructure directly to NOI:
            </p>
            <ul className="content-list">
              <li><strong>Revenue capture</strong> — connectivity, data services, and tenant experience create monetizable value</li>
              <li><strong>Operating efficiency</strong> — integrated systems reduce redundancy, manual processes, and vendor overhead</li>
              <li><strong>Risk exposure</strong> — fragmented infrastructure increases downtime, compliance gaps, and cybersecurity vulnerabilities</li>
              <li><strong>Data ownership</strong> — whoever controls the data controls the economics</li>
            </ul>
            <p className="content-text">
              When owners control infrastructure, NOI becomes predictable.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Where NOI Leaks Today</h2>
            <p className="content-text">
              Most commercial properties lose NOI not through one large failure but through
              dozens of small, compounding inefficiencies:
            </p>
            <ul className="content-list">
              <li>Revenue-share connectivity agreements that transfer margin to vendors</li>
              <li>Fragmented networks and systems that increase operating burden</li>
              <li>Vendor-controlled dashboards that limit visibility and portability</li>
              <li>Redundant infrastructure spend across overlapping contracts</li>
              <li>Manual, reactive operations that drive up labor and downtime costs</li>
            </ul>
            <p className="content-text">
              <strong>Together, they erode margins year after year.</strong>
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">The Ownership Advantage</h2>
            <p className="content-text">
              When infrastructure is owned and coordinated by the property — not fragmented
              across vendors — the financial model shifts:
            </p>
            <ul className="content-list">
              <li>New revenue streams from connectivity, data services, and tenant offerings</li>
              <li>Lower OpEx through system coordination and vendor consolidation</li>
              <li>Reduced downtime and risk through integrated monitoring and control</li>
              <li>Higher tenant retention through better experience and reliability</li>
            </ul>
            <p className="content-text">
              <strong>This is not theoretical. It is structural.</strong>
            </p>
          </div>
        </div>
      </section>

      <section className="faq-section-simple">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <div className="faq-item">
              <p className="faq-question">How does digital infrastructure increase NOI?</p>
              <p className="faq-answer">
                By enabling owner-controlled revenue, reducing operating costs, lowering risk,
                and preserving long-term control.
              </p>
            </div>
            <div className="faq-item">
              <p className="faq-question">Is this about adding more technology?</p>
              <p className="faq-answer">
                No. It is about changing who controls the economics.
              </p>
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
