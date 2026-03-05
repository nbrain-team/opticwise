import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI-Ready Commercial Real Estate",
  description:
    "Properties designed and operated with owner-controlled digital infrastructure and high-fidelity data for predictive operations, resilience, and long-term competitive advantage.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="AI-Ready Commercial Real Estate"
        lead="Properties designed and operated with owner-controlled digital infrastructure and high-fidelity data for predictive operations."
        badge="Pillar"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <div className="definition-box">
              <p className="definition-label">Definition</p>
              <p className="definition-text">
                AI-ready commercial real estate refers to properties that are designed and operated
                with owner-controlled digital infrastructure and high-fidelity data, enabling
                predictive operations, resilience, and long-term competitive advantage.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">A New Asset Classification</h2>
            <p className="content-lead">
              AI readiness distinguishes assets that adapt from those that degrade. It is becoming a
              valuation signal.
            </p>
            <p className="content-text">
              Buildings that generate structured, owner-controlled data can feed predictive models
              for maintenance, energy optimization, tenant experience, and capital planning. Those
              that rely on vendor-siloed systems lack the continuity and fidelity AI requires. The
              gap between AI-ready and AI-dependent properties will widen as underwriting,
              insurance, and tenant expectations evolve.
            </p>
            <p className="content-text">
              AI readiness is not about installing new technology. It is about ensuring the
              infrastructure already in place produces usable, trustworthy data under owner control.
              That is the foundation predictive operations require.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Why Investors Will Care</h2>
            <p className="content-lead">
              Data continuity, adaptability, and risk reduction will increasingly influence pricing
              and liquidity.
            </p>
            <p className="content-text">
              Institutional investors are beginning to differentiate between buildings with
              structured data histories and those without. Properties that can demonstrate
              operational intelligence — energy baselines, maintenance prediction accuracy, tenant
              satisfaction trends — will command premium positioning during acquisitions and
              refinancing.
            </p>
            <p className="content-text">
              Conversely, assets dependent on fragmented vendor data face compounding risk: loss of
              continuity during transitions, inability to benchmark performance, and limited
              capacity for AI-driven optimization. AI readiness is becoming a structural advantage,
              not a technology feature.
            </p>
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
