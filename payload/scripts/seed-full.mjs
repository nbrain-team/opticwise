/**
 * Full seed script: uploads images to Media library, then re-seeds pages with
 * actual layout block content referencing those media items.
 *
 * Usage:
 *   PAYLOAD_URL=https://opticwise-payload.onrender.com \
 *   PAYLOAD_EMAIL=danny@nbrain.ai \
 *   PAYLOAD_PASSWORD=Tm0bile#88 \
 *   node scripts/seed-full.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = process.env.PAYLOAD_URL || "https://opticwise-payload.onrender.com";
const EMAIL = process.env.PAYLOAD_EMAIL;
const PASSWORD = process.env.PAYLOAD_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set PAYLOAD_EMAIL and PAYLOAD_PASSWORD env vars");
  process.exit(1);
}

let TOKEN = "";

async function api(method, endpoint, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `JWT ${TOKEN}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${endpoint}`, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 400) {
    throw new Error(`${method} ${endpoint} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return { status: res.status, data: json };
}

async function uploadMedia(filePath, alt) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
  const mime = mimeTypes[ext] || "application/octet-stream";

  const boundary = "----PayloadBoundary" + Date.now();
  const CRLF = "\r\n";

  let body = "";
  body += `--${boundary}${CRLF}`;
  body += `Content-Disposition: form-data; name="_payload"${CRLF}`;
  body += `Content-Type: application/json${CRLF}${CRLF}`;
  body += JSON.stringify({ alt }) + CRLF;
  body += `--${boundary}${CRLF}`;
  body += `Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`;
  body += `Content-Type: ${mime}${CRLF}${CRLF}`;

  const prefix = Buffer.from(body, "utf-8");
  const suffix = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, "utf-8");
  const payload = Buffer.concat([prefix, fileBuffer, suffix]);

  const res = await fetch(`${BASE}/api/media`, {
    method: "POST",
    headers: {
      Authorization: `JWT ${TOKEN}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: payload,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Upload ${fileName} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json.doc;
}

async function login() {
  const { data } = await api("POST", "/api/users/login", { email: EMAIL, password: PASSWORD });
  TOKEN = data.token;
  console.log("Logged in as", data.user?.email);
}

async function findByAlt(alt) {
  const { data } = await api("GET", `/api/media?where[alt][equals]=${encodeURIComponent(alt)}&limit=1`);
  return data.docs && data.docs.length > 0 ? data.docs[0] : null;
}

async function findPageBySlug(slug) {
  const { data } = await api("GET", `/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`);
  return data.docs && data.docs.length > 0 ? data.docs[0] : null;
}

// ── Media files to upload ──
const IMAGES_DIR = path.resolve(__dirname, "../public/images");
const MEDIA_FILES = [
  { file: "hero-industry.jpg", alt: "CRE building hero background" },
  { file: "solution-industry.jpg", alt: "Building infrastructure solution" },
  { file: "project-catalyst.jpg", alt: "ASPIRIA project" },
  { file: "project-industry.jpg", alt: "Industry project Denver" },
  { file: "project-tradecraft.jpg", alt: "AMAZE at NODA project" },
  { file: "testimonial-bg.jpg", alt: "CTA background" },
  { file: "ow_logo.png", alt: "OpticWise logo" },
  { file: "ppp-book-cover.png", alt: "Peak Property Performance book cover" },
  { file: "problem-image.webp", alt: "Silent loss of control" },
  { file: "logo.svg", alt: "OpticWise logo SVG" },
];

// ── Page layouts ──
function buildPageLayouts(mediaMap) {
  const heroImgId = mediaMap["CRE building hero background"]?.id;
  const solutionImgId = mediaMap["Building infrastructure solution"]?.id;
  const ctaBgId = mediaMap["CTA background"]?.id;
  const bookImgId = mediaMap["Peak Property Performance book cover"]?.id;
  const projectCatalystId = mediaMap["ASPIRIA project"]?.id;
  const projectIndustryId = mediaMap["Industry project Denver"]?.id;
  const projectTradecraftId = mediaMap["AMAZE at NODA project"]?.id;

  return {
    "ppp-audit": [
      {
        blockType: "content",
        layout: "two-column",
        eyebrow: "Your Starting Point",
        heading: "What Is a PPP Audit?",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "The PPP Audit is a structured, complementary review session where we map who owns what, where data lives, and where operational burden stacks up vs your KPIs." }] },
          { type: "paragraph", children: [{ type: "text", text: "It is not a sales pitch. It is a working session with your team to surface what you already know — and structure it so you can make informed decisions." }] },
        ]}},
        image: solutionImgId || undefined,
        imagePosition: "left",
        backgroundColor: "white",
      },
      {
        blockType: "timeline",
        eyebrow: "The Process",
        heading: "How the PPP Audit Works",
        subheading: "A structured five-step review that maps your current state and identifies where owner-controlled infrastructure compounds value.",
        backgroundColor: "gray",
        steps: [
          { number: "01", title: "Property Intake", badge: "30 MIN", description: "We collect baseline information about your property: systems, vendors, contracts, and current challenges.", isActive: true },
          { number: "02", title: "Data & Digital Mapping", description: "We map where data lives, who controls it, and where operational burden concentrates vs your KPIs." },
          { number: "03", title: "Infrastructure Assessment", description: "We evaluate your current connectivity, network segmentation, access control, and governance posture." },
          { number: "04", title: "Gap Analysis", badge: "DELIVERABLE", description: "We produce a clear gap analysis showing where you have control, where you've delegated it, and what it costs." },
          { number: "05", title: "Roadmap Presentation", badge: "DELIVERABLE", description: "We present a prioritized roadmap: quick wins, medium-term improvements, and long-term infrastructure plays." },
        ],
      },
      {
        blockType: "deliverables",
        eyebrow: "What You Get",
        heading: "PPP Audit Deliverables",
        backgroundColor: "white",
        items: [
          { title: "Property Data Map", subtitle: "Where data lives today", description: "A visual map of every data source, system, and vendor in your building — and who controls each one." },
          { title: "Control Gap Analysis", subtitle: "What you own vs. lease", description: "A clear breakdown of where you have owner control vs. vendor dependency, and the operational cost of each gap." },
          { title: "Prioritized Roadmap", subtitle: "What to do next", description: "A phased plan for reclaiming control: quick wins you can implement immediately, and strategic moves for the long game." },
        ],
      },
      {
        blockType: "cta",
        style: "primary",
        eyebrow: "Ready to Start?",
        heading: "Schedule Your Complementary PPP Audit",
        description: "One building. Map who owns what, where data lives, and where operational burden stacks up vs your KPIs.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "digital-infrastructure-noi-strategy": [
      {
        blockType: "content",
        layout: "two-column",
        eyebrow: "The Problem",
        heading: "The Owner Problem: Silent Loss of Control",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "Most owners did not give up control intentionally. It happened quietly: networks installed under vendor contracts, wireless systems designed around revenue share, data locked inside dashboards, visibility defined by third-party platforms." }] },
          { type: "paragraph", children: [{ type: "text", text: "Each decision felt tactical. Together, they shifted control away from the asset." }] },
        ]}},
        image: solutionImgId || undefined,
        imagePosition: "left",
        backgroundColor: "white",
      },
      {
        blockType: "cardGrid",
        eyebrow: "The Solution",
        heading: "What Ownership Unlocks",
        subheading: "When you reclaim control of data & digital infrastructure, outcomes change.",
        columns: "3",
        style: "light",
        cards: [
          { icon: "chart-up", iconColor: "blue", title: "NOI Improves", description: "Through owner-controlled connectivity and operational efficiency" },
          { icon: "users", iconColor: "blue", title: "Tenant Experience Improves", description: "Through consistent, measurable performance" },
          { icon: "shield", iconColor: "blue", title: "Operations Stabilize", description: "Through coordination and reduced vendor friction" },
          { icon: "lightbulb", iconColor: "green", title: "AI Readiness Becomes Real", description: "Not theoretical — grounded in governance" },
          { icon: "flask", iconColor: "blue", title: "Assets Future-Proof", description: "As vendors and technologies change" },
        ],
        footnote: "This is not about more technology. It is about who controls the economics.",
      },
      {
        blockType: "cta",
        style: "primary",
        eyebrow: "Your Next Step",
        heading: "Complementary CRE Data & Digital Review Session",
        description: "One building. Map who owns what, where data lives, and where operational burden stacks up vs your KPIs.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "digital-infrastructure-noi-playbook": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "The Framework",
        heading: "PPP 5C™ Framework",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "The PPP 5C Framework is a repeatable methodology for building data & digital infrastructure that compounds NOI over time. It ensures every investment in technology is governed, measured, and aligned with owner outcomes." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "timeline",
        eyebrow: "The Five C's",
        heading: "A Repeatable Framework for CRE Owners",
        backgroundColor: "gray",
        steps: [
          { number: "C1", title: "Connectivity", badge: "FOUNDATION", description: "Owner-controlled network infrastructure: fiber, wireless, IoT — designed for governance, not just coverage.", isActive: true },
          { number: "C2", title: "Control", description: "Segmentation, access rules, and documentation that ensure you own the data plane, not your vendors." },
          { number: "C3", title: "Collection", description: "Structured data ingestion from every building system — normalized, governed, and ready for intelligence." },
          { number: "C4", title: "Computation", description: "Analytics and AI that run on your data, under your governance, with outputs you control." },
          { number: "C5", title: "Compounding", badge: "OUTCOME", description: "Infrastructure that gets smarter over time — every building improves the portfolio." },
        ],
      },
      {
        blockType: "cta",
        style: "primary",
        eyebrow: "Your Next Step",
        heading: "See the PPP 5C Framework in Action",
        description: "Schedule a complementary review to see how the framework applies to your property.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "ai-ready-commercial-real-estate": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "AI Readiness",
        heading: "AI Is Not a Product. It Is a Capability That Requires Infrastructure.",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "Most AI conversations in CRE start with the tool: chatbots, predictive maintenance, energy optimization. But the real question isn't which AI tool to buy — it's whether your building can support any AI at all." }] },
          { type: "paragraph", children: [{ type: "text", text: "AI readiness requires three things: governed data, controlled infrastructure, and a trust plane that ensures outputs are reliable. Without these, AI is just another vendor dependency." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "cardGrid",
        eyebrow: "Requirements",
        heading: "What AI-Ready Actually Means",
        columns: "3",
        style: "light",
        cards: [
          { icon: "data", iconColor: "blue", title: "Governed Data", description: "Clean, structured, owner-controlled data from every building system" },
          { icon: "network", iconColor: "blue", title: "Controlled Infrastructure", description: "Segmented networks, documented systems, managed access" },
          { icon: "shield", iconColor: "green", title: "Trust Plane", description: "Governance layer that ensures AI outputs are reliable and auditable" },
        ],
      },
      {
        blockType: "twoLayerModel",
        eyebrow: "The OpticWise Approach",
        heading: "Infrastructure First, AI Second",
        layer1: {
          tag: "Step 1",
          title: "Build the Foundation",
          subtitle: "Data & digital infrastructure you own",
          items: [
            { bold: "Network governance:", text: "segmentation, access control, documentation" },
            { bold: "Data ingestion:", text: "structured collection from all building systems" },
            { bold: "Vendor independence:", text: "swap any system without losing data or control" },
          ],
        },
        layer2: {
          tag: "Step 2",
          title: "Enable Intelligence",
          subtitle: "AI that runs on your terms",
          formula: [
            { step: "Governed data" },
            { step: "Controlled inference" },
            { step: "Auditable outputs" },
          ],
        },
      },
      {
        blockType: "cta",
        style: "primary",
        eyebrow: "Your Next Step",
        heading: "Is Your Building AI-Ready?",
        description: "Find out in a complementary review session.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "own-vs-lease-cre-building-data": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "Data Economics",
        heading: "The Economics of Data Ownership in Commercial Real Estate",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "Every building generates data. The question is: who owns it? In most commercial properties, the answer is surprising — vendors do. They collect it, store it, analyze it, and sell insights back to you." }] },
          { type: "paragraph", children: [{ type: "text", text: "Owning your building data isn't just a governance issue — it's an economic one. Data ownership compounds value over time, while data leasing creates recurring dependency." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "cardGrid",
        eyebrow: "Own vs. Lease",
        heading: "The Data Ownership Spectrum",
        columns: "2",
        style: "white",
        cards: [
          { icon: "lock", iconColor: "red", title: "Leased Data", description: "Vendor-controlled, locked in dashboards, exported on their terms, lost when contracts end" },
          { icon: "shield", iconColor: "green", title: "Owned Data", description: "Owner-controlled, governed, portable, compounds value across the portfolio over time" },
        ],
      },
      {
        blockType: "cta",
        style: "primary",
        heading: "Map Your Data Ownership",
        description: "Find out what you own, what you lease, and what it costs.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "bot-building-of-things": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "OpticWise BoT®",
        heading: "The Owner-Controlled IoT & Connectivity Framework",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "Building of Things (BoT) is OpticWise's framework for designing, implementing, and operating IoT and connectivity infrastructure that the owner controls. Unlike vendor-managed IoT solutions, BoT ensures every sensor, device, and data stream is governed under your terms." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "cardGrid",
        eyebrow: "Framework Components",
        heading: "What BoT® Covers",
        columns: "3",
        style: "light",
        cards: [
          { icon: "wifi", iconColor: "blue", title: "Connectivity Layer", description: "Owner-controlled wireless, fiber, and cellular infrastructure" },
          { icon: "data", iconColor: "green", title: "Data Layer", description: "Governed data collection, normalization, and storage" },
          { icon: "brain", iconColor: "purple", title: "Intelligence Layer", description: "Analytics and automation on your data, under your control" },
        ],
      },
      {
        blockType: "cta",
        style: "primary",
        heading: "See BoT® in Action",
        description: "Schedule a review to see how BoT applies to your property.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "5s-wireless-connectivity": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "OpticWise 5S®",
        heading: "Secure, Scalable, Seamless, Smart, Sustainable Wireless",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "5S is OpticWise's wireless design standard for commercial properties. Every wireless deployment follows five principles that ensure the infrastructure serves the owner — not the vendor." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "cardGrid",
        eyebrow: "The Five S's",
        heading: "Wireless That Works for Owners",
        columns: "3",
        style: "light",
        cards: [
          { icon: "shield", iconColor: "blue", title: "Secure", description: "Segmented, authenticated, and monitored from day one" },
          { icon: "network", iconColor: "blue", title: "Scalable", description: "Designed to grow with your portfolio, not your vendor contract" },
          { icon: "wifi", iconColor: "green", title: "Seamless", description: "Consistent performance across every floor, suite, and common area" },
          { icon: "brain", iconColor: "purple", title: "Smart", description: "Data-generating infrastructure that feeds your intelligence layer" },
          { icon: "globe", iconColor: "green", title: "Sustainable", description: "Energy-efficient design that reduces operational overhead" },
        ],
      },
      {
        blockType: "cta",
        style: "primary",
        heading: "Design Your 5S® Wireless",
        description: "Start with a property review to assess your current wireless infrastructure.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "how-we-operate-digital-infrastructure": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "Our Approach",
        heading: "How OpticWise Designs, Implements, and Operates Infrastructure",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "OpticWise is not a bolt-on vendor. We partner with you to design, implement, and operate managed data & digital infrastructure services — and provide the owner-controlled intelligence layer that turns Property Intelligence into Portfolio Intelligence." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "twoLayerModel",
        eyebrow: "The OpticWise Model",
        heading: "Two Layers. One Goal: Owner Control.",
        layer1: {
          tag: "Layer 1",
          title: "Managed Data & Digital Infrastructure",
          subtitle: "The foundation you own",
          items: [
            { bold: "Design:", text: "repeatable standards across properties" },
            { bold: "Implementation:", text: "governance baked in (segmentation, access rules, documentation)" },
            { bold: "Operations:", text: "ongoing digital management to keep performance high and operational risk low" },
          ],
        },
        layer2: {
          tag: "Layer 2",
          title: "Owner-Controlled Intelligence Layer",
          subtitle: "OpticWise Brain",
          formula: [
            { step: "One standard intelligence substrate" },
            { step: "Many decision engines" },
            { step: "Scaled across buildings" },
          ],
        },
      },
      {
        blockType: "cta",
        style: "primary",
        heading: "See How We Operate",
        description: "Schedule a review to understand how managed infrastructure works for your property.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "brains": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "OpticWise Brain",
        heading: "The Vendor-Agnostic Property Intelligence Layer",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "OpticWise Brain is a governed data plane + trust plane that enables autonomous activities and intelligence. It's vendor- and LLM-agnostic — plug in any systems and decision engines you want, and swap them over time." }] },
          { type: "paragraph", children: [{ type: "text", text: "Brain turns Property Intelligence into Portfolio Intelligence: every building's data improves decisions across the portfolio." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "cardGrid",
        eyebrow: "Capabilities",
        heading: "What Brain Enables",
        columns: "3",
        style: "light",
        cards: [
          { icon: "data", iconColor: "blue", title: "Unified Data Plane", description: "All building data — normalized, governed, and accessible in one place" },
          { icon: "shield", iconColor: "green", title: "Trust Plane", description: "Governance that ensures every AI output is auditable and reliable" },
          { icon: "brain", iconColor: "purple", title: "Decision Engines", description: "Plug in any analytics, ML, or AI tool — and swap them without losing data" },
        ],
      },
      {
        blockType: "cta",
        style: "primary",
        heading: "See Brain in Action",
        description: "Schedule a review to see how the intelligence layer works.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "advisory-services": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "Advisory",
        heading: "Strategic Advisory for CRE Owners",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "Not every owner needs a full infrastructure build. Sometimes you need strategic guidance: an independent perspective on your data, digital infrastructure, and AI readiness posture." }] },
          { type: "paragraph", children: [{ type: "text", text: "OpticWise Advisory provides owner-aligned counsel on technology decisions, vendor evaluation, and infrastructure strategy — without selling you a product." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "cardGrid",
        eyebrow: "Services",
        heading: "Advisory Engagements",
        columns: "3",
        style: "light",
        cards: [
          { icon: "building", iconColor: "blue", title: "Infrastructure Strategy", description: "Roadmap for building owner-controlled data & digital infrastructure across your portfolio" },
          { icon: "shield", iconColor: "green", title: "Vendor Evaluation", description: "Independent assessment of vendor proposals, contracts, and technology decisions" },
          { icon: "brain", iconColor: "purple", title: "AI Readiness Assessment", description: "Evaluate your portfolio's readiness for AI — governance, data, and infrastructure" },
        ],
      },
      {
        blockType: "cta",
        style: "primary",
        heading: "Start a Conversation",
        description: "Schedule a complementary review to discuss your advisory needs.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "control-cre-digital-visibility": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "Digital Visibility",
        heading: "Control Your Building's Digital Narrative",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "Your building has a digital presence whether you manage it or not. Tenants, brokers, and investors form impressions based on connectivity quality, smart building capabilities, and digital amenity scores." }] },
          { type: "paragraph", children: [{ type: "text", text: "If you don't control that narrative, someone else defines it for you — often your vendors or your competitors." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "cta",
        style: "primary",
        heading: "Take Control of Your Digital Visibility",
        description: "Start with a review of how your property appears in the digital landscape.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],

    "digital-infrastructure-noi-ai": [
      {
        blockType: "content",
        layout: "default",
        eyebrow: "The Category",
        heading: "Data & Digital Infrastructure for NOI + AI",
        richText: { root: { type: "root", children: [
          { type: "paragraph", children: [{ type: "text", text: "This is the hub for everything related to how data & digital infrastructure drives NOI improvement and AI readiness in commercial real estate. Explore the pillars below." }] },
        ]}},
        backgroundColor: "white",
      },
      {
        blockType: "cardGrid",
        eyebrow: "Explore the Pillars",
        heading: "Owner-Controlled Infrastructure for CRE",
        columns: "3",
        style: "light",
        cards: [
          { icon: "chart-up", iconColor: "blue", title: "NOI Strategy", description: "How data & digital infrastructure drives NOI improvement across portfolios", href: "/digital-infrastructure-noi-strategy" },
          { icon: "shield", iconColor: "blue", title: "NOI Playbook", description: "The PPP 5C™ repeatable framework for compounding NOI", href: "/digital-infrastructure-noi-playbook" },
          { icon: "lightbulb", iconColor: "green", title: "AI-Ready CRE", description: "Properties designed for AI: governance, data, infrastructure", href: "/ai-ready-commercial-real-estate" },
          { icon: "lock", iconColor: "blue", title: "Own vs Lease Data", description: "The economics of data ownership in commercial real estate", href: "/own-vs-lease-cre-building-data" },
          { icon: "globe", iconColor: "purple", title: "Digital Visibility", description: "Control your building's digital narrative", href: "/control-cre-digital-visibility" },
          { icon: "building", iconColor: "blue", title: "PPP Audit™", description: "Map who owns what and where data lives", href: "/ppp-audit" },
        ],
      },
      {
        blockType: "cta",
        style: "primary",
        heading: "Start Your Journey",
        description: "Schedule a complementary review to see where you stand.",
        backgroundImage: ctaBgId || undefined,
        isScheduleReview: true,
        buttonLabel: "Schedule Your Review",
      },
    ],
  };
}

async function main() {
  console.log("=== Payload CMS Full Seed ===\n");
  console.log(`Server: ${BASE}\n`);
  await login();

  // 1. Upload media
  console.log("\n--- Uploading media ---");
  const mediaMap = {};
  for (const { file, alt } of MEDIA_FILES) {
    const filePath = path.join(IMAGES_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP ${file} (file not found)`);
      continue;
    }
    try {
      const existing = await findByAlt(alt);
      if (existing) {
        console.log(`  EXISTS ${file} → id: ${existing.id}`);
        mediaMap[alt] = existing;
        continue;
      }
      const doc = await uploadMedia(filePath, alt);
      console.log(`  OK   ${file} → id: ${doc.id}`);
      mediaMap[alt] = doc;
    } catch (e) {
      console.log(`  ERR  ${file}: ${e.message?.slice(0, 120)}`);
    }
  }

  // 2. Update pages with layout blocks
  console.log("\n--- Updating pages with layout blocks ---");
  const layouts = buildPageLayouts(mediaMap);

  for (const [slug, layout] of Object.entries(layouts)) {
    try {
      const page = await findPageBySlug(slug);
      if (!page) {
        console.log(`  SKIP ${slug} (page not found, creating...)`);
        const pageData = {
          title: slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          slug,
          layout,
          _status: "published",
        };
        await api("POST", "/api/pages", pageData);
        console.log(`  CREATED ${slug}`);
        continue;
      }

      await api("PATCH", `/api/pages/${page.id}`, {
        layout,
        _status: "published",
      });
      console.log(`  OK   ${slug} → ${layout.length} blocks`);
    } catch (e) {
      console.log(`  ERR  ${slug}: ${e.message?.slice(0, 150)}`);
    }
  }

  // 3. Update site settings with logo
  const logoMedia = mediaMap["OpticWise logo"];
  if (logoMedia) {
    console.log("\n--- Updating site settings with logo ---");
    try {
      await api("POST", "/api/globals/site-settings", { logo: logoMedia.id });
      console.log("  OK site settings logo updated");
    } catch (e) {
      console.log(`  ERR: ${e.message?.slice(0, 100)}`);
    }
  }

  console.log("\n========================================");
  console.log("Full seed complete!");
  console.log(`Media uploaded: ${Object.keys(mediaMap).length}`);
  console.log(`Pages updated: ${Object.keys(layouts).length}`);
  console.log("========================================");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
