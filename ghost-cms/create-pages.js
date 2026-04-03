#!/usr/bin/env node

/**
 * Create marketing pages in Ghost CMS from hardcoded website-v3-nextjs content.
 * This populates Ghost with all the pages so the client can edit them via the admin UI.
 *
 * Usage:
 *   GHOST_ADMIN_URL=https://opticwise-ghost.onrender.com \
 *   GHOST_ADMIN_KEY=id:secret \
 *   node create-pages.js
 */

const https = require("https");
const http = require("http");
const crypto = require("crypto");

const GHOST_URL = process.env.GHOST_ADMIN_URL;
const ADMIN_KEY = process.env.GHOST_ADMIN_KEY;

if (!GHOST_URL || !ADMIN_KEY) {
  console.error("Set GHOST_ADMIN_URL and GHOST_ADMIN_KEY environment variables");
  console.error("You can find the Admin API key in Ghost Admin → Settings → Integrations → Custom Integration");
  process.exit(1);
}

function makeToken() {
  const [id, secret] = ADMIN_KEY.split(":");
  const iat = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iat, exp: iat + 300, aud: "/admin/" })).toString("base64url");
  const sig = crypto.createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

function ghostRequest(method, endpoint, body) {
  const token = makeToken();
  const url = new URL(`/ghost/api/admin/${endpoint}`, GHOST_URL);
  const mod = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = mod.request(url, {
      method,
      headers: {
        Authorization: `Ghost ${token}`,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(body); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function htmlToMobiledoc(html) {
  return JSON.stringify({
    version: "0.3.1",
    markups: [],
    atoms: [],
    cards: [["html", { html }]],
    sections: [[10, 0]],
  });
}

const PAGES = [
  {
    slug: "digital-infrastructure-noi-strategy",
    title: "Data & Digital Infrastructure NOI Strategy",
    meta_description: "Data & digital infrastructure NOI strategy is the intentional design, ownership, and control of a property\u2019s networks, systems, and data to directly increase net operating income.",
    custom_excerpt: "Data & digital infrastructure NOI strategy is the intentional design, ownership, and control of a property\u2019s networks, systems, and data to directly increase net operating income, reduce operational risk, and protect long-term asset value.",
    html: `<h2>Why NOI Is Now a Data & Digital Infrastructure Decision</h2>
<h3>Networks Are No Longer Background Utilities</h3>
<p>For years, owners treated networks as background utilities\u2014something the IT vendor handled. Today, the foundation determines everything downstream:</p>
<ul><li>Who controls connectivity economics</li><li>Whether operations are manual or coordinated</li><li>Whether data is usable or trapped</li><li>Whether AI can function at all</li></ul>
<h3>The Foundation Shapes Every Outcome</h3>
<p>NOI isn\u2019t just a financial metric anymore. It\u2019s determined by who owns the infrastructure that generates, moves, and governs the data your building runs on.</p>
<p>If that infrastructure is fragmented, siloed, or vendor-controlled, NOI leaks\u2014quietly, consistently, and at scale.</p>
<h2>Where NOI Leaks Today</h2>
<p>Most owners don\u2019t see these leaks because they\u2019re embedded in contracts, workflows, and vendor defaults.</p>
<ul><li><strong>Revenue-Share Agreements</strong> \u2014 Vendors capture the economics of connectivity you should own</li><li><strong>Redundant Infrastructure</strong> \u2014 Multiple overlapping networks nobody mapped or consolidated</li><li><strong>Data Trapped in Dashboards</strong> \u2014 Insights you can see but can\u2019t export, combine, or govern</li><li><strong>Manual Operations</strong> \u2014 Workflows that should be automated but aren\u2019t because systems don\u2019t talk</li><li><strong>Integration Fragility</strong> \u2014 One vendor change breaks three others</li><li><strong>Portfolio Inconsistency</strong> \u2014 Every building is a one-off; nothing compounds</li></ul>
<h2>The Owner-Control Advantage</h2>
<p>You\u2019re not upgrading tech. You\u2019re upgrading your business model.</p>
<ul><li><strong>Higher Effective Revenue</strong> \u2014 Own connectivity economics instead of sharing them with vendors</li><li><strong>Lower OpEx</strong> \u2014 Coordinated operations replace manual patchwork</li><li><strong>Reduced Risk</strong> \u2014 Governance baked in means fewer surprises during diligence</li><li><strong>Portfolio Compounding</strong> \u2014 Standardize once, scale across every building</li></ul>
<h2>The Path: PPP 5C\u2122</h2>
<p>From fragmented to owner-controlled. Five steps that build on each other.</p>
<ol><li><strong>Clarify (PPP Audit\u2122)</strong> \u2014 Map what you own, where value leaks, and what\u2019s trustworthy and portable</li><li><strong>Connect</strong> \u2014 Create a resilient digital backbone that links systems, platforms, and devices</li><li><strong>Collect</strong> \u2014 Aggregate high-fidelity usable data across the property</li><li><strong>Coordinate</strong> \u2014 Align vendors, workflows, and automation using governed data</li><li><strong>Control</strong> \u2014 Reclaim ownership of your data & digital infrastructure so you stay platform-flexible</li></ol>`
  },
  {
    slug: "digital-infrastructure-noi-playbook",
    title: "Data & Digital Infrastructure NOI Playbook",
    meta_description: "A repeatable, owner-led framework that turns commercial real estate data & digital infrastructure into predictable NOI instead of unmanaged operating costs.",
    custom_excerpt: "A repeatable, owner-led framework that turns commercial real estate data & digital infrastructure into predictable NOI instead of unmanaged operating costs.",
    html: `<h2>Why a Playbook (Not a One-Off Project)</h2>
<h3>Implementations Fail. Operating Models Scale.</h3>
<p>Most smart building efforts fail because they\u2019re treated as implementations\u2014a vendor installs a system, trains a team, and moves on. Six months later, the integration drifts, the data degrades, and the next renovation starts from scratch.</p>
<p>A playbook changes that. It makes NOI repeatable across assets, vendors, renovations, and acquisitions.</p>
<h3>What a Playbook Gives You</h3>
<ul><li>A single standard that every building follows</li><li>Rules that vendors must comply with</li><li>Governance that survives team turnover and asset trades</li><li>A compounding foundation that gets stronger with each property</li></ul>
<h2>The PPP 5C\u2122 Owner Path</h2>
<p>Each step builds on the last. Skip one and the system doesn\u2019t compound.</p>
<ol><li><strong>Clarify (PPP Audit\u2122)</strong> \u2014 Map what you own, where value leaks, who\u2019s accountable, and what data is trustworthy and portable. This is the ownership reset.</li><li><strong>Connect</strong> \u2014 Build a resilient, owner-controlled digital backbone\u2014segmented, documented, and governed.</li><li><strong>Collect</strong> \u2014 Aggregate high-fidelity, usable data across the property. Not more data\u2014better data.</li><li><strong>Coordinate</strong> \u2014 Align vendors, workflows, and automation using governed data.</li><li><strong>Control</strong> \u2014 Reclaim full ownership of your data & digital infrastructure. Stay platform-flexible.</li></ol>
<h2>The Two-Layer Model</h2>
<p>Layer 1 creates the foundation. Layer 2 turns it into intelligence. Together, they make NOI repeatable.</p>
<h3>Layer 1: Managed Data & Digital Infrastructure</h3>
<p>The foundation you own: repeatable design, governance baked in, ongoing digital management without taxing on-site teams.</p>
<h3>Layer 2: Owner-Controlled Intelligence Layer (OpticWise Brain)</h3>
<p>A vendor- and LLM-agnostic Property Intelligence Layer: a governed data plane + trust plane enabling autonomous activities and intelligence\u2014so you can plug in any systems and decision engines you want, and swap them over time.</p>
<p><strong>One standard intelligence substrate \u2192 Many decision engines \u2192 Scaled across buildings</strong></p>`
  },
  {
    slug: "ppp-audit",
    title: "PPP Audit\u2122",
    meta_description: "The PPP Audit\u2122 is OpticWise's Clarify entry point \u2014 mapping what you own, where value leaks, and who controls your data & digital infrastructure.",
    custom_excerpt: "PPP \u2014 Property. Platform. Provider. \u2014 is OpticWise's owner-first operating model for data & digital infrastructure. The PPP Audit\u2122 is the Clarify entry point: a structured diagnostic that maps what you own, where value leaks, and who is actually accountable across your building\u2019s digital stack.",
    html: `<h2>What It Does</h2>
<p>The PPP Audit\u2122 answers five questions every owner should be able to answer \u2014 but almost none can today.</p>
<ul><li><strong>What you own</strong> \u2014 Infrastructure, contracts, data rights, and control points mapped clearly.</li><li><strong>Where value is leaking</strong> \u2014 Revenue-share agreements, redundant spend, and hidden vendor margin identified.</li><li><strong>Who is accountable</strong> \u2014 Vendor roles, SLAs, and ownership gaps surfaced across every system.</li><li><strong>What data is trustworthy</strong> \u2014 Data sources evaluated for accuracy, accessibility, and portability.</li><li><strong>Where you have least control</strong> \u2014 Lock-in risks, data silos, and single-vendor dependencies exposed.</li></ul>
<p>This is not a \u201ctech assessment.\u201d It\u2019s an ownership and operating model reset.</p>
<h2>Deliverables</h2>
<h3>01 \u2014 Ownership + Control Map</h3>
<p>A visual map of every system, vendor, data source, and contract \u2014 showing who owns what, who controls what, and where gaps exist.</p>
<h3>02 \u2014 KPI Alignment Scoreboard</h3>
<p>A scoring framework that maps every digital system to the KPIs it should be supporting \u2014 and shows where misalignment creates cost or risk.</p>
<h3>03 \u2014 A Repeatable Standard</h3>
<p>Not a one-time report. The PPP Audit\u2122 creates a baseline that can be applied across every property in a portfolio \u2014 making infrastructure governance scalable.</p>
<h2>PPP 5C\u2122 Framework</h2>
<ol><li><strong>Clarify (PPP Audit\u2122)</strong> \u2014 Map what you own, where value leaks, and who is accountable. Establish the baseline.</li><li><strong>Connect</strong> \u2014 Create a resilient digital backbone that links systems, platforms, and devices under owner control.</li><li><strong>Collect</strong> \u2014 Aggregate high-fidelity, usable data from across your property in formats you control.</li><li><strong>Coordinate</strong> \u2014 Align vendors, workflows, and accountability so operations become predictable.</li><li><strong>Control</strong> \u2014 Reclaim ownership and stay platform-flexible over time. Infrastructure serves your NOI.</li></ol>`
  },
  {
    slug: "ai-ready-commercial-real-estate",
    title: "AI-Ready Commercial Real Estate",
    meta_description: "AI-ready commercial real estate refers to properties designed and operated with owner-controlled digital infrastructure and high-fidelity data.",
    custom_excerpt: "Properties designed and operated with owner-controlled digital infrastructure and high-fidelity data, enabling predictive operations and long-term competitive advantage.",
    html: `<h2>What Makes a Property AI-Ready</h2>
<p>AI-ready is not a feature set. It is a structural condition \u2014 four foundations that determine whether AI can function reliably.</p>
<ul><li><strong>Governed Access & Identity</strong> \u2014 Owner controls who accesses systems, data, and infrastructure \u2014 not vendors</li><li><strong>Reliable Data Capture</strong> \u2014 High-fidelity, continuously available data from across building systems in open formats</li><li><strong>Documented Integration Pathways</strong> \u2014 Systems connected through owner-controlled, auditable, and portable pathways</li><li><strong>Portability</strong> \u2014 The ability to change platforms, vendors, or AI models without losing data or operational continuity</li></ul>
<p>AI-ready is a precondition, not an upgrade. Without these foundations, AI investments underperform.</p>
<h2>Why Most Properties Are Not AI-Ready</h2>
<p>The gap is structural \u2014 not technological.</p>
<ul><li><strong>Data Is Fragmented</strong> \u2014 Operational data lives across dozens of vendor platforms with no unified access layer.</li><li><strong>The Network Wasn\u2019t Designed for Reuse</strong> \u2014 Infrastructure was built for connectivity, not intelligence.</li><li><strong>Visibility Is Trapped</strong> \u2014 Vendor dashboards show what they want to show.</li><li><strong>No Governance</strong> \u2014 No rules for data retention, access permissions, or integration accountability.</li></ul>
<h2>Two-Layer AI Readiness Architecture</h2>
<h3>Layer 1: Data Plane \u2014 Trust the Inputs</h3>
<p>Governed, clean, exportable data under owner control.</p>
<h3>Layer 2: Intelligence Plane \u2014 Trust the Outputs</h3>
<p>When the data plane is solid, AI delivers real value \u2014 predictive maintenance, energy optimization, tenant analytics, and portfolio-level decision support.</p>
<p><strong>Governed Data \u2192 Reliable AI \u2192 Competitive Advantage</strong></p>`
  },
  {
    slug: "own-vs-lease-cre-building-data",
    title: "Own vs Lease CRE Building Data",
    meta_description: "Owning CRE building data means the property owner retains full control, access, and decision rights over operational and tenant-generated data.",
    custom_excerpt: "Owning your data means retaining full control, access, and decision rights. Leasing it places those rights in the hands of vendors and platforms.",
    html: `<h2>The Ownership Question</h2>
<p>Data ownership in CRE is not a legal abstraction. It is an operational reality that determines who controls value.</p>
<ul><li><strong>Who Can Export</strong> \u2014 Can you extract your operational data in open formats without vendor approval?</li><li><strong>Who Holds Admin Credentials</strong> \u2014 If your vendor controls the master admin account, they control the system.</li><li><strong>Who Defines \u201cTruth\u201d</strong> \u2014 Vendor dashboards define what you see.</li><li><strong>Who Can Change Platforms</strong> \u2014 If switching vendors means losing historical data, you never owned it.</li></ul>
<h2>What Happens When You Lease Data</h2>
<p>Leased data creates compounding risk.</p>
<ul><li>Vendor Lock-In \u2014 switching costs escalate every year</li><li>Rising Costs \u2014 vendors increase fees knowing you cannot leave</li><li>Lost History \u2014 when contracts end, historical data disappears</li><li>No AI Foundation \u2014 leased data cannot be structured for AI</li><li>Blind Spots \u2014 vendor dashboards show filtered views</li></ul>
<h2>What Happens When You Own Data</h2>
<p>Owned data compounds. Every year of clean, governed data increases the intelligence, resilience, and value of the asset.</p>
<ul><li>Platform Flexibility \u2014 change vendors without losing data</li><li>Cost Control \u2014 negotiate from strength</li><li>Data Continuity \u2014 historical data compounds</li><li>AI-Ready Foundation \u2014 governed, structured data enables reliable AI</li><li>Full Visibility \u2014 see the complete picture of your operations</li></ul>
<p>Owned data is not a feature. It is the structural difference between assets that appreciate and assets that degrade.</p>`
  },
  {
    slug: "control-cre-digital-visibility",
    title: "Control of CRE Digital Visibility",
    meta_description: "Control of CRE digital visibility is the ability of a commercial real estate owner to govern how their building is represented across search engines, AI systems, and digital platforms.",
    custom_excerpt: "The ability to govern how your building, performance, and data context are represented across search engines, AI systems, and digital platforms.",
    html: `<h2>Visibility Is an Infrastructure Outcome</h2>
<p>How your building appears online is no longer a marketing problem. It is a data and infrastructure problem.</p>
<ul><li><strong>Beyond Listings & Reviews</strong> \u2014 Digital visibility is every data point about your building that search engines, AI systems, and platforms use to rank, describe, and recommend your property.</li><li><strong>Fragmented Data, Fragmented Narrative</strong> \u2014 When building data lives in vendor silos, the story your property tells online is written by those vendors.</li><li><strong>The New Default</strong> \u2014 AI systems now synthesize building data from dozens of sources to generate summaries. If you don\u2019t control your data, you don\u2019t control what AI says about your building.</li></ul>
<h2>How Owners Lose Control of Visibility</h2>
<ul><li>Search engines define you with incomplete or outdated data</li><li>Vendors control the narrative through their platforms</li><li>AI summaries are confident-sounding but may be wrong</li><li>No single source of truth exists for your building\u2019s digital identity</li></ul>
<h2>Owner-Controlled Visibility</h2>
<p>When owners control their infrastructure and data, they control the story.</p>
<ul><li>Authoritative data source from your own infrastructure</li><li>Search & AI alignment through structured data feeds</li><li>Consistent narrative across all platforms</li><li>Competitive differentiation in AI-driven discovery</li></ul>`
  },
  {
    slug: "bot-building-of-things",
    title: "BoT\u00AE (Building of Things\u00AE)",
    meta_description: "BoT\u00AE is the connective layer that turns networks, sensors, systems, data environments, and AI into one owner-controlled digital nervous system.",
    custom_excerpt: "Most owners are familiar with IoT. BoT\u00AE reframes this: if you own a building full of digital systems, you should operate it as your own Building of Things \u2014 not as vendor-controlled IoT deployments.",
    html: `<h2>The Challenge</h2>
<p>Billions have been spent connecting things inside commercial properties. The problem is not a lack of connected devices \u2014 it\u2019s that those devices are operated by vendors, not by owners.</p>
<ul><li><strong>Networks Built in Silos</strong> \u2014 Every vendor installs its own network segment, creating overlapping infrastructure with no unified visibility.</li><li><strong>Low-Voltage / OT Decisions Without Governance</strong> \u2014 Decisions made by contractors, not aligned to the owner\u2019s operating model.</li><li><strong>Data Fragmented Across Vendor Dashboards</strong> \u2014 Operational data sits inside vendor platforms the owner cannot access.</li></ul>
<h2>The BoT\u00AE Approach</h2>
<p>BoT\u00AE replaces vendor-fragmented IoT with an owner-controlled digital nervous system.</p>
<ul><li><strong>Consolidate</strong> \u2014 Unify siloed networks into a single, owner-visible digital backbone</li><li><strong>Standardize</strong> \u2014 Consistent protocols, data formats, and governance rules</li><li><strong>Govern</strong> \u2014 Define who owns what, who accesses what, and how changes are managed</li><li><strong>Scale Intelligence</strong> \u2014 When data flows through an owner-controlled layer, intelligence compounds</li></ul>
<h2>Architecture</h2>
<h3>Layer 1: Physical Connectivity</h3>
<p>The owner-controlled digital backbone: structured cabling, Wi-Fi, cellular, DAS, and sensor connectivity.</p>
<h3>Layer 2: Data & Intelligence</h3>
<p>Data from every connected system flows through a trust plane \u2014 a governed layer where the owner defines access rights, retention policies, and integration rules.</p>
<p><strong>Signals \u2192 Governed Data \u2192 Operational Intelligence \u2192 AI-Ready Foundation</strong></p>`
  },
  {
    slug: "5s-wireless-connectivity",
    title: "5S\u00AE Wireless Connectivity",
    meta_description: "OpticWise's wireless connectivity product delivering seamless mobility, security, stability, speed, and service across all protocols.",
    custom_excerpt: "5S\u00AE is OpticWise\u2019s wireless connectivity product \u2014 delivering Seamless mobility, Security, Stability, Speed, and Service across Wi-Fi, in-building cellular, DAS, and future wireless protocols, all under owner control.",
    html: `<h2>The 5S\u00AE Experience</h2>
<p>Every wireless deployment is measured against five non-negotiable experience pillars.</p>
<ul><li><strong>Seamless Mobility</strong> \u2014 Continuous connectivity across floors, elevators, lobbies, and outdoor areas</li><li><strong>Security</strong> \u2014 Enterprise-grade segmentation, encryption, and access control</li><li><strong>Stability / Resilience</strong> \u2014 Redundant paths, failover design, and proactive monitoring</li><li><strong>Speed</strong> \u2014 Bandwidth engineered for today\u2019s demand and scalable for the next wave</li><li><strong>Service</strong> \u2014 Support that doesn\u2019t land on your on-site staff</li></ul>
<h2>Delivery</h2>
<h3>Protocol-Agnostic by Design</h3>
<p>5S\u00AE is not a Wi-Fi product. It spans Wi-Fi 6/6E/7, in-building cellular and DAS, Private 5G / CBRS, and IoT wireless (BLE, Zigbee, LoRa).</p>
<h3>Owner Control Is the Point</h3>
<p>Owner-controlled infrastructure and data, vendor-swappable architecture, visibility into usage and performance, SLAs aligned to owner KPIs.</p>
<h2>Owner Value</h2>
<ul><li><strong>Higher Retention</strong> \u2014 Reliable connectivity reduces churn and strengthens renewals</li><li><strong>Lower On-Site Burden</strong> \u2014 Managed, proactively monitored wireless means fewer tickets</li><li><strong>Reduced Operational Risk</strong> \u2014 Segmented networks and encrypted traffic reduce exposure</li><li><strong>Portfolio Repeatability</strong> \u2014 One framework, consistent experience, scalable operations</li></ul>`
  },
  {
    slug: "how-we-operate-digital-infrastructure",
    title: "How OpticWise Operates Data & Digital Infrastructure",
    meta_description: "Most owners have an IT strategy. Almost nobody has an OT strategy. OpticWise designs, deploys, manages, and governs owner-controlled digital infrastructure.",
    custom_excerpt: "Most owners have an IT strategy. Almost nobody has an OT strategy. OpticWise bridges that gap \u2014 designing, deploying, managing, and governing owner-controlled digital infrastructure as a single coordinated system.",
    html: `<h2>Layer 1 \u2014 Physical & Operational</h2>
<p>The infrastructure you can see, touch, and measure \u2014 and the operational discipline that keeps it performing.</p>
<h3>01 \u2014 Design</h3>
<p>Building-specific network and wireless design, low-voltage and OT pathway planning, convergence strategy, capacity planning.</p>
<h3>02 \u2014 Implementation</h3>
<p>Vendor coordination, commissioning and testing protocols, documentation under owner control, handoff to managed operations.</p>
<h3>03 \u2014 Operations</h3>
<p>24/7 monitoring and proactive maintenance, SLA management and vendor accountability, lifecycle management, reporting aligned to owner KPIs.</p>
<h2>Layer 2 \u2014 Data & Trust</h2>
<p>Infrastructure generates signals. Layer 2 turns those signals into governed, owner-controlled intelligence.</p>
<p>The <strong>data plane</strong> aggregates signals from every connected system into a unified data environment the owner controls. The <strong>trust plane</strong> governs that data: who can access it, how it\u2019s retained, where it flows, and what decisions it feeds.</p>
<p><strong>Raw Signals \u2192 Governed Data \u2192 Operational Intelligence \u2192 AI-Ready CRE</strong></p>
<h2>Outcomes</h2>
<ul><li><strong>NOI growth</strong> \u2014 Infrastructure becomes a revenue and efficiency driver</li><li><strong>Tenant experience</strong> \u2014 Seamless connectivity, faster issue resolution</li><li><strong>Operational control</strong> \u2014 Single pane of glass across all building systems</li><li><strong>AI readiness</strong> \u2014 Clean, governed, continuously available data</li></ul>`
  },
  {
    slug: "brains",
    title: "Property Brain\u2122 \u2192 Portfolio Brain\u2122",
    meta_description: "OpticWise's owner-controlled intelligence layer: Property Brain at each asset, Portfolio Brain across the portfolio.",
    custom_excerpt: "Most portfolios have pieces of \u201cintelligence,\u201d but it\u2019s fragmented across vendors and tools\u2014so performance resets building by building.",
    html: `<h2>Two Layers of Intelligence</h2>
<h3>Property Brain\u2122 \u2014 The intelligence layer at each asset</h3>
<p>Senses what\u2019s happening, decides what to do next, and drives execution\u2014under owner permissions. Every building becomes a self-aware operating unit.</p>
<h3>Portfolio Brain\u2122 \u2014 The coordination layer across assets</h3>
<p>Sets strategy, standards, and allocates focus/capital\u2014so results compound across the portfolio instead of resetting at every building.</p>
<p><strong>OpticWise delivers:</strong> Owner-controlled intelligence \u2192 Governed data plane + trust plane \u2192 Autonomous activities under owner permissions.</p>
<h2>The B.R.A.I.N. Loop</h2>
<p>What a real Property Brain\u2122 does at every asset, continuously.</p>
<ul><li><strong>B \u2014 Baseline</strong> \u2014 What\u2019s happening\u2014continuous sensing across all building systems</li><li><strong>R \u2014 Reason</strong> \u2014 Why it\u2019s happening\u2014root cause analysis, pattern detection</li><li><strong>A \u2014 Action</strong> \u2014 The 2\u20133 plays to run next\u2014prioritized recommendations</li><li><strong>I \u2014 Implementation</strong> \u2014 Did it get done\u2014execution tracking and accountability</li><li><strong>N \u2014 Net Impact</strong> \u2014 Did it work\u2014verified outcomes tied back to KPIs</li></ul>
<h2>How OpticWise Helps You Build It (PPP 5C\u2122)</h2>
<ol><li><strong>Clarify (PPP Review / Audit)</strong> \u2014 Establish what you own, where value leaks, and what data is trustworthy</li><li><strong>Connect</strong> \u2014 Create the resilient digital backbone that links systems</li><li><strong>Collect</strong> \u2014 Aggregate high-fidelity usable data across the property</li><li><strong>Coordinate</strong> \u2014 Align vendors, workflows, and automation using governed data</li><li><strong>Control</strong> \u2014 Reclaim ownership and stay platform-flexible over time</li></ol>
<p>Pilot one property to establish the Property Brain\u2122 and prove portability by plugging in a decision engine.</p>`
  },
  {
    slug: "advisory-services",
    title: "Advisory Services",
    meta_description: "Owner-controlled data & digital infrastructure advisory for CRE owners who want to self-perform or co-manage.",
    custom_excerpt: "You may have internal IT/OT resources. The question is whether you have an owner standard for data & digital infrastructure\u2014and the governance to keep it portable.",
    html: `<h2>Who This Is For</h2>
<ul><li><strong>Owners / Operators Who Want to Self-Perform or Co-Manage</strong> \u2014 You have internal capabilities but need a repeatable owner standard.</li><li><strong>Portfolios with Third-Party PM Constraints</strong> \u2014 Non-negotiable tools and fragmented vendor relationships that need governance.</li><li><strong>Teams Tired of \u201cSmart Building\u201d One-Offs</strong> \u2014 Point solutions that don\u2019t scale.</li></ul>
<h2>What You Get</h2>
<ul><li><strong>Owner Standard (Repeatable)</strong> \u2014 Documented standards across properties: segmentation, access rules, naming, documentation, export rights</li><li><strong>Governance That Survives Change</strong> \u2014 Identity, access, privacy, lineage, retention, and rules of use</li><li><strong>Portability by Design</strong> \u2014 Vendor- and LLM-agnostic foundations so you can swap systems over time</li></ul>
<h2>How We Work: PPP 5C\u2122</h2>
<ol><li><strong>Clarify (PPP Review / Audit)</strong> \u2014 Define success metrics, map ownership, identify leakage</li><li><strong>Connect</strong> \u2014 Secure, owner-controlled connectivity repeatable property-to-property</li><li><strong>Collect</strong> \u2014 Capture/normalize high-fidelity usable data into a consistent model</li><li><strong>Coordinate</strong> \u2014 Govern identity, access, privacy, lineage, retention, and rules of use</li><li><strong>Control</strong> \u2014 Enable decision engines/workflows to act under owner permissions</li></ol>`
  },
  {
    slug: "digital-infrastructure-noi-ai",
    title: "Data & Digital Infrastructure, NOI, and AI in Commercial Real Estate",
    meta_description: "Commercial real estate is entering a structural shift\u2014not a technology cycle, a control cycle. Explore the pillars of owner-controlled infrastructure.",
    custom_excerpt: "Commercial real estate is entering a structural shift. Not a technology cycle. A control cycle.",
    html: `<h2>Why These Topics Are Now One Conversation</h2>
<h3>NOI, Infrastructure, AI, and Visibility Were Never Separate</h3>
<p>For years, owners treated NOI (finance), digital infrastructure (IT), AI (innovation), and visibility (marketing) as separate line items. That separation no longer holds. Digital infrastructure ownership sits upstream of all of them.</p>
<h3>The Question Has Changed</h3>
<p>The question is no longer \u201cwhich platform should we buy?\u201d It\u2019s: <strong>who controls the foundation those platforms run on?</strong></p>
<h2>From Vendor Convenience to Owner Control</h2>
<p>Most owners didn\u2019t give up control intentionally. It happened one contract at a time.</p>
<ul><li>Shadow Networks \u2014 Vendor-installed infrastructure you don\u2019t control</li><li>Siloed Integrations \u2014 Systems that don\u2019t talk to each other by design</li><li>Data Trapped in Platforms \u2014 Can\u2019t export, can\u2019t combine, can\u2019t govern</li><li>Revenue-Share Agreements \u2014 Vendors capture the economics you should own</li></ul>
<h2>The Two-Layer Model</h2>
<h3>Layer 1: Managed Data & Digital Infrastructure</h3>
<p>The foundation you own: repeatable design, governance baked in, ongoing operations.</p>
<h3>Layer 2: Owner-Controlled Intelligence Layer (OpticWise Brain)</h3>
<p>A vendor- and LLM-agnostic Property Intelligence Layer enabling autonomous activities under owner permissions.</p>
<h2>The Pillars</h2>
<ul><li><a href="/digital-infrastructure-noi-strategy/">NOI Strategy</a> \u2014 How digital infrastructure ownership directly increases NOI</li><li><a href="/digital-infrastructure-noi-playbook/">NOI Playbook</a> \u2014 A repeatable, owner-led framework</li><li><a href="/ai-ready-commercial-real-estate/">AI-Ready CRE</a> \u2014 The structural requirements for AI-ready properties</li><li><a href="/own-vs-lease-cre-building-data/">Own vs Lease Data</a> \u2014 Why owning your building data matters</li><li><a href="/control-cre-digital-visibility/">Digital Visibility</a> \u2014 Control how your properties appear and compete online</li></ul>`
  },
];

async function main() {
  console.log(`Creating ${PAGES.length} pages in Ghost CMS...\n`);

  let ok = 0;
  let err = 0;

  for (let i = 0; i < PAGES.length; i++) {
    const page = PAGES[i];
    const progress = `[${String(i + 1).padStart(2)}/${PAGES.length}]`;

    try {
      const result = await ghostRequest("POST", "pages/", {
        pages: [{
          title: page.title,
          slug: page.slug,
          mobiledoc: htmlToMobiledoc(page.html),
          status: "published",
          meta_description: page.meta_description,
          custom_excerpt: page.custom_excerpt,
        }],
      });

      if (result.pages) {
        ok++;
        console.log(`${progress} OK   ${page.slug}`);
      } else {
        const errMsg = result.errors?.[0]?.message || JSON.stringify(result).substring(0, 120);
        if (errMsg.includes("already exists")) {
          console.log(`${progress} SKIP ${page.slug} (already exists)`);
          ok++;
        } else {
          err++;
          console.log(`${progress} ERR  ${page.slug} — ${errMsg.substring(0, 80)}`);
        }
      }
    } catch (e) {
      err++;
      console.log(`${progress} ERR  ${page.slug} — ${e.message.substring(0, 80)}`);
    }

    if (i < PAGES.length - 1) await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n========================================`);
  console.log(`Created: ${ok}/${PAGES.length}`);
  console.log(`Errors:  ${err}`);
  console.log(`========================================`);
  console.log(`\nNext steps:`);
  console.log(`1. Log into Ghost Admin and review each page`);
  console.log(`2. Add feature images (hero/banner) to each page`);
  console.log(`3. Edit content as needed using Ghost's rich editor`);
  console.log(`4. Pages will auto-appear on the website via the catch-all route`);
}

main().catch(console.error);
