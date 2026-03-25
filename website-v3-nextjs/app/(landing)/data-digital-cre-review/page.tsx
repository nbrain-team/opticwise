"use client";

import { useState, FormEvent } from "react";

function IconBuilding({ className = "w-6 h-6" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
}
function IconSearch({ className = "w-6 h-6" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>;
}
function IconChart({ className = "w-6 h-6" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
}
function IconCurrency({ className = "w-6 h-6" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}
function IconShield({ className = "w-6 h-6" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>;
}

const DISCOVER_CARDS = [
  { title: "Infrastructure Ownership", desc: "Discover which vendors own your infrastructure\u2014and how to change that.", Icon: IconBuilding, gradient: "from-blue-600 to-blue-800" },
  { title: "System Analysis", desc: "Identify gaps, overlaps, and opportunities across all digital systems.", Icon: IconSearch, gradient: "from-emerald-500 to-emerald-700" },
  { title: "Readiness Score", desc: "Calculate your Digital Asset Readiness Score\u2122.", Icon: IconChart, gradient: "from-amber-500 to-amber-700" },
  { title: "OpEx Savings", desc: "See where predictive operations can unlock 5\u201315% in OpEx savings.", Icon: IconCurrency, gradient: "from-violet-500 to-violet-700" },
  { title: "Future-Proof", desc: "Future-proof for AI, ESG, tenant experience, and investor expectations.", Icon: IconShield, gradient: "from-sky-500 to-sky-700" },
] as const;

export default function DataDigitalCREReviewPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", company: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  }

  const inputCls = "mt-1.5 block w-full rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ow-blue focus:border-transparent";

  return (
    <div className="min-h-screen bg-white text-gray-700 font-sans">
      {/* ═══ TOP NAV ═══ */}
      <nav className="bg-[#0a1628] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">
          <a href="/" className="flex-shrink-0">
            <img src="/images/ow_logo.png" alt="OpticWise" className="h-8 w-auto" />
          </a>
          <span className="hidden md:block text-white/80 text-sm font-medium tracking-wide">
            PPP Data &amp; Digital Infrastructure Review
          </span>
          <a href="#schedule" className="btn btn-nav text-sm">Schedule Review</a>
        </div>
      </nav>

      {/* ═══ HERO + FORM (two-column) ═══ */}
      <section id="schedule" className="relative overflow-hidden">
        {/* Background image + blue overlay — matches original */}
        <div className="absolute inset-0 z-0">
          <img src="/images/project-catalyst.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(135deg, rgba(30,60,120,.88), rgba(43,108,176,.82) 50%, rgba(30,60,120,.90))" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1fr_480px] gap-12 lg:gap-16 items-start">
            {/* LEFT — text */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-amber-400 leading-tight tracking-tight">
                Schedule your CRE Data &amp; Digital Infrastructure Review and take back control.
              </h1>
              <p className="mt-5 text-lg text-amber-300/90 italic font-medium">
                If you don&rsquo;t own your digital infrastructure, then your vendors do.
              </p>
              <p className="mt-5 text-base text-white/80 leading-relaxed max-w-xl">
                Uncover hidden costs, broken tech stacks, and missed NOI opportunities. The PPP Data &amp; Digital Infrastructure Review gives you clarity, fast&mdash;so you can start monetizing your building&rsquo;s data and digital infrastructure like the asset it is.
              </p>
            </div>

            {/* RIGHT — form card */}
            <div className="rounded-2xl bg-[#0f172a]/90 backdrop-blur-md border border-white/10 shadow-2xl p-8 sm:p-9">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white text-center tracking-tight">
                Schedule Your PPP Data &amp; Digital Infrastructure Review
              </h2>
              <p className="mt-2 text-center text-white/60 text-sm">
                Take the first step toward maximizing your building&rsquo;s digital asset potential.
              </p>

              {submitted ? (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Thank you!</h3>
                  <p className="mt-2 text-white/60">We&rsquo;ll be in touch shortly to schedule your review.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">First Name <span className="text-amber-400">*</span></span>
                      <input name="firstName" required value={form.firstName} onChange={handleChange} className={inputCls} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Last Name <span className="text-amber-400">*</span></span>
                      <input name="lastName" required value={form.lastName} onChange={handleChange} className={inputCls} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Company</span>
                      <input name="company" value={form.company} onChange={handleChange} className={inputCls} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Email <span className="text-amber-400">*</span></span>
                      <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputCls} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Notes or Questions</span>
                    <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} className={`${inputCls} resize-none`} placeholder="Tell us about your current challenges or specific areas of interest..." />
                  </label>
                  <button type="submit" disabled={submitting} className="w-full btn btn-primary text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                        Submitting&hellip;
                      </span>
                    ) : "Schedule My PPP Data & Digital Infrastructure Review \u2192"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU'LL DISCOVER ═══ */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="text-center mb-14">
            <h2 className="section-heading">What You&rsquo;ll Discover</h2>
            <p className="section-subtitle mt-4">
              Share your challenges and learn all about the comprehensive digital infrastructure audit that reveals hidden value and untapped potential in your commercial real estate portfolio.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {DISCOVER_CARDS.map(({ title, desc, Icon, gradient }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-200 p-7 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-ow-blue/20">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══ */}
      <section className="py-20 bg-white">
        <div className="ow-container max-w-3xl">
          <div className="relative bg-gradient-to-br from-[#0a1628] to-[#0f2847] rounded-2xl p-10 sm:p-14 text-center">
            <svg className="w-10 h-10 text-amber-400/40 mx-auto mb-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.19 11 15c0 1.933-1.567 3.5-3.5 3.5-1.073 0-2.099-.49-2.917-1.179ZM15.583 17.321C14.553 16.227 14 15 14 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C20.591 11.69 22 13.19 22 15c0 1.933-1.567 3.5-3.5 3.5-1.073 0-2.099-.49-2.917-1.179Z" />
            </svg>
            <blockquote className="text-lg sm:text-xl text-white/90 italic leading-relaxed font-medium">
              &ldquo;This review opened our eyes. We&rsquo;ve always upgraded systems, but never saw how owning the infrastructure itself would change our NOI. Game-changing.&rdquo;
            </blockquote>
            <div className="mt-6">
              <p className="text-white font-bold">Joe Fielden Jr.</p>
              <p className="text-white/50 text-sm">Developer &amp; Operator</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST ═══ */}
      <section className="ow-section bg-gray-50">
        <div className="ow-container">
          <div className="text-center mb-14">
            <h2 className="section-heading">Trusted by Industry Leaders</h2>
            <p className="section-subtitle mt-4">Join commercial real estate owners who are already maximizing their digital assets.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {([
              { title: "18+ Years Experience", desc: "Helping CRE owners generate NOI from digital infrastructure", href: "https://www.opticwise.com/about", icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
              { title: "Trusted Partners", desc: "Digital Partners with global CRE companies", href: "https://www.opticwise.com/clients", icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg> },
              { title: "Peak Property Performance", desc: "Get the best-selling CRE digital strategy book", href: "https://www.peakpropertyperformance.com/", icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
            ] as const).map((card) => (
              <a key={card.title} href={card.href} target="_blank" rel="noopener noreferrer" className="group block bg-white rounded-2xl border border-gray-200 p-8 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-ow-blue/20 no-underline">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-ow-blue to-ow-blue-dark text-white flex items-center justify-center mx-auto mb-5">{card.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-ow-blue transition-colors">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#0a1628] py-10">
        <div className="ow-container text-center">
          <img src="/images/ow_logo.png" alt="OpticWise" className="h-8 w-auto mx-auto opacity-60" />
          <p className="mt-4 text-white/40 text-xs">&copy; {new Date().getFullYear()} OpticWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
