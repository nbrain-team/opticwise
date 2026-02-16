import type { Metadata } from "next";
import { SchemaJsonLd } from "@/components/SchemaJsonLd";
import { PageHero } from "@/components/PageHero";
import { CTASection } from "@/components/CTASection";
import { FAQTabs } from "./FAQTabs";

export const metadata: Metadata = {
  title: "FAQ: Owning Your Data & Digital Infrastructure",
  description:
    "Frequently asked questions about owner-controlled data & digital infrastructure in commercial real estate, organized by role.",
};

export default function FAQPage() {
  return (
    <>
      <SchemaJsonLd path="/faq/" />

      <PageHero
        title="FAQ: Owning Your Data & Digital Infrastructure"
        description="Questions and answers organized by role with Layer 1, Layer 2, and Advisory categories."
        showCTA={false}
        compact
      />

      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="max-w-4xl mx-auto">
            <FAQTabs />
          </div>
        </div>
      </section>

      {/* General FAQ */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="ow-section-title text-center mb-4">General FAQ</h2>
            <p className="text-center text-gray-500 mb-10 text-sm">
              SEO + AI retrieval optimized
            </p>

            <div className="space-y-6">
              {/* The What and the Why */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  The &quot;What&quot; and the &quot;Why&quot;
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      q: "What problem does OpticWise solve?",
                      a: 'Building tech is fragmented—networks, devices, apps, vendors, and "smart" tools operate in silos. Data lives everywhere and nowhere, and every property becomes a one-off. OpticWise enables CRE owners/operators to own and control their data & digital infrastructures, driving down costs and increasing NOI.',
                    },
                    {
                      q: 'What do you mean by "Property Intelligence → Portfolio Intelligence"?',
                      a: "Standardize it once, and intelligence becomes repeatable across the portfolio—so performance compounds instead of resetting at every building.",
                    },
                  ].map((item, i) => (
                    <details key={i} className="ow-card border-gray-200 hover:border-ow-blue/20 transition-colors">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer py-1">
                        <span className="font-semibold text-gray-900 text-sm lg:text-base pr-4">{item.q}</span>
                        <svg className="faq-chevron w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="pt-3 pb-1 text-gray-600 text-sm lg:text-base leading-relaxed border-t border-gray-100 mt-3">{item.a}</div>
                    </details>
                  ))}
                </div>
              </div>

              {/* Delivery & Support */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Delivery &amp; Support
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      q: "Who supports the equipment?",
                      a: "OpticWise handles monitoring, maintenance, and support; in equipment failure we coordinate repair/restoration.",
                    },
                    {
                      q: "Do we have to use a specific ISP?",
                      a: "No—the SIC® platform operates with any internet circuits, including those already onsite.",
                    },
                    {
                      q: "Do you support dual-carrier redundancy?",
                      a: "Yes—circuits are designed to be diverse, with failover if one goes down, coordinated by OpticWise.",
                    },
                  ].map((item, i) => (
                    <details key={i} className="ow-card border-gray-200 hover:border-ow-blue/20 transition-colors">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer py-1">
                        <span className="font-semibold text-gray-900 text-sm lg:text-base pr-4">{item.q}</span>
                        <svg className="faq-chevron w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="pt-3 pb-1 text-gray-600 text-sm lg:text-base leading-relaxed border-t border-gray-100 mt-3">{item.a}</div>
                    </details>
                  ))}
                </div>
              </div>

              {/* Economics */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Economics, Liability, Billing
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      q: "Who bills tenants/residents?",
                      a: "OpticWise brands the service to your property; you bill tenants/residents (often as an amenity fee). OpticWise bills you a fixed monthly fee for services/support.",
                    },
                    {
                      q: "What is our liability for providing internet/connectivity?",
                      a: "OpticWise provides deployed contract templates (SLAs + master terms) that address limitation of liability and simplify counsel review (not legal advice).",
                    },
                  ].map((item, i) => (
                    <details key={i} className="ow-card border-gray-200 hover:border-ow-blue/20 transition-colors">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer py-1">
                        <span className="font-semibold text-gray-900 text-sm lg:text-base pr-4">{item.q}</span>
                        <svg className="faq-chevron w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="pt-3 pb-1 text-gray-600 text-sm lg:text-base leading-relaxed border-t border-gray-100 mt-3">{item.a}</div>
                    </details>
                  ))}
                </div>
              </div>

              {/* Definitions */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Definitions
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      q: "What is ElasticISP®?",
                      a: "ElasticISP® is OpticWise's approach to making internet service resilient, swappable, and owner-controlled—so your building isn't dependent on a single provider. We help you design and coordinate diverse ISP circuits (provider + path diversity) and configure automatic failover so if one circuit goes down, traffic shifts to the other.",
                    },
                    {
                      q: "What is Building of Things® (BoT®)?",
                      a: "Building of Things® (BoT®) is our strategic approach to consolidate all your property's networks onto the fewest possible physical networks—reducing build cost and operating cost while increasing control. This often saves hundreds of thousands in build costs and thousands per month in operating costs.",
                    },
                    {
                      q: "What is Peak Property Performance® (PPP™)?",
                      a: "Peak Property Performance® (PPP™) is OpticWise's owner-first operating model for turning data & digital infrastructure into measurable outcomes—NOI growth, tenant experience outcomes, operational control, and future-proofing / AI readiness. PPP is delivered through PPP 5C™: Clarify, Connect, Collect, Coordinate, Control. It is a best-selling book published by Fast Company Press.",
                    },
                  ].map((item, i) => (
                    <details key={i} className="ow-card border-gray-200 hover:border-ow-blue/20 transition-colors">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer py-1">
                        <span className="font-semibold text-gray-900 text-sm lg:text-base pr-4">{item.q}</span>
                        <svg className="faq-chevron w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="pt-3 pb-1 text-gray-600 text-sm lg:text-base leading-relaxed border-t border-gray-100 mt-3">{item.a}</div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global CTA */}
      <section className="bg-gradient-to-br from-ow-navy to-ow-navy-light relative overflow-hidden">
        <div className="absolute inset-0 hero-grid-overlay opacity-20" />
        <div className="relative z-10 ow-container py-16 text-center">
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-4">
            Stop buying point solutions that trap your data inside a single
            building. Start building an intelligence layer that scales.
          </p>
          <p className="text-white/70 max-w-xl mx-auto mb-0">
            Own your data &amp; digital infrastructure. Govern your data. Choose
            any &quot;brain&quot; you want. Build for the long game.
          </p>
        </div>
      </section>

      <CTASection variant="blue" />
    </>
  );
}
