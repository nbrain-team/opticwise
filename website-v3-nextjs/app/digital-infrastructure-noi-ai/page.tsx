import type { Metadata } from "next";
import Link from "next/link";
import { SubpageHero } from "@/components/SubpageHero";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Digital Infrastructure, NOI, and AI in Commercial Real Estate",
  description:
    "Commercial real estate is entering a structural transition. Not a technology cycle. A control cycle. Digital infrastructure and data now sit upstream of NOI, AI readiness, tenant experience, and market visibility.",
};

const PILLARS = [
  {
    number: "01",
    title: "Digital Infrastructure NOI Strategy",
    description: "The intentional design, ownership, and control of a property\u2019s networks, systems, and data to directly increase net operating income.",
    href: "/digital-infrastructure-noi-strategy/",
  },
  {
    number: "02",
    title: "AI-Ready Commercial Real Estate",
    description: "Properties designed and operated with owner-controlled digital infrastructure and high-fidelity data for predictive operations.",
    href: "/ai-ready-commercial-real-estate/",
  },
  {
    number: "03",
    title: "Own vs Lease CRE Building Data",
    description: "Understanding the difference between owning your operational data versus leasing it from vendor platforms.",
    href: "/own-vs-lease-cre-building-data/",
  },
  {
    number: "04",
    title: "Digital Infrastructure NOI Playbook",
    description: "A repeatable, owner-led framework that turns infrastructure into predictable NOI instead of unmanaged operating costs.",
    href: "/digital-infrastructure-noi-playbook/",
  },
  {
    number: "05",
    title: "Control of CRE Digital Visibility",
    description: "The ability to govern how your building is represented across search engines, AI systems, and digital platforms.",
    href: "/control-cre-digital-visibility/",
  },
];

export default function Page() {
  return (
    <>
      <SubpageHero
        title="Digital Infrastructure, NOI, and AI in Commercial Real Estate"
        lead="Commercial real estate is entering a structural transition. Not a technology cycle. A control cycle."
        badge="Category Hub"
      />

      {/* The Control Shift */}
      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="content-block">
            <span className="section-label">The Control Shift</span>
            <h2 className="section-title">Why These Topics Are Linked</h2>
            <p className="content-text">Historically:</p>
            <ul className="content-list">
              <li><strong>NOI</strong> lived in finance</li>
              <li><strong>Infrastructure</strong> lived in IT</li>
              <li><strong>AI</strong> lived in innovation teams</li>
              <li><strong>Visibility</strong> lived in marketing</li>
            </ul>
            <p className="content-text">That separation no longer holds.</p>
            <p className="content-text"><strong>Today, digital infrastructure ownership connects them all.</strong></p>
            <p className="content-text"><strong>Digital infrastructure and data</strong> now sit upstream of NOI, AI readiness, tenant experience, and market visibility. What owners control determines what they can optimize.</p>
          </div>
        </div>
      </section>

      {/* Canonical Clarification */}
      <section className="py-10 bg-gray-50">
        <div className="ow-container">
          <div className="max-w-3xl mx-auto flex gap-5 items-start bg-white rounded-xl border-2 border-gray-200 p-6 lg:p-8">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-ow-blue/10 flex items-center justify-center text-ow-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ow-blue mb-2">Canonical Clarification</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">5S&reg; is an OpticWise wireless connectivity product. It defines the tenant-facing wireless experience and service layer of owner-controlled digital infrastructure and may be delivered over Wi-Fi, in-building cellular, DAS, and other present or future wireless protocols.</p>
              <p className="text-sm font-semibold text-gray-900 m-0">5S&reg; is not a strategy or framework.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Five Pillars */}
      <section className="content-section bg-white">
        <div className="ow-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">The Five Pillars</h2>
            <p className="text-lg lg:text-xl text-gray-700 leading-relaxed">
              This site is organized around five core pillars that define owner-controlled digital infrastructure:
            </p>
          </div>

          <div className="pillars-grid">
            {PILLARS.map((pillar) => (
              <Link key={pillar.number} href={pillar.href} className="pillar-card">
                <div className="pillar-number">{pillar.number}</div>
                <h3 className="pillar-title">{pillar.title}</h3>
                <p className="pillar-description">{pillar.description}</p>
                <span className="pillar-link">Learn More &rarr;</span>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <div className="pillars-conclusion-card">
              <p><strong>Together, they form a complete system for long-term asset control.</strong></p>
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
