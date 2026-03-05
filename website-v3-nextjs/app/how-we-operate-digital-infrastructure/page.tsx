import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How OpticWise Operates Digital Infrastructure",
  description:
    "OpticWise designs, deploys, manages, and governs owner-controlled digital infrastructure across portfolios.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="How OpticWise Operates Digital Infrastructure"
        lead="OpticWise designs, deploys, manages, and governs owner-controlled digital infrastructure across portfolios."
        badge="Operations"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <p className="content-lead">
              OpticWise designs, deploys, manages, and governs owner-controlled
              digital infrastructure across portfolios.
            </p>
            <p className="content-text">
              We operate networks, wireless connectivity, sensors, and data
              environments to ensure control, continuity, and resilience.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">What We Operate</h2>
            <ul className="content-list">
              <li>Core networks (wired and wireless)</li>
              <li>Wireless connectivity (Wi-Fi, cellular, DAS)</li>
              <li>Sensor and system connectivity</li>
              <li>Owner-controlled data environments</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Why Operations Matter</h2>
            <p className="content-lead">
              Ownership without operations does not create control.
            </p>
            <p className="content-text">
              Infrastructure requires ongoing management — monitoring, maintenance,
              optimization, and governance — to deliver the value it was designed
              for. Without disciplined operations, even owner-controlled systems
              degrade, fragment, and lose alignment with business objectives over
              time.
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
