"use client";

import { useState } from "react";
import { FAQAccordion } from "@/components/FAQAccordion";

interface RoleFAQ {
  role: string;
  icon: string;
  sections: {
    title: string;
    items: { question: string; answer: string }[];
  }[];
  cta: string;
}

const roles: RoleFAQ[] = [
  {
    role: "Developer",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    sections: [
      {
        title: "Layer 1: Managed data & digital infrastructure",
        items: [
          {
            question: "What do you mean by managed data & digital infrastructure?",
            answer: "It means OpticWise provides managed services that include design, implementation, and operation across facilities and portfolios\u2014keeping performance high and operational risk low without burdening on-site teams.",
          },
          {
            question: "Who installs what\u2014OpticWise or our low-voltage contractor?",
            answer: "Your low-voltage contractor installs wiring/equipment to OpticWise specifications. OpticWise configures the in-building network and brings it live in coordination with your go-live schedule.",
          },
          {
            question: "How long does implementation take?",
            answer: "Retrofits can be implemented in less than one quarter; new construction stays synchronized with GC schedules.",
          },
        ],
      },
      {
        title: "Layer 2: Owner-controlled intelligence layer",
        items: [
          {
            question: "Are we designing a building\u2026 or designing vendor lock-in?",
            answer: "If low-voltage and OT decisions create silos, every new tool becomes another silo and each property needs custom integration. The fix is to standardize the foundation you own so you can scale intelligence portfolio-wide.",
          },
          {
            question: "What is the OpticWise Brain?",
            answer: "A vendor- and LLM-agnostic Property Intelligence Layer: a governed data plane + trust plane that makes each property capable of autonomous activities and intelligence.",
          },
        ],
      },
      {
        title: "Advisory",
        items: [
          {
            question: "We have internal IT/OT resources\u2014can you support a self-perform model?",
            answer: "Yes. Start with Clarify (PPP Review/Audit) to define success metrics, map ownership, identify leakage, and document what\u2019s trustworthy and portable\u2014then we help you standardize governance and portability so you don\u2019t recreate silos.",
          },
        ],
      },
    ],
    cta: "Pilot one property to establish the OW Brain, then prove portability by plugging in a decision engine.",
  },
  {
    role: "Owner",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    sections: [
      {
        title: "Layer 1: Managed data & digital infrastructure",
        items: [
          {
            question: "How much does it cost?",
            answer: "It\u2019s designed to be net positive: services cost a fraction of the revenues they drive, providing NOI and yield for the owner/operator.",
          },
          {
            question: "Who supports tenants/residents?",
            answer: "OpticWise supports end-user tenant support related to internet and connectivity via phone, email, or text\u2014so your team isn\u2019t the help desk.",
          },
          {
            question: "How do you handle redundancy and reliability?",
            answer: "Redundancy is addressed in design based on owner strategy and constraints; circuits and power are made redundant to keep users connected and reduce interruptions.",
          },
        ],
      },
      {
        title: "Layer 2: Owner-controlled intelligence layer",
        items: [
          {
            question: "If you don\u2019t own your data & digital infrastructure, who does?",
            answer: "Your vendors do\u2014and your building\u2019s \u201Cintelligence\u201D becomes someone else\u2019s asset. Across a portfolio, that becomes structural disadvantage.",
          },
          {
            question: "What does vendor- and LLM-agnostic\u2014forever mean?",
            answer: "It means you can run any decision engines you want (vendor platform, internal analytics, any LLM) under owner permissions\u2014and you can change those engines over time because the foundation stays yours.",
          },
          {
            question: "What\u2019s the business outcome of doing this right?",
            answer: "One standard intelligence substrate, many decision engines, scaled across many buildings\u2014so portfolio performance compounds because intelligence is built on owned data & digital infrastructure.",
          },
        ],
      },
      {
        title: "Advisory",
        items: [
          {
            question: "What do we actually get out of a PPP Review/Audit?",
            answer: "A clear map of what you own, where value is leaking, who\u2019s accountable, and what data is trustworthy and portable\u2014so you can standardize once and scale.",
          },
        ],
      },
    ],
    cta: "Start with Clarify, then build Layer 1 and Layer 2 so you own your data & digital infrastructure and stay platform-flexible.",
  },
  {
    role: "Operator",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    sections: [
      {
        title: "Layer 1: Managed data & digital infrastructure",
        items: [
          {
            question: "Will this add work for my onsite team?",
            answer: "No. OpticWise manages ongoing data & digital infrastructure work without taxing on-site engineers or property managers because these skill sets are different than traditional building operations and property management.",
          },
          {
            question: "What do you operate day-to-day after install?",
            answer: "Monitoring, maintenance, support coordination, and ongoing operational upkeep to keep performance high and operational risk low (without burdening on-site teams).",
          },
        ],
      },
      {
        title: "Layer 2: Owner-controlled intelligence layer",
        items: [
          {
            question: "Are we buying technology\u2026 or buying clarity?",
            answer: "If every \u201Csolution\u201D adds complexity and lock-in, you\u2019re not building a capability. OpticWise starts by clarifying what data matters, where it lives, and how to make it trustworthy and portable\u2014then gives you control via a governed intelligence layer.",
          },
          {
            question: "What is PPP 5C\u2122 (plain language)?",
            answer: "Clarify (PPP Review/Audit), Connect, Collect, Coordinate, Control\u2014moving you from fragmented systems to an owner-controlled intelligence substrate that scales portfolio-wide.",
          },
        ],
      },
      {
        title: "Advisory",
        items: [
          {
            question: "We don\u2019t have a data team. Will we still get value?",
            answer: "Yes\u2014the model is built so operations can run on governed, reusable data under clear permissions, without requiring internal analytics headcount to keep the foundation working.",
          },
        ],
      },
    ],
    cta: "Pilot one property, prove portability by plugging in a decision engine, then productize the standard and scale.",
  },
  {
    role: "Property Manager",
    icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
    sections: [
      {
        title: "Layer 1: Managed data & digital infrastructure",
        items: [
          {
            question: "Will the entire property be covered and strong?",
            answer: "Yes\u2014OpticWise performs comprehensive RF design to deliver robust coverage for all owner-specified areas.",
          },
          {
            question: "Can tenants/residents make calls deep inside the building?",
            answer: "Yes\u2014your data & digital infrastructure can support WiFi calling, mitigating poor in-building cellular performance.",
          },
          {
            question: "How many users/devices can it handle?",
            answer: "As many as the property can host\u2014including guests, operational systems/personnel, and future growth capacity.",
          },
        ],
      },
      {
        title: "Layer 2: Owner-controlled intelligence layer",
        items: [
          {
            question: "Are we measuring performance\u2014or the absence of complaints?",
            answer: "Silence isn\u2019t performance. Define what working means, create visibility, and avoid luck-based operations by starting with Clarify and governance.",
          },
          {
            question: "What is 5S\u00AE?",
            answer: "5S\u00AE is the non-negotiable user experience (UX): Seamless Mobility, Security, Stability (resilience), Speed, Service.",
          },
        ],
      },
      {
        title: "Advisory",
        items: [
          {
            question: "Why does our team field tech support calls for services we don\u2019t bill?",
            answer: "It\u2019s common but inefficient. OpticWise supports tenants directly and manages the system so your staff isn\u2019t carrying support burden without revenue.",
          },
        ],
      },
    ],
    cta: "Let OpticWise run the managed work and tenant support so your team stays focused on property operations\u2014not being the ISP help desk.",
  },
  {
    role: "Asset Manager",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    sections: [
      {
        title: "Layer 1: Managed data & digital infrastructure",
        items: [
          {
            question: "How does this reduce operational risk?",
            answer: "By operating the foundation continuously\u2014keeping performance high and operational risk low without burdening on-site teams.",
          },
          {
            question: "What\u2019s the lifecycle / refresh planning?",
            answer: "Years 1\u20135 covered by factory support warranties; around year 5, refresh support/software contracts (~30% of original equipment cost); around year 10, consider full refresh of core equipment and APs.",
          },
        ],
      },
      {
        title: "Layer 2: Owner-controlled intelligence layer",
        items: [
          {
            question: "Are we getting dashboards\u2014or a durable capability?",
            answer: "Without owner-controlled data & digital infrastructure and an owner-controlled intelligence layer, you get lock-in and dashboards\u2014but no durable capability\u2014and every new tool becomes another silo.",
          },
          {
            question: "How does this reduce diligence risk?",
            answer: "SB7\u2019s outcome is a shared, governed data foundation that is clean, reusable, and auditable\u2014and risk drops across privacy, security, compliance, and auditability.",
          },
        ],
      },
      {
        title: "Advisory",
        items: [
          {
            question: "What\u2019s the recommended rollout for portfolio compounding?",
            answer: "Pilot one property to establish the OW Brain \u2192 prove portability by plugging in a decision engine \u2192 productize the standard \u2192 scale to unlock benchmarking, pattern detection, and centralized decisioning.",
          },
        ],
      },
    ],
    cta: "Don\u2019t play for next quarter\u2014build the standard once so outcomes compound across the portfolio.",
  },
  {
    role: "ERTC",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    sections: [
      {
        title: "Layer 1: Managed data & digital infrastructure",
        items: [
          {
            question: "What\u2019s the core plan we\u2019re approving?",
            answer: "A two-layer model delivered via PPP 5C\u2122\u2014starting with Clarify (PPP Review/Audit) and then building/operating the managed foundation.",
          },
        ],
      },
      {
        title: "Layer 2: Owner-controlled intelligence layer",
        items: [
          {
            question: "If regulators asked how building decisions were made, could we explain it clearly?",
            answer: "Without governance, AI becomes automation without governance. The OpticWise Brain provides governed data plane + trust plane so decisions are traceable and controlled under owner permissions.",
          },
          {
            question: "What do data plane and trust plane mean in plain language?",
            answer: "They\u2019re the governed foundation that makes building data usable and controlled: the data plane organizes/carries usable data; the trust plane governs identity, access, privacy, lineage, retention, and rules of use.",
          },
        ],
      },
      {
        title: "Advisory",
        items: [
          {
            question: "What does prove portability actually look like?",
            answer: "You establish the OW Brain and governance, then plug in at least one decision engine (vendor or internal) to prove you can swap platforms without rewiring buildings.",
          },
        ],
      },
    ],
    cta: "Stop buying point solutions that trap your data inside a single building. Start building an intelligence layer that scales.",
  },
];

export function FAQTabs() {
  const [activeRole, setActiveRole] = useState(0);
  const current = roles[activeRole];

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {roles.map((role, idx) => (
          <button
            key={role.role}
            onClick={() => setActiveRole(idx)}
            className={`
              inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200
              ${
                activeRole === idx
                  ? "bg-ow-blue text-white shadow-glow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={role.icon}
              />
            </svg>
            {role.role}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-8">
        {current.sections.map((section, sIdx) => (
          <div key={sIdx}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ow-blue mb-4">
              {section.title}
            </h3>
            <FAQAccordion items={section.items} />
          </div>
        ))}

        {/* Role CTA */}
        <div className="ow-callout mt-6" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
          <p className="text-gray-700 font-medium text-sm m-0">
            <strong>CTA ({current.role}):</strong> {current.cta}
          </p>
        </div>
      </div>
    </div>
  );
}
