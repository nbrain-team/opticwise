import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Digital Infrastructure NOI Playbook",
  description:
    "A repeatable, owner-led framework that turns digital infrastructure into predictable NOI.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Digital Infrastructure NOI Playbook"
        lead="A repeatable, owner-led framework that turns digital infrastructure into predictable NOI."
        badge="Pillar"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <div className="definition-box">
              <p className="definition-label">Definition</p>
              <p className="definition-text">
                A digital infrastructure NOI playbook is a repeatable, owner-led framework that
                turns commercial real estate digital infrastructure, systems, and data into
                predictable NOI instead of unmanaged operating costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">From Strategy to Execution</h2>
            <p className="content-lead">
              Belief alone does not produce NOI. Execution does.
            </p>
            <p className="content-text">
              The playbook provides discipline and repeatability. It translates the principles
              of infrastructure ownership into a structured process — one that can be applied
              across a single building or an entire portfolio. Without a playbook, even the
              best strategy stalls at implementation.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">The PPP 5C Framework</h2>
            <div className="framework-grid">
              <div className="framework-item">
                <h3>Clarify (PPP Audit™)</h3>
                <p>
                  Map what you own, where value leaks, and what&apos;s trustworthy and
                  portable. This is the foundation — understanding the current state of your
                  infrastructure, contracts, and data before making any changes.
                </p>
              </div>
              <div className="framework-item">
                <h3>Connect</h3>
                <p>
                  Create a resilient digital backbone that links systems, platforms, and
                  devices. Replace fragmented, vendor-siloed networks with an owner-controlled
                  architecture designed for performance and flexibility.
                </p>
              </div>
              <div className="framework-item">
                <h3>Collect</h3>
                <p>
                  Aggregate high-fidelity, usable data from across your property. Establish
                  pipelines that capture operational, environmental, and tenant data in formats
                  you control and can act on.
                </p>
              </div>
              <div className="framework-item">
                <h3>Coordinate</h3>
                <p>
                  Align vendors and workflows so operations become predictable. Remove
                  redundancy, clarify responsibilities, and create accountability across every
                  system and service provider.
                </p>
              </div>
              <div className="framework-item">
                <h3>Control</h3>
                <p>
                  Reclaim ownership and stay platform-flexible over time. Ensure that your
                  infrastructure, data, and vendor relationships serve your NOI — not the other
                  way around.
                </p>
              </div>
            </div>
            <p className="content-text">
              <strong>
                This framework converts infrastructure into financial performance.
              </strong>
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
