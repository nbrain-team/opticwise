"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface LayerGroup {
  label: string;
  items: FAQItem[];
}

interface RolePanel {
  role: string;
  label: string;
  layers: LayerGroup[];
}

const ROLE_PANELS: RolePanel[] = [
  {
    role: "developer",
    label: "Developer",
    layers: [
      {
        label: "Layer 1: Managed Data & Digital Infrastructure",
        items: [
          {
            question: "We\u2019re designing a new building\u2014how do we avoid designing vendor lock-in?",
            answer: "Start with owner-controlled data & digital infrastructure standards before low-voltage decisions are locked. Segment networks, document governance, and ensure all admin credentials and data export rights stay with the owner\u2014not the installing vendor. BoT\u00AE (Building of Things\u00AE) consolidates networks onto the fewest physical paths, reducing build cost and preventing the silo problem before it starts.",
          },
          {
            question: "What should our low-voltage and network spec include to protect future flexibility?",
            answer: "Repeatable standards for segmentation, access rules, and documentation. Every system should be designed for data export, governed identity, and platform portability. This is the foundation that makes future technology swaps possible without rewiring the building.",
          },
          {
            question: "How does BoT\u00AE reduce build costs?",
            answer: "By consolidating all your property\u2019s networks onto the fewest possible physical networks. Instead of each vendor building their own path, BoT\u00AE creates a shared, governed infrastructure. This often saves hundreds of thousands in build costs and thousands per month in operating costs.",
          },
        ],
      },
      {
        label: "Layer 2: Intelligence Layer (OpticWise Brain)",
        items: [
          {
            question: "What is the OpticWise Brain and why should I care during design?",
            answer: "The OpticWise Brain is a vendor- and LLM-agnostic Property Intelligence Layer: a governed data plane + trust plane. During design, the decisions you make about data access, network segmentation, and system governance determine whether you can ever run meaningful intelligence across the building. Get Layer 1 right, and Layer 2 becomes possible. Get it wrong, and you\u2019re locked into vendor dashboards.",
          },
          {
            question: "Can we plug in our own analytics or AI tools later?",
            answer: "Yes\u2014that\u2019s the entire point. The intelligence layer is vendor- and LLM-agnostic, forever. One standard intelligence substrate, many decision engines. You choose what to plug in, and you can swap them over time without rewiring the building.",
          },
        ],
      },
      {
        label: "Advisory",
        items: [
          {
            question: "When in the development process should we engage OpticWise?",
            answer: "Before low-voltage decisions are locked. The earlier you engage, the more you can standardize\u2014reducing cost, preventing silos, and creating a foundation that scales across your portfolio. Start with a PPP Audit\u2122 to clarify what you own and where control gets lost.",
          },
        ],
      },
    ],
  },
  {
    role: "owner",
    label: "Owner",
    layers: [
      {
        label: "Layer 1: Managed Data & Digital Infrastructure",
        items: [
          {
            question: "How do I know if my vendors own my data & digital infrastructure?",
            answer: "Ask three questions: Who holds admin credentials? Can you export clean data in a standard format? Can you swap the platform without rewiring the building? If the answer to any of these is \u201Cno\u201D or \u201CI don\u2019t know,\u201D your vendor likely has more control than you do.",
          },
          {
            question: "What does \u201Cmanaged data & digital infrastructure\u201D actually include?",
            answer: "Design, implementation, and ongoing operations of your building\u2019s networks, wireless, and connected systems\u2014all under owner-controlled standards. This includes network segmentation, access governance, documentation, performance monitoring, and coordination with vendors so your on-site team isn\u2019t the digital help desk.",
          },
          {
            question: "Will this replace our existing systems?",
            answer: "Not necessarily. The goal is to create an owner-controlled foundation underneath your existing systems. You keep what works, consolidate what doesn\u2019t, and gain the governance and portability that vendor-controlled setups deny you.",
          },
        ],
      },
      {
        label: "Layer 2: Intelligence Layer (OpticWise Brain)",
        items: [
          {
            question: "What is \u201CProperty Intelligence \u2192 Portfolio Intelligence\u201D?",
            answer: "When one building has an owner-controlled intelligence layer, that\u2019s Property Intelligence. When the same standard scales across multiple properties with consistent data, governance, and decision engines, the intelligence compounds. That\u2019s Portfolio Intelligence\u2014and it\u2019s only possible when you own the foundation.",
          },
          {
            question: "What does \u201Cvendor- and LLM-agnostic\u2014forever\u201D mean?",
            answer: "It means the intelligence layer is designed so you\u2019re never locked into a single vendor, AI provider, or model. The data plane carries your data; the trust plane governs access and rules. You plug in whatever decision engines make sense today and swap them tomorrow\u2014without losing your data or starting over.",
          },
          {
            question: "How does this affect asset value and diligence readiness?",
            answer: "Owner-controlled data & digital infrastructure strengthens the diligence story: documented governance, repeatable standards, clean data, and provable operational performance. This reduces risk narratives and increases buyer/investor confidence in the asset\u2019s long-term economics.",
          },
        ],
      },
      {
        label: "Advisory",
        items: [
          {
            question: "What\u2019s the first step to regain control?",
            answer: "Start with Clarify: the PPP Audit\u2122. Map what you own, where value leaks, who\u2019s accountable, and what data is trustworthy and portable. One building, one audit, one clear path forward.",
          },
        ],
      },
    ],
  },
  {
    role: "operator",
    label: "Operator",
    layers: [
      {
        label: "Layer 1: Managed Data & Digital Infrastructure",
        items: [
          {
            question: "How does this reduce our on-site team\u2019s burden?",
            answer: "OpticWise operates the digital infrastructure so your property managers and engineers are not the digital help desk. Monitoring, maintenance coordination, vendor alignment, and support orchestration are handled under owner-controlled standards\u2014performance stays high, escalations go down.",
          },
          {
            question: "What does \u201Cno shadow networks\u201D mean in practice?",
            answer: "It means every device, connection, and vendor on the network is documented, governed, and segmented. No unauthorized networks running behind walls. No vendors adding access points without governance. When the network is clean and visible, operations are predictable.",
          },
        ],
      },
      {
        label: "Layer 2: Intelligence Layer (OpticWise Brain)",
        items: [
          {
            question: "How does the intelligence layer help day-to-day operations?",
            answer: "By turning fragmented data into coordinated insight. Instead of checking five vendor dashboards, the intelligence layer aggregates, governs, and surfaces what matters\u2014fewer surprises, faster decisions, lower risk.",
          },
          {
            question: "Do we need to change our existing workflows?",
            answer: "The goal is to simplify and standardize, not add complexity. Existing workflows are evaluated during the PPP Audit\u2122 and improved through coordination\u2014fewer manual escalations, standard processes, consistent vendor alignment.",
          },
        ],
      },
      {
        label: "Advisory",
        items: [
          {
            question: "How quickly can we see operational improvement?",
            answer: "Retrofits typically complete in under one quarter. Operational improvements\u2014fewer escalations, better visibility, reduced vendor friction\u2014begin immediately after implementation. The compounding effects across portfolio grow from there.",
          },
        ],
      },
    ],
  },
  {
    role: "property-manager",
    label: "Property Manager",
    layers: [
      {
        label: "Layer 1: Managed Data & Digital Infrastructure",
        items: [
          {
            question: "Does this mean I become responsible for IT?",
            answer: "No. The opposite. OpticWise operates the digital infrastructure so you don\u2019t have to. Your team stays focused on property management while OpticWise handles monitoring, maintenance coordination, and support orchestration. You\u2019re the beneficiary of better infrastructure\u2014not the operator of it.",
          },
          {
            question: "What happens when tenants have connectivity issues?",
            answer: "Under the 5S\u00AE model, connectivity support is orchestrated by OpticWise\u2014not your staff. Issues are triaged, resolved, and documented without turning property managers into the digital help desk. Tenant experience outcomes improve because response is consistent and accountable.",
          },
          {
            question: "How does this improve tenant retention?",
            answer: "Consistent, measurable connectivity performance. No dead zones. Reliable Wi-Fi calling. Support that doesn\u2019t bounce between vendors. When the tenant experience is repeatable and provable, retention and satisfaction follow.",
          },
        ],
      },
      {
        label: "Layer 2: Intelligence Layer (OpticWise Brain)",
        items: [
          {
            question: "Will I have visibility into building performance?",
            answer: "Yes\u2014and it will be owner-controlled visibility, not a vendor dashboard you can\u2019t export from. The intelligence layer gives you clean, governed data about connectivity, systems, and operational performance that you control and can report on.",
          },
          {
            question: "What do \u201Cdata plane\u201D and \u201Ctrust plane\u201D mean for property managers?",
            answer: "The data plane organizes and carries usable data from your building systems. The trust plane governs who can access what, what privacy rules apply, and how data flows. Together, they ensure the information you rely on is trustworthy, portable, and governed\u2014not locked inside a vendor platform.",
          },
        ],
      },
      {
        label: "Advisory",
        items: [
          {
            question: "What does the transition look like for our team?",
            answer: "OpticWise manages the transition. Your low-voltage contractor installs to OpticWise specifications. OpticWise configures and operates. Your team sees fewer escalations, better performance, and a clear accountability structure\u2014without taking on new technical responsibilities.",
          },
        ],
      },
    ],
  },
  {
    role: "asset-manager",
    label: "Asset Manager",
    layers: [
      {
        label: "Layer 1: Managed Data & Digital Infrastructure",
        items: [
          {
            question: "How does owner-controlled infrastructure affect NOI?",
            answer: "By enabling owner-controlled connectivity economics (not revenue-share), reducing operating costs through coordination and standardization, lowering operational risk through governance, and making NOI performance repeatable across the portfolio.",
          },
          {
            question: "What metrics should I track to prove value?",
            answer: "The PPP Audit\u2122 aligns to your KPIs: NOI/yield, OpEx/O&M, tenant experience outcomes, utilities, insurance/risk narrative, lease-up velocity, and investor story/diligence readiness. These aren\u2019t tech metrics\u2014they\u2019re business metrics that infrastructure makes measurable.",
          },
        ],
      },
      {
        label: "Layer 2: Intelligence Layer (OpticWise Brain)",
        items: [
          {
            question: "How does the intelligence layer help portfolio-level decisions?",
            answer: "Property Intelligence becomes Portfolio Intelligence when the same owner-controlled foundation scales across assets. Consistent data, consistent governance, consistent standards\u2014which means you can compare, benchmark, and optimize across the portfolio, not just building by building.",
          },
          {
            question: "Can this strengthen our diligence narrative?",
            answer: "Yes. Documented governance, repeatable standards, clean exportable data, and provable operational performance reduce risk narratives. Investors and buyers gain confidence in the asset\u2019s long-term economics when the infrastructure foundation is owner-controlled and documented.",
          },
        ],
      },
      {
        label: "Advisory",
        items: [
          {
            question: "How do we evaluate ROI on this approach?",
            answer: "Start with the PPP Audit\u2122 to quantify where value is leaking today: revenue-share agreements, redundant infrastructure, manual operations, vendor friction, data you can\u2019t export. The ROI becomes clear when you compare the cost of continued leakage against the investment in owner-controlled standards.",
          },
        ],
      },
    ],
  },
  {
    role: "ertc",
    label: "ERTC",
    layers: [
      {
        label: "Layer 1: Managed Data & Digital Infrastructure",
        items: [
          {
            question: "How does OpticWise work with our existing engineering and technology teams?",
            answer: "OpticWise operates the digital infrastructure alongside your team\u2014not instead of them. Your low-voltage contractor installs to OpticWise specifications. OpticWise handles configuration, monitoring, and support orchestration. Your engineering team keeps their focus while gaining a governed, documented infrastructure they can rely on.",
          },
        ],
      },
      {
        label: "Layer 2: Intelligence Layer (OpticWise Brain)",
        items: [
          {
            question: "Is this just another vendor dashboard?",
            answer: "No. Vendor dashboards trap your data inside their platform. The OpticWise Brain is an owner-controlled intelligence layer with full data export, governed access, and platform portability. You own the data, you choose the tools, and you can swap any component without starting over.",
          },
          {
            question: "What integration standards does the platform support?",
            answer: "The intelligence layer is designed for standard APIs, governed data access, and documented integration pathways. It doesn\u2019t require custom integrations every time\u2014the foundation is built for repeatability and portability.",
          },
        ],
      },
      {
        label: "Advisory",
        items: [
          {
            question: "How does this fit into our existing technology roadmap?",
            answer: "OpticWise creates the owner-controlled foundation that makes your roadmap executable. Instead of adding another point solution, you\u2019re building the substrate that all future tools connect to. Standardize once, scale everywhere, swap anything.",
          },
        ],
      },
    ],
  },
];

const GENERAL_FAQ: { title: string; items: FAQItem[] }[] = [
  {
    title: "The \u201CWhat\u201D and the \u201CWhy\u201D",
    items: [
      {
        question: "What problem does OpticWise solve?",
        answer: "Most CRE owners lost control of their data & digital infrastructure one contract, one \u201Csmart\u201D system, one dashboard at a time. OpticWise helps owners reclaim control through managed data & digital infrastructure services (Layer 1) and an owner-controlled intelligence layer (Layer 2)\u2014so NOI becomes predictable, operations stabilize, and AI readiness is grounded in governance, not hype.",
      },
      {
        question: "What is \u201CProperty Intelligence \u2192 Portfolio Intelligence\u201D?",
        answer: "When one building has owner-controlled infrastructure and intelligence, that\u2019s Property Intelligence. When the same standard scales across buildings with consistent data, governance, and decision engines, the intelligence compounds. That\u2019s Portfolio Intelligence\u2014and it\u2019s only possible when you own the foundation.",
      },
    ],
  },
  {
    title: "Delivery & Support",
    items: [
      {
        question: "Who supports the equipment after installation?",
        answer: "OpticWise provides ongoing operations: monitoring, performance management, maintenance coordination, support orchestration, and governance enforcement. Your on-site team is not the digital help desk.",
      },
      {
        question: "Are we locked into a single ISP?",
        answer: "No. With ElasticISP\u00AE, the infrastructure is ISP-agnostic. You choose providers based on performance and economics, and you can change without rebuilding. Flexibility is the default, not a premium feature.",
      },
      {
        question: "Can the system handle dual-carrier redundancy?",
        answer: "Yes. The infrastructure is designed for resilience, including multi-carrier support. Stability is one of the five pillars of 5S\u00AE\u2014engineered reliability, not hopeful uptime.",
      },
    ],
  },
  {
    title: "Economics, Liability, Billing",
    items: [
      {
        question: "Who bills the tenants for connectivity?",
        answer: "That depends on the owner\u2019s preferred model. OpticWise supports owner-controlled connectivity economics, meaning you decide whether connectivity is bundled into rent, billed separately, or treated as an amenity. The point is that the owner controls the revenue structure\u2014not a revenue-share partner.",
      },
      {
        question: "Who has liability for connectivity performance?",
        answer: "OpticWise operates the infrastructure to measurable standards. Accountability is documented and governed\u2014not distributed across multiple vendors with no clear owner. The PPP Audit\u2122 clarifies who is accountable for integration outcomes, not just installs.",
      },
    ],
  },
  {
    title: "Definitions",
    items: [
      {
        question: "What is ElasticISP\u00AE?",
        answer: "ElasticISP\u00AE is OpticWise\u2019s ISP-agnostic connectivity model. It means the building\u2019s infrastructure is designed to work with any internet service provider, so owners can choose, change, or add providers based on performance and economics without rewiring.",
      },
      {
        question: "What is Building of Things\u00AE (BoT\u00AE)?",
        answer: "BoT\u00AE is OpticWise\u2019s strategic approach to consolidate all a property\u2019s networks onto the fewest possible physical networks\u2014reducing build cost and operating cost while increasing control. It\u2019s about designing infrastructure, not designing vendor lock-in.",
      },
      {
        question: "What is Peak Property Performance\u00AE (PPP\u2122)?",
        answer: "PPP\u2122 is OpticWise\u2019s owner-first operating model for turning data & digital infrastructure into measurable outcomes: NOI growth, tenant experience outcomes, operational control, and future-proofing / AI readiness. The PPP 5C\u2122 path is Clarify, Connect, Collect, Coordinate, Control. It\u2019s also a best-selling book published by Fast Company Press.",
      },
    ],
  },
];

const ChevronIcon = () => (
  <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 9l-7 7-7-7" />
  </svg>
);

export function FAQPageContent() {
  const [activeRole, setActiveRole] = useState("developer");

  return (
    <>
      {/* Role-Based FAQ Section */}
      <section className="section section-white">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">By Role</span>
            <h2 className="section-heading">Find Answers for Your Role</h2>
            <div className="accent-bar accent-bar-center" />
          </div>

          <div className="role-tabs">
            {ROLE_PANELS.map((panel) => (
              <button
                key={panel.role}
                className={`role-tab${activeRole === panel.role ? " active" : ""}`}
                onClick={() => setActiveRole(panel.role)}
              >
                {panel.label}
              </button>
            ))}
          </div>

          {ROLE_PANELS.map((panel) => (
            <div
              key={panel.role}
              className={`role-panel${activeRole === panel.role ? " active" : ""}`}
            >
              {panel.layers.map((layer, li) => (
                <div key={li} className="faq-group">
                  <span className="faq-group-label">{layer.label}</span>
                  <div className="faq-list">
                    {layer.items.map((item, ii) => (
                      <details key={ii} className="faq-item">
                        <summary>
                          <span className="faq-q">{item.question}</span>
                          <ChevronIcon />
                        </summary>
                        <div className="faq-a">{item.answer}</div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* General FAQ Hub */}
      <section className="section section-light">
        <div className="ow-container">
          <div className="section-header">
            <span className="section-eyebrow">General</span>
            <h2 className="section-heading">General FAQ Hub</h2>
            <div className="accent-bar accent-bar-center" />
          </div>

          <div className="faq-list general-hub">
            {GENERAL_FAQ.map((group, gi) => (
              <div key={gi} className="faq-group">
                <span className="faq-group-label">{group.title}</span>
                {group.items.map((item, ii) => (
                  <details key={ii} className="faq-item">
                    <summary>
                      <span className="faq-q">{item.question}</span>
                      <ChevronIcon />
                    </summary>
                    <div className="faq-a">{item.answer}</div>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
