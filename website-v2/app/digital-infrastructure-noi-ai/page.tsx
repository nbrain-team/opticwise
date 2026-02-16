import type { Metadata } from "next";
import Link from "next/link";
import { SchemaJsonLd } from "@/components/SchemaJsonLd";
import { PageHero } from "@/components/PageHero";
import { TwoLayerModel } from "@/components/TwoLayerModel";
import { PPP5CProcess } from "@/components/PPP5CProcess";
import { PillarCard } from "@/components/PillarCard";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure, NOI, and AI in CRE",
  description:
    "Commercial real estate is entering a structural shift. Not a technology cycle. A control cycle. Explore the pillars connecting data & digital infrastructure, NOI, and AI.",
};

export default function CategoryHubPage() {
  return (
    <>
      <SchemaJsonLd path="/digital-infrastructure-noi-ai/" />

      <PageHero
        title="Data & Digital Infrastructure, NOI, and AI in Commercial Real Estate"
        subtitle="Commercial real estate is entering a structural shift. Not a technology cycle. A control cycle."
        showCTA={false}
        compact
      />

      {/* Why One Conversation */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="max-w-3xl mx-auto">
            <h2 className="ow-section-title">
              Why These Topics Are Now One Conversation
            </h2>
            <div className="ow-divider mb-6" />
            <p className="text-gray-600 mb-6">
              For years, owners treated these as separate:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                ["NOI", "lived in finance"],
                ["Data & digital infrastructure", "lived in IT and low-voltage decisions"],
                ["AI", "lived in innovation teams"],
                ["Visibility", "lived in marketing and leasing"],
              ].map(([topic, desc], i) => (
                <div key={i} className="ow-card border-gray-200 p-4">
                  <span className="font-bold text-gray-900">{topic}</span>
                  <span className="text-gray-500 text-sm"> {desc}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-700 font-medium">
              That separation no longer holds.
            </p>
            <p className="text-gray-600 mt-4">
              Today, <strong>data &amp; digital infrastructure ownership</strong>{" "}
              sits upstream of:
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "NOI performance and yield",
                "Tenant experience outcomes",
                "Operational control and resilience",
                "AI readiness and future decision engines",
                "Digital visibility across search and AI systems",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-ow-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Core Shift */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="max-w-3xl mx-auto">
            <h2 className="ow-section-title">
              The Core Shift: From Vendor Convenience to Owner Control
            </h2>
            <div className="ow-divider mb-6" />
            <p className="text-gray-600 mb-4">
              Most owners didn&apos;t give up control intentionally.
            </p>
            <p className="text-gray-600 mb-6">
              It happened one contract, one &quot;smart&quot; system, one dashboard at a
              time:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {[
                "Shadow networks",
                "Siloed integrations",
                "Data trapped inside platforms",
                "Low-voltage decisions locked without governance",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-700">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 italic">
              Each decision feels tactical. Together, they create a structural
              disadvantage across a portfolio.
            </p>
          </div>
        </div>
      </section>

      {/* Two Layer Model */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="ow-section-title">
              The Two-Layer Model (How You Build for the Next Decade)
            </h2>
            <div className="ow-divider mx-auto mb-6" />
          </div>
          <TwoLayerModel />
        </div>
      </section>

      {/* PPP 5C */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="ow-section-title">PPP 5C&trade; (The Owner Path)</h2>
            <div className="ow-divider mx-auto mb-6" />
          </div>
          <PPP5CProcess />
        </div>
      </section>

      {/* 5S Canonical */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="max-w-3xl mx-auto ow-callout">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Canonical Clarification: 5S&reg;
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-0">
              5S&reg; is OpticWise&apos;s wireless connectivity product. It delivers a
              5S&reg; user experience (UX) defined by{" "}
              <strong>
                Seamless Mobility, Security, Stability (resilience), Speed, and
                Service
              </strong>
              . It may be delivered over Wi-Fi, in-building cellular, DAS, and
              other present or future wireless protocols. 5S&reg; is a user
              experience (UX), not a strategy or framework.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="ow-section-title">
              The Pillars (Explore by Outcome)
            </h2>
            <div className="ow-divider mx-auto mb-6" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SITE.nav.pillars.map((pillar, i) => (
              <PillarCard
                key={pillar.href}
                number={i + 1}
                title={pillar.label}
                description={pillar.description}
                href={pillar.href}
              />
            ))}
          </div>
        </div>
      </section>

      <CTASection variant="blue" />
    </>
  );
}
