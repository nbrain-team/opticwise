"use client";

import { useState, FormEvent } from "react";

const STATS = [
  { value: "67%", label: "of CRE data is trapped in vendor silos" },
  { value: "$150K+", label: "average annual NOI loss per property" },
  { value: "3-5x", label: "higher costs for vendor-controlled systems" },
];

const LEARN_ITEMS = [
  {
    title: "Identify and fix value leakage from legacy vendor agreements",
    desc: "Discover hidden costs in your current vendor contracts",
  },
  {
    title: "Why owning your infrastructure is critical to AI-readiness and CapEx protection",
    desc: "Future-proof your investments with ownership strategies",
  },
  {
    title: "Where data silos are killing operational insight—and how to unify them",
    desc: "Break down barriers between your systems and vendors",
  },
  {
    title: "The simple step CRE leaders are taking to drive NOI using existing assets",
    desc: "Maximize returns from infrastructure you already have",
  },
  {
    title: "How one 200-unit property unlocked $150K/year in new NOI using these principles",
    desc: "Real case study with actionable implementation details",
  },
];

const TRUST_STATS = [
  { value: "20M SF+", label: "CRE Spaces Optimized" },
  { value: "$30M+", label: "NOI Unlocked" },
  { value: "99%", label: "Client Satisfaction" },
];

export default function StopFlyingBlindPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-ow-navy">
        {/* Gradient overlays & glow accents */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-ow-navy via-ow-navy-light to-ow-navy" />
          <div className="absolute left-1/4 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[320px] w-[320px] translate-x-1/2 translate-y-1/4 rounded-full bg-teal-400/8 blur-[100px]" />
          <div className="absolute right-1/3 top-1/4 h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
          <div className="absolute left-[15%] top-[60%] h-1 w-1 rounded-full bg-teal-300/50" />
          <div className="absolute right-[20%] top-[70%] h-2 w-2 rounded-full bg-emerald-300/40" />
          <div className="absolute left-[40%] top-[20%] h-1 w-1 rounded-full bg-teal-400/50" />
          <div className="absolute left-[60%] top-[80%] h-1.5 w-1.5 rounded-full bg-emerald-400/30" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-28 text-center sm:pb-28 sm:pt-36">
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            The Data You Don&rsquo;t Own{" "}
            <br className="hidden sm:block" />
            is <span className="text-amber-400">Costing You</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
            Discover the 7 hidden ways fragmented digital infrastructure and
            vendor-controlled data erode your NOI—and how to take back control.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#guide"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 hover:shadow-emerald-500/25"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Stop Flying Blind
            </a>
            <a
              href="#guide"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Stop Losing NOI
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            You Can&rsquo;t Optimize What You Don&rsquo;t Own
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Most CRE owners are flying blind when it comes to digital
            infrastructure and data. Every day of vendor lock-in is money left
            on the table.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div
                key={s.value}
                className="rounded-2xl bg-white px-6 py-10 shadow-md ring-1 ring-gray-100"
              >
                <p className="text-5xl font-extrabold text-rose-500">{s.value}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guide + Form ── */}
      <section id="guide" className="scroll-mt-16 bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_400px] lg:gap-16">
          {/* Left — content */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Free Guide:{" "}
              <span className="text-emerald-600">
                &ldquo;7&nbsp;Ways to Stop Flying Blind&rdquo;
              </span>
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              How to Take Back Control of Your CRE Data
            </p>

            <h3 className="mt-10 text-xl font-semibold text-gray-900">
              What You&rsquo;ll Learn:
            </h3>

            <ol className="mt-6 space-y-6">
              {LEARN_ITEMS.map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <h4 className="font-semibold text-emerald-800">Real Results</h4>
              <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                <span className="font-semibold">Case Study Included:</span>{" "}
                Learn exactly how a 200-unit property generated an additional
                $150K annually by implementing these data ownership principles.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="self-start">
            <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100">
              <h3 className="text-2xl font-bold text-gray-900">
                Get Your Free Guide
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Join 20M&nbsp;SF+ CRE leaders taking back control
              </p>

              {submitted ? (
                <div className="mt-8 rounded-xl bg-emerald-50 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-emerald-800">
                    Thank you! Check your inbox.
                  </p>
                  <p className="mt-1 text-sm text-emerald-600">
                    Your free guide is on its way.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="lp-name"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="lp-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lp-email"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Business Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="lp-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@company.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 hover:shadow-lg"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Yes, I want the guide
                  </button>

                  <p className="flex items-start gap-1.5 text-xs text-gray-400">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    We respect your privacy. Your info is safe and never shared.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-lg font-semibold tracking-wide text-gray-500">
            Trusted by Forward-Thinking CRE Leaders
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {TRUST_STATS.map((s) => (
              <div key={s.value}>
                <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
