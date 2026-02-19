import Link from "next/link";
import { getPageBySlug } from "@/lib/ghost";
import { GhostContent } from "@/components/GhostContent";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export default async function HomePage() {
  const page = await getPageBySlug("home");

  return (
    <>
      {/* ==================== HERO ==================== */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-20">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero-industry.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="hero-overlay" />
        <div className="hero-grid-lines" />
        <div className="relative z-10 ow-container text-center max-w-[900px] mx-auto">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight mb-7">
            Own Your Data &amp; Digital Infrastructure.{" "}
            <span className="text-gradient">Build for the Long Game.</span>
          </h1>
          <p className="text-lg lg:text-xl text-white/85 max-w-2xl mx-auto mb-4 leading-relaxed">
            Data &amp; digital infrastructure are no longer background utilities. They determine who controls NOI, who owns operational and tenant data, and who shapes the future intelligence of commercial real estate assets.
          </p>
          <p className="text-base text-white/60 mb-8">For years, these decisions were delegated to vendors. That era is ending.</p>
          <div className="max-w-xl mx-auto px-7 py-5 rounded-xl bg-ow-blue/15 border border-blue-400/30 backdrop-blur-sm mb-9">
            <p className="text-lg font-bold text-white m-0">{SITE.reframingLine}</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={SITE.primaryCTA.href} className="btn btn-primary btn-lg">Schedule Your Review</Link>
            <Link href="/digital-infrastructure-noi-ai/" className="btn btn-outline-light btn-lg">Explore the Pillars</Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/30 animate-[bounce_2s_infinite]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </div>
      </section>

      {/* ==================== PROBLEM ==================== */}
      <section className="ow-section bg-white" id="problem">
        <div className="ow-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img src="/images/solution-industry.jpg" alt="Building infrastructure" className="w-full" />
              <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Silent Loss of Control
              </div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-ow-blue mb-3 block">The Problem</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-2">The Owner Problem:<br />Silent Loss of Control</h2>
              <div className="accent-bar mb-6" />
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">Most owners did not give up control intentionally. It happened quietly:</p>
              <ul className="space-y-3.5 mb-6">
                {[["Networks", "installed under vendor contracts"], ["Wireless systems", "designed around revenue share"], ["Data", "locked inside dashboards"], ["Visibility", "defined by third-party platforms"]].map(([b, t], i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span><strong className="text-gray-900">{b}</strong> {t}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-400 italic text-sm">Each decision felt tactical. Together, they shifted control away from the asset.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== WHAT OWNERSHIP UNLOCKS ==================== */}
      <section className="ow-section bg-gray-50" id="outcomes">
        <div className="ow-container">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-ow-blue mb-3 block">The Solution</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">What Ownership Unlocks</h2>
            <div className="accent-bar-center accent-bar" />
            <p className="text-gray-500 text-lg max-w-xl mx-auto">When you reclaim control of data &amp; digital infrastructure, outcomes change.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: "NOI Improves", desc: "Through owner-controlled connectivity and operational efficiency", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
              { title: "Tenant Experience Improves", desc: "Through consistent, measurable performance", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
              { title: "Operations Stabilize", desc: "Through coordination and reduced vendor friction", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
              { title: "AI Readiness Becomes Real", desc: "Not theoretical \u2014 grounded in governance", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", accent: true },
              { title: "Assets Future-Proof", desc: "As vendors and technologies change", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg hover:-translate-y-1 hover:border-ow-blue/20 transition-all">
                <div className={`w-14 h-14 rounded-xl ${item.accent ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-gradient-to-br from-ow-blue to-ow-blue-dark"} text-white flex items-center justify-center mx-auto mb-4`}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={item.icon} /></svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 italic mt-10">This is not about more technology. It is about who controls the economics.</p>
        </div>
      </section>

      {/* ==================== TWO-LAYER MODEL ==================== */}
      <section className="ow-section bg-white" id="how-it-works">
        <div className="ow-container">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-ow-blue mb-3 block">The OpticWise Model</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">How OpticWise Helps You Win the Long Game</h2>
            <div className="accent-bar-center accent-bar" />
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              OpticWise is not a bolt-on vendor. We partner with you to design, implement, and operate <strong className="text-gray-900">managed data &amp; digital infrastructure</strong> services&mdash;and provide the <strong className="text-gray-900">owner-controlled intelligence layer</strong> that turns <strong className="text-gray-900">Property Intelligence &rarr; Portfolio Intelligence</strong>.
            </p>
          </div>
          <div className="max-w-3xl mx-auto flex flex-col gap-0">
            {/* Layer 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-9">
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-white bg-ow-blue px-3 py-1 rounded-md mb-3">Layer 1</span>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">Managed Data &amp; Digital Infrastructure</h3>
              <p className="text-sm text-gray-500 mb-5">The foundation you own</p>
              <ul className="space-y-3">
                {[["Design:", "repeatable standards across properties"], ["Implementation:", "governance baked in (segmentation, access rules, documentation)"], ["Operations:", "ongoing digital management to keep performance high and operational risk low\u2014without taxing your on-site engineers or property managers"]].map(([b, t], i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><path d="M5 13l4 4L19 7" /></svg>
                    <span><strong className="text-gray-900">{b}</strong> {t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center py-2 text-gray-300">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
            </div>
            {/* Layer 2 */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-9">
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-white bg-emerald-500 px-3 py-1 rounded-md mb-3">Layer 2</span>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">Owner-Controlled Intelligence Layer</h3>
              <p className="text-sm text-gray-500 mb-5">OpticWise Brain</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-5">
                A vendor- and LLM-agnostic <strong className="text-gray-900">Property Intelligence Layer</strong>: a governed <strong className="text-gray-900">data plane + trust plane</strong> enabling autonomous activities and intelligence&mdash;so you can plug in any systems and decision engines you want, and swap them over time.
              </p>
              <div className="flex items-center gap-3 flex-wrap bg-emerald-500/8 rounded-lg px-5 py-3.5 text-sm font-semibold text-emerald-800">
                <span>One standard intelligence substrate</span>
                <span className="text-emerald-500 text-lg">&rarr;</span>
                <span>Many decision engines</span>
                <span className="text-emerald-500 text-lg">&rarr;</span>
                <span>Scaled across buildings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PROJECTS ==================== */}
      <section className="ow-section bg-ow-navy">
        <div className="ow-container">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-3 block">Portfolio</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">Infrastructure We&rsquo;ve Built</h2>
            <div className="accent-bar-center accent-bar" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { img: "/images/project-catalyst.jpg", name: "Catalyst HTI", loc: "Denver, CO" },
              { img: "/images/project-industry.jpg", name: "Industry", loc: "Denver, CO" },
              { img: "/images/project-tradecraft.jpg", name: "Tradecraft", loc: "Denver, CO" },
            ].map((p, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-gray-800 group hover:-translate-y-1 transition-transform">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-white mb-1">{p.name}</h3>
                  <p className="text-sm text-gray-400">{p.loc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <CTASection />

      {/* ==================== INFINITE GAME ==================== */}
      <section className="bg-ow-navy py-20">
        <div className="ow-container text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-white mb-4">The Infinite Game</h2>
          <p className="text-lg text-white/70 mb-6">Don&rsquo;t play for next quarter&mdash;build for the next decade.</p>
          <p className="text-base text-white/85 font-semibold">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
