import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Control of CRE Digital Visibility",
  description:
    "The ability to govern how your building is represented across search engines, AI systems, and digital platforms — rather than allowing vendors to define that narrative.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Control of CRE Digital Visibility"
        lead="The ability to govern how your building is represented across search engines, AI systems, and digital platforms."
        badge="Pillar"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <div className="definition-box">
              <p className="definition-label">Definition</p>
              <p className="definition-text">
                Control of CRE digital visibility is the ability of a commercial real estate owner to
                govern how their building, performance, and data context are represented across
                search engines, AI systems, and digital platforms — rather than allowing vendors to
                define that narrative.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Visibility Is an Infrastructure Outcome</h2>
            <p className="content-lead">
              If owners do not control infrastructure, they do not control the story AI tells.
            </p>
            <p className="content-text">
              Digital visibility is no longer just a marketing concern. Search engines, AI
              assistants, and data aggregators now shape how buildings are perceived by tenants,
              investors, and brokers. The information these systems surface comes from structured
              data — and whoever controls that data controls the narrative.
            </p>
            <p className="content-text">
              When vendors own the digital infrastructure, they determine what data is published,
              how performance is framed, and which platforms receive it. Owners who lack
              infrastructure control cede their digital presence to third parties whose incentives
              may not align with long-term asset positioning.
            </p>
            <p className="content-text">
              Controlling digital visibility starts with controlling the infrastructure that
              generates and distributes building data. That is the only way to ensure your asset is
              represented accurately, consistently, and on your terms across every platform that
              matters.
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
