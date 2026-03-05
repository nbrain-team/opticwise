import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "5S® Wireless Connectivity",
  description:
    "OpticWise's wireless connectivity product delivering seamless mobility, security, stability, speed, and service.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="5S® Wireless Connectivity"
        lead="OpticWise's wireless connectivity product delivering seamless mobility, security, stability, speed, and service."
        badge="Product"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block-centered">
            <p className="content-lead">
              5S® is OpticWise&apos;s wireless connectivity product delivering
              seamless mobility, security, stability, speed, and service.
            </p>
            <p className="content-text">
              It operates across Wi-Fi, in-building cellular, DAS, and future
              wireless protocols.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">
              Experience Without Surrendering Control
            </h2>
            <p className="content-lead">
              5S® delivers tenant experience without vendor lock-in.
            </p>
            <p className="content-text">
              Wireless connectivity is often the first thing tenants experience and
              the last thing owners control. Carriers and managed service providers
              typically own the infrastructure, capture the data, and set the terms.
            </p>
            <p className="content-text">
              5S® changes the model. It delivers the seamless, high-performance
              wireless experience tenants expect — while keeping ownership,
              visibility, and operational control with the property owner.
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
