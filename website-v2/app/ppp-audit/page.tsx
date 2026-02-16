import type { Metadata } from "next";
import Link from "next/link";
import { readMarkdown } from "@/lib/content";
import { SchemaJsonLd } from "@/components/SchemaJsonLd";
import { PageHero } from "@/components/PageHero";
import { TwoLayerModel } from "@/components/TwoLayerModel";
import { PPP5CProcess } from "@/components/PPP5CProcess";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "PPP Audit™",
  description:
    "PPP Audit™ is the Clarify entry point: it maps what you own, where value is leaking, and what data is trustworthy and portable.",
};

export default function PPPAuditPage() {
  return (
    <>
      <SchemaJsonLd path="/ppp-audit/" />

      <PageHero
        title="PPP Audit™"
        subtitle="Peak Property Performance® (PPP™) is OpticWise's owner-first operating model for turning data & digital infrastructure into measurable outcomes."
        description="PPP Audit™ is the Clarify entry point: it maps what you own, where value is leaking, and what data is trustworthy and portable—so you can standardize once and scale."
        showCTA={false}
        compact
      />

      {/* What the PPP Audit Does */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="ow-section-title">What the PPP Audit&trade; Does</h2>
            <div className="ow-divider mb-8" />

            <p className="text-gray-600 mb-6">
              The PPP Audit&trade; establishes a clear understanding of:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "What you own",
                  desc: "(and what you don't)",
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  title: "Where value is leaking",
                  desc: "(NOI, OpEx, vendor friction, redundancy)",
                  icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                },
                {
                  title: "Who is accountable",
                  desc: "for integration outcomes (not just installs)",
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                },
                {
                  title: "What data is trustworthy",
                  desc: "and portable",
                  icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
                },
                {
                  title: "Where you have the least control",
                  desc: "(vendors, networks, integrations, data access)",
                  icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                },
              ].map((item, i) => (
                <div key={i} className="ow-card ow-card-hover">
                  <div className="flex items-start gap-3">
                    <div className="ow-icon-box flex-shrink-0 w-10 h-10">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ow-callout mt-8">
              <p className="text-gray-700 font-medium m-0">
                This is not a &quot;tech assessment.&quot; It&apos;s an ownership and
                operating model reset.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Walk Away With */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="ow-section-title text-center">
              What You Walk Away With
            </h2>
            <div className="ow-divider mx-auto mb-10" />

            <div className="grid md:grid-cols-3 gap-6">
              <div className="ow-card bg-white">
                <div className="text-3xl font-bold text-ow-blue/20 mb-3">01</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Ownership + Control Map
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Admin credentials and access ownership</li>
                  <li>Export rights and portability status</li>
                  <li>Vendor boundaries and responsibilities</li>
                  <li>Shadow network detection and remediation plan</li>
                </ul>
              </div>

              <div className="ow-card bg-white">
                <div className="text-3xl font-bold text-ow-blue/20 mb-3">02</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  KPI Alignment (Scoreboard)
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>NOI / yield</li>
                  <li>OpEx / O&amp;M</li>
                  <li>Tenant experience outcomes</li>
                  <li>Utilities, Insurance, Risk narrative</li>
                  <li>Lease-up velocity</li>
                  <li>Investor story / diligence readiness</li>
                </ul>
              </div>

              <div className="ow-card bg-white">
                <div className="text-3xl font-bold text-ow-blue/20 mb-3">03</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  A Repeatable Standard
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>The rules vendors must follow</li>
                  <li>The foundation you can scale across properties</li>
                  <li>The path from Property Intelligence to Portfolio Intelligence</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PPP 5C */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="ow-section-title">How It Fits PPP 5C&trade;</h2>
            <div className="ow-divider mx-auto mb-6" />
            <p className="ow-section-subtitle mx-auto">
              PPP Audit&trade; is <strong>Clarify</strong>&mdash;the first step of PPP
              5C&trade;.
            </p>
          </div>
          <PPP5CProcess />
        </div>
      </section>

      {/* Who It's For */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="ow-section-title">Who It&apos;s For</h2>
            <div className="ow-divider mx-auto mb-8" />
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Operational control without adding burden to on-site teams",
                "Portfolio repeatability (standardize once, scale)",
                "Reduced lock-in and lower diligence risk",
                "AI readiness grounded in governance",
              ].map((item, i) => (
                <div key={i} className="ow-card text-left">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-ow-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-gray-700 text-sm">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="max-w-3xl mx-auto">
            <h2 className="ow-section-title text-center mb-8">
              Frequently Asked Questions
            </h2>
            <FAQAccordion
              items={[
                {
                  question: "What do we actually get out of a PPP Review/Audit?",
                  answer:
                    "A clear map of what you own, where value is leaking, who's accountable, and what data is trustworthy and portable—so you can standardize once and scale.",
                },
                {
                  question: 'Is this an "audit" in the accounting sense?',
                  answer:
                    "No. It's Clarify—the operational ownership map that makes future decisions faster, safer, and repeatable.",
                },
                {
                  question: "What happens after the PPP Audit™?",
                  answer:
                    "You use the findings to implement Layer 1 (managed data & digital infrastructure) and then Layer 2 (owner-controlled intelligence layer) so outcomes compound across the portfolio.",
                },
              ]}
            />
          </div>
        </div>
      </section>

      <CTASection
        heading="Your Next Step"
        variant="blue"
      />
    </>
  );
}
