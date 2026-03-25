"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";

function ChevronSvg() {
  return <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7" /></svg>;
}

const DISCOVER_CARDS = [
  { title: "Infrastructure Ownership", desc: "Discover which vendors own your infrastructure\u2014and how to change that.", color: "from-blue-600 to-blue-800", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
  { title: "System Analysis", desc: "Identify gaps, overlaps, and opportunities across all digital systems.", color: "from-violet-500 to-violet-700", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { title: "Readiness Score", desc: "Calculate your Digital Asset Readiness Score\u2122.", color: "from-emerald-500 to-emerald-700", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
  { title: "OpEx Savings", desc: "See where predictive operations can unlock 5\u201315% in OpEx savings.", color: "from-amber-500 to-amber-700", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
  { title: "Future-Proof", desc: "Future-proof for AI, ESG, tenant experience, and investor expectations.", color: "from-sky-500 to-sky-700", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
];

export default function ScheduleReviewPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    try {
      await fetch("/api/lead-magnet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } catch { /* still show success */ }
    setLoading(false);
    setSubmitted(true);
  }

  const inputCls = "w-full rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ow-blue focus:border-transparent";

  return (
    <>
      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden pt-36 pb-20">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero-industry.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="hero-overlay" />
        <div className="hero-grid-lines" />
        <div className="relative z-10 ow-container max-w-3xl">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 mb-5 transition-colors">&larr; Home</Link>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Schedule Your CRE Data &amp; Digital Infrastructure Review
          </h1>
          <p className="text-lg text-white/85 leading-relaxed mb-4">
            Take back control. Uncover hidden costs, broken tech stacks, and missed NOI opportunities.
          </p>
          <p className="text-base text-white/65 leading-relaxed mb-4">
            The PPP Data &amp; Digital Infrastructure Review gives you clarity, fast&mdash;so you can start monetizing your building&rsquo;s data &amp; digital infrastructure like the asset it is.
          </p>
          <div className="mt-6 px-6 py-4 rounded-xl bg-ow-blue/15 border border-blue-400/30 backdrop-blur-sm">
            <p className="text-base font-bold text-white m-0">{SITE.reframingLine}</p>
          </div>
        </div>
      </section>

      {/* ==================== FORM SECTION ==================== */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="grid lg:grid-cols-[1fr_480px] gap-12 lg:gap-16 items-start max-w-5xl mx-auto">
            <div>
              <span className="section-eyebrow">Your Next Step</span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-2 mb-3">Schedule Your PPP Data &amp; Digital Infrastructure Review</h2>
              <div className="accent-bar mb-6" />
              <p className="text-gray-600 leading-relaxed mb-4">Take the first step toward maximizing your building&rsquo;s digital asset potential.</p>
              <p className="text-gray-600 leading-relaxed mb-4">Share your challenges and learn about the comprehensive digital infrastructure audit that reveals hidden value and untapped potential in your commercial real estate portfolio.</p>
              <p className="text-sm text-gray-400 mt-6">One building. One review. One clear path to owner control.</p>
            </div>
            <div className="rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl p-8">
              <h3 className="text-xl font-extrabold text-white text-center mb-6">Request Your Complementary Review</h3>
              {submitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Thank you!</h4>
                  <p className="text-white/60 text-sm">We&rsquo;ve received your request. A member of the OpticWise team will be in touch within one business day.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">First Name <span className="text-amber-400">*</span></span>
                      <input name="firstName" required placeholder="John" className={`mt-1.5 ${inputCls}`} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Last Name <span className="text-amber-400">*</span></span>
                      <input name="lastName" required placeholder="Smith" className={`mt-1.5 ${inputCls}`} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Company</span>
                    <input name="company" placeholder="Your company name" className={`mt-1.5 ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Email <span className="text-amber-400">*</span></span>
                    <input name="email" type="email" required placeholder="john@company.com" className={`mt-1.5 ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Notes or Questions</span>
                    <textarea name="notes" rows={3} placeholder="Tell us about your building, challenges, or questions..." className={`mt-1.5 ${inputCls} resize-none`} />
                  </label>
                  <button type="submit" disabled={loading} className="w-full btn btn-primary text-base py-4 disabled:opacity-60">
                    {loading ? "Submitting\u2026" : "Schedule My PPP Data & Digital Infrastructure Review \u2192"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== WHAT YOU'LL DISCOVER ==================== */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">What You&rsquo;ll Discover</span>
            <h2 className="section-heading">Your Review Reveals Hidden Value</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle">Share your challenges and learn all about the comprehensive digital infrastructure audit that reveals hidden value and untapped potential in your commercial real estate portfolio.</p>
          </div>
          <div className="audit-grid">
            {DISCOVER_CARDS.map((card) => (
              <div key={card.title} className="audit-card">
                <div className={`audit-icon bg-gradient-to-br ${card.color}`} style={{ background: undefined }}>
                  {card.icon}
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIAL ==================== */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="max-w-3xl mx-auto text-center">
            <svg className="w-10 h-10 text-ow-blue/30 mx-auto mb-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.19 11 15c0 1.933-1.567 3.5-3.5 3.5-1.073 0-2.099-.49-2.917-1.179ZM15.583 17.321C14.553 16.227 14 15 14 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C20.591 11.69 22 13.19 22 15c0 1.933-1.567 3.5-3.5 3.5-1.073 0-2.099-.49-2.917-1.179Z" />
            </svg>
            <blockquote className="text-xl text-gray-700 italic leading-relaxed font-medium">
              &ldquo;This review opened our eyes. We&rsquo;ve always upgraded systems, but never saw how owning the infrastructure itself would change our NOI. Game-changing.&rdquo;
            </blockquote>
            <p className="mt-5 font-bold text-gray-900">Joe Fielden Jr.</p>
            <p className="text-sm text-gray-500">Developer &amp; Operator</p>
          </div>
        </div>
      </section>

      {/* ==================== TRUSTED BY ==================== */}
      <section className="section section-dark">
        <div className="ow-container">
          <div className="section-header section-header-light">
            <span className="section-eyebrow section-eyebrow-light">Track Record</span>
            <h2 className="section-heading section-heading-light">Trusted by Industry Leaders</h2>
            <div className="accent-bar accent-bar-center" />
            <p className="section-subtitle" style={{ color: "rgba(255,255,255,.7)" }}>Join commercial real estate owners who are already maximizing their digital assets.</p>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="text-3xl font-extrabold text-blue-400 mb-2">18+</div>
              <h3>Years Experience</h3>
              <p>Helping CRE owners generate NOI from digital infrastructure</p>
            </div>
            <div className="audience-card">
              <div className="text-3xl font-extrabold text-blue-400 mb-2">Global</div>
              <h3>Trusted Partners</h3>
              <p>Digital partners with global CRE companies</p>
            </div>
            <div className="audience-card">
              <div className="text-3xl font-extrabold text-blue-400 mb-2">PPP&trade;</div>
              <h3>Best-Selling Book</h3>
              <p>CRE digital strategy book by Fast Company Press</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 z-0"><img src="/images/testimonial-bg.jpg" alt="" className="w-full h-full object-cover" /></div>
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(135deg, rgba(43,108,176,.92), rgba(30,78,140,.95))" }} />
        <div className="relative z-10 ow-container text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-4">Ready?</p>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-4 leading-tight">Don&rsquo;t Play for Next Quarter&mdash;Build for the Next Decade</h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">{SITE.closingLine}</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="btn btn-white btn-lg">Schedule Your Review &uarr;</button>
        </div>
      </section>

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
