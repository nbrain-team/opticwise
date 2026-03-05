import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Own vs Lease CRE Building Data",
  description:
    "Understanding the difference between owning your operational data versus leasing it from vendor platforms, and why data ownership is a structural advantage.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Own vs Lease CRE Building Data"
        lead="Understanding the difference between owning your operational data versus leasing it from vendor platforms."
        badge="Pillar"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <div className="definition-box">
              <p className="definition-label">Definition</p>
              <p className="definition-text">
                Owning CRE building data means the property owner retains full control, access, and
                decision rights over operational and tenant-generated data, while leasing data places
                those rights in the hands of vendors and platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">The Hidden Risk of Leasing Data</h2>
            <p className="content-lead">
              Leased data disappears when vendors change. Owned data compounds intelligence over
              time.
            </p>
            <p className="content-text">
              Most commercial real estate owners do not realize their operational data — energy
              usage, access control logs, maintenance histories, tenant behavior patterns — is held
              inside vendor platforms they do not control. When contracts end or vendors pivot, that
              data often leaves with them.
            </p>
            <p className="content-text">
              Vendor lock-in creates structural risk that compounds over time. Each system renewal
              resets the data clock. Benchmarking across years becomes impossible. AI models trained
              on fragmented, vendor-owned datasets produce unreliable outputs. The cost is not just
              operational — it is strategic. Owners who lease their data lease their ability to make
              informed decisions about their own assets.
            </p>
            <p className="content-text">
              Owning your data means retaining the ability to compare, analyze, and act across full
              asset lifecycles — regardless of which vendors are in place at any given moment. That
              continuity is what separates reactive management from predictive operations.
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
