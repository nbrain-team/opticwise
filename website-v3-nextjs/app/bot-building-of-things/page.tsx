import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "BoT® (Building of Things®)",
  description:
    "The connective layer that turns networks, sensors, systems, data environments, and AI into one owner-controlled digital nervous system.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="BoT® (Building of Things®)"
        lead="The connective layer that turns networks, sensors, systems, data environments, and AI into one owner-controlled digital nervous system."
        badge="Product"
      />

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">
              From the Internet of Things to the Building of Things
            </h2>
            <p className="content-text">
              Most owners are familiar with the Internet of Things — sensors,
              devices, and platforms that promise smarter buildings. Billions of
              dollars have been spent connecting things inside commercial properties.
            </p>
            <p className="content-text">
              The problem is not that buildings lack connected things. The problem is
              that those things are operated by vendors — not by the owner.
            </p>
            <p className="content-text">
              BoT® (Building of Things®) reframes this reality.
            </p>
            <p className="content-text">
              BoT® is the connective layer that turns networks, sensors, systems,
              data environments, and AI into one owner-controlled digital nervous
              system.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section bg-light">
        <div className="ow-container">
          <div className="content-block">
            <h2 className="section-title">Why BoT® Exists</h2>
            <p className="content-text">
              <strong>Without BoT®:</strong>
            </p>
            <ul className="content-list">
              <li>Systems remain siloed</li>
              <li>Data fragments over time</li>
              <li>Intelligence resets when vendors change</li>
            </ul>
            <p className="content-text">
              <strong>With BoT®:</strong>
            </p>
            <ul className="content-list">
              <li>The building behaves as a system</li>
              <li>Data continuity is preserved</li>
              <li>Intelligence compounds under owner control</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block-centered">
            <h2 className="section-title">From Signals to Intelligence</h2>
            <p className="content-lead">
              Without BoT®, systems remain siloed.
            </p>
            <p className="content-lead">
              With BoT®, intelligence compounds.
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
                How is BoT® different from IoT?
              </p>
              <p className="faq-answer">
                IoT describes connected devices. BoT® describes owner-controlled
                operation of all digital things within a building as a unified
                system.
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
