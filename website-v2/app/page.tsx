import Link from "next/link";
import { SchemaJsonLd } from "@/components/SchemaJsonLd";
import { TwoLayerModel } from "@/components/TwoLayerModel";
import { PPP5CProcess } from "@/components/PPP5CProcess";
import { PillarCard } from "@/components/PillarCard";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <SchemaJsonLd path="/" />

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-ow-navy via-ow-navy-light to-ow-navy" />
        <div className="absolute inset-0 hero-grid-overlay opacity-30" />
        <div className="absolute inset-0 hero-gradient" />

        <div className="relative z-10 ow-container text-center">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-5xl mx-auto mb-8">
            Own Your Data &amp; Digital Infrastructure.{" "}
            <span className="text-gradient">Build for the Long Game.</span>
          </h1>

          <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto mb-4 font-light leading-relaxed">
            Data &amp; digital infrastructure are no longer background utilities.
          </p>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-4">
            They determine who controls NOI, who owns operational and tenant
            data, and who shapes the future intelligence of commercial real
            estate assets.
          </p>
          <p className="text-base text-white/60 max-w-xl mx-auto mb-10">
            For years, these decisions were delegated to vendors. That era is
            ending.
          </p>

          {/* Reframing callout */}
          <div
            className="ow-callout max-w-2xl mx-auto mb-10"
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              borderColor: "rgba(16, 185, 129, 0.3)",
            }}
          >
            <p className="text-lg lg:text-xl font-bold text-white m-0">
              {SITE.reframingLine}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={SITE.primaryCTA.href} className="btn btn-primary">
              Schedule Your Review
            </Link>
            <Link
              href="/digital-infrastructure-noi-ai/"
              className="btn btn-outline"
            >
              Explore the Pillars
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== PROBLEM ==================== */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium text-sm">Silent Loss of Control</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <h2 className="ow-section-title">
                The Owner Problem: Silent Loss of Control
              </h2>
              <div className="ow-divider mb-6" />
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Most owners did not give up control intentionally. It happened
                quietly:
              </p>
              <div className="space-y-4">
                {[
                  ["Networks", "installed under vendor contracts"],
                  ["Wireless systems", "designed around revenue share"],
                  ["Data", "locked inside dashboards"],
                  ["Visibility", "defined by third-party platforms"],
                ].map(([strong, rest], i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-gray-700">
                      <strong className="text-gray-900">{strong}</strong> {rest}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 mt-6 italic">
                Each decision felt tactical. Together, they shifted control away
                from the asset.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== WHAT OWNERSHIP UNLOCKS ==================== */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="ow-section-title">What Ownership Unlocks</h2>
            <div className="ow-divider mx-auto mb-6" />
            <p className="ow-section-subtitle mx-auto">
              When you reclaim control of data &amp; digital infrastructure,
              outcomes change.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ),
                title: "NOI Improves",
                desc: "Through owner-controlled connectivity and operational efficiency",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
                title: "Tenant Experience Improves",
                desc: "Through consistent, measurable performance",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ),
                title: "Operations Stabilize",
                desc: "Through coordination and reduced vendor friction",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                ),
                title: "AI Readiness Becomes Real",
                desc: "Not theoretical — grounded in governance",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                ),
                title: "Assets Future-Proof",
                desc: "As vendors and technologies change",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                title: "Control the Economics",
                desc: "This is not about more technology — it's about who controls the economics",
              },
            ].map((item, i) => (
              <div key={i} className="ow-card ow-card-hover text-center p-8">
                <div className="ow-icon-box mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TWO-LAYER MODEL ==================== */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="ow-section-title">
              How OpticWise Helps You Win the Long Game
            </h2>
            <div className="ow-divider mx-auto mb-6" />
            <p className="ow-section-subtitle mx-auto">
              OpticWise is not a bolt-on vendor. We partner with you to design,
              implement, and operate managed data &amp; digital
              infrastructure&mdash;and provide the owner-controlled intelligence
              layer that turns Property Intelligence into Portfolio Intelligence.
            </p>
          </div>
          <TwoLayerModel />
        </div>
      </section>

      {/* ==================== PPP 5C PROCESS ==================== */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="ow-section-title">The PPP 5C&trade; Owner Path</h2>
            <div className="ow-divider mx-auto mb-6" />
            <p className="ow-section-subtitle mx-auto">
              A repeatable framework to move from fragmented vendor control to
              owner-controlled intelligence that scales portfolio-wide.
            </p>
          </div>
          <PPP5CProcess />
        </div>
      </section>

      {/* ==================== EXPLORE PILLARS ==================== */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="ow-section-title">Explore by Outcome</h2>
            <div className="ow-divider mx-auto mb-6" />
            <p className="ow-section-subtitle mx-auto">
              Six pillars connecting data &amp; digital infrastructure, NOI, and
              AI in commercial real estate.
            </p>
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

      {/* ==================== THE INFINITE GAME ==================== */}
      <section className="bg-gradient-to-br from-ow-navy to-ow-navy-light relative overflow-hidden">
        <div className="absolute inset-0 hero-grid-overlay opacity-20" />
        <div className="relative z-10 ow-container py-20 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            The Infinite Game
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Don&apos;t play for next quarter&mdash;build for the next decade.
          </p>
          <p className="text-lg font-semibold text-white/90 max-w-xl mx-auto">
            {SITE.closingLine}
          </p>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <CTASection heading="Your Next Step" variant="blue" />
    </>
  );
}
