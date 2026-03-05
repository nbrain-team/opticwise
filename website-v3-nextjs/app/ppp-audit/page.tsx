import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "PPP Audit™",
  description:
    "The starting point for understanding what you own, what you lease, and where value is leaking across your digital infrastructure and data.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="PPP Audit™"
        lead="The starting point for understanding what you own, what you lease, and where value is leaking across your digital infrastructure and data."
        badge="Service · Clarify"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block-centered">
            <p className="content-lead">
              The PPP Audit™ is the starting point for understanding what you own,
              what you lease, and where value is leaking across your digital
              infrastructure and data.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block-centered">
            <h2 className="section-title">Why the Audit Comes First</h2>
            <p className="content-lead">
              Strategy without clarity is guesswork.
            </p>
            <p className="content-text">
              The PPP Audit™ restores truth before decisions are made.
            </p>
          </div>
        </div>
      </section>

      <section className="faq-section-simple">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <div className="faq-item">
              <p className="faq-question">
                What does the PPP Audit™ actually evaluate?
              </p>
              <p className="faq-answer">
                It evaluates ownership and control of digital infrastructure, data
                flows, vendor contracts, and system integration across a property or
                portfolio.
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
