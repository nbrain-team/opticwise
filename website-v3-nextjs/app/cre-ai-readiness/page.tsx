import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "CRE AI Readiness",
  description:
    "The condition in which a CRE owner controls their digital infrastructure well enough for AI to produce reliable, actionable insights.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="CRE AI Readiness"
        lead="The condition in which a CRE owner controls their digital infrastructure well enough for AI to produce reliable, actionable insights."
        badge="Pillar"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <div className="definition-box">
              <p className="definition-label">Definition</p>
              <p className="definition-text">
                CRE AI readiness is the condition in which a commercial real estate owner
                controls their digital infrastructure, data access, and system integration well
                enough for AI to produce reliable, actionable insights — without vendor
                lock-in, data loss, or black-box dependencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Why AI Fails in Most Buildings</h2>
            <p className="content-text">
              Most AI initiatives in commercial real estate underperform — not because the
              models are wrong, but because the inputs are unreliable. The most common failure
              points are structural:
            </p>
            <ul className="content-list">
              <li><strong>Data is fragmented</strong> — spread across vendors, platforms, and formats with no unified access layer</li>
              <li><strong>Infrastructure is vendor-controlled</strong> — owners lack visibility into what data exists, where it flows, and who can access it</li>
              <li><strong>Context is missing</strong> — AI cannot interpret building operations without clean, structured, and continuously available data</li>
            </ul>
            <p className="content-text">
              <strong>The problem is not the AI. The problem is the foundation.</strong>
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Infrastructure Is the Gate</h2>
            <p className="content-lead">
              AI readiness is not a software decision. It is an infrastructure ownership
              decision.
            </p>
            <p className="content-text">
              When an owner controls their digital infrastructure — the network, the data
              pipelines, the integration layer — AI has what it needs to function reliably.
              When that infrastructure is fragmented or vendor-controlled, AI outputs become
              unreliable, inconsistent, and ultimately unusable at scale.
            </p>
            <p className="content-text">
              Controlled infrastructure enables AI to deliver actionable insights because the
              data is clean, accessible, and governed by the owner. Without that foundation,
              even the most advanced AI tools produce noise instead of signal.
            </p>
          </div>
        </div>
      </section>

      <section className="faq-section-simple">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <div className="faq-item">
              <p className="faq-question">Is AI readiness about buying AI tools?</p>
              <p className="faq-answer">
                No. It is about controlling the infrastructure AI depends on.
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
