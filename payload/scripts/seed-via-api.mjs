/**
 * Seed script that uses Payload REST API (no TypeScript/import issues).
 * 
 * Usage:
 *   PAYLOAD_URL=https://opticwise-payload.onrender.com \
 *   PAYLOAD_EMAIL=danny@nbrain.ai \
 *   PAYLOAD_PASSWORD=Tm0bile#88 \
 *   node scripts/seed-via-api.mjs
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
    throw new Error(`${method} ${endpoint} → ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return { status: res.status, data: json };
}

async function login() {
  const { data } = await api("POST", "/api/users/login", { email: EMAIL, password: PASSWORD });
  TOKEN = data.token;
  console.log("Logged in as", data.user?.email);
}

async function exists(collection, slug) {
  const { data } = await api("GET", `/api/${collection}?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`);
  return data.docs && data.docs.length > 0;
}

// ── Categories ──────────────────────────────────────────────
const CATEGORIES = [
  { title: "NOI Growth", slug: "noi-growth" },
  { title: "Tenant Experience", slug: "tenant-experience" },
  { title: "Operational Control", slug: "operational-control" },
  { title: "AI Readiness", slug: "ai-readiness" },
  { title: "Digital Infrastructure", slug: "digital-infrastructure" },
  { title: "Data Ownership", slug: "data-ownership" },
  { title: "Smart Buildings", slug: "smart-buildings" },
  { title: "CRE Strategy", slug: "cre-strategy" },
];

// ── Pages ───────────────────────────────────────────────────
const PAGES = [
  { title: "Data & Digital Infrastructure NOI Strategy", slug: "digital-infrastructure-noi-strategy", excerpt: "How owner-controlled data & digital infrastructure drives NOI improvement across commercial real estate portfolios." },
  { title: "The NOI Playbook — PPP 5C Framework", slug: "digital-infrastructure-noi-playbook", excerpt: "The PPP 5C repeatable framework for building data & digital infrastructure that compounds NOI over time." },
  { title: "PPP Audit — Peak Property Performance Review", slug: "ppp-audit", excerpt: "A structured review that maps who owns what, where data lives, and where operational burden stacks up vs your KPIs." },
  { title: "AI-Ready Commercial Real Estate", slug: "ai-ready-commercial-real-estate", excerpt: "Properties designed for AI: why governance, data ownership, and digital infrastructure come before any AI tool." },
  { title: "Own vs Lease CRE Building Data", slug: "own-vs-lease-cre-building-data", excerpt: "The economics of data ownership in commercial real estate and why it matters for long-term asset value." },
  { title: "Control CRE Digital Visibility", slug: "control-cre-digital-visibility", excerpt: "Take control of your building's digital narrative before someone else defines it for you." },
  { title: "Building of Things (BoT)", slug: "bot-building-of-things", excerpt: "OpticWise BoT: the owner-controlled IoT and connectivity framework for commercial real estate." },
  { title: "5S Wireless Connectivity", slug: "5s-wireless-connectivity", excerpt: "OpticWise 5S: Secure, Scalable, Seamless, Smart, Sustainable wireless for commercial properties." },
  { title: "How We Operate Digital Infrastructure", slug: "how-we-operate-digital-infrastructure", excerpt: "How OpticWise designs, implements, and operates managed data & digital infrastructure for CRE owners." },
  { title: "Brains — Owner-Controlled Intelligence", slug: "brains", excerpt: "OpticWise Brain: the vendor-agnostic property intelligence layer that turns data into decisions." },
  { title: "Advisory Services", slug: "advisory-services", excerpt: "Strategic advisory for CRE owners navigating data, digital infrastructure, and AI readiness." },
  { title: "Data & Digital Infrastructure for NOI + AI", slug: "digital-infrastructure-noi-ai", excerpt: "The category hub: everything you need to know about how data & digital infrastructure drives NOI and AI readiness." },
];

function estimateReadingTime(html) {
  const text = (html || "").replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

async function main() {
  console.log("=== Payload CMS Seed (via REST API) ===\n");
  console.log(`Server: ${BASE}\n`);

  await login();

  // 1. Categories
  console.log("\n--- Creating categories ---");
  for (const cat of CATEGORIES) {
    try {
      if (await exists("categories", cat.slug)) {
        console.log(`  SKIP ${cat.title}`);
        continue;
      }
      await api("POST", "/api/categories", cat);
      console.log(`  OK   ${cat.title}`);
    } catch (e) {
      console.log(`  ERR  ${cat.title}: ${e.message?.slice(0, 100)}`);
    }
  }

  // 2. Pages
  console.log("\n--- Creating pages ---");
  for (const page of PAGES) {
    try {
      if (await exists("pages", page.slug)) {
        console.log(`  SKIP ${page.slug}`);
        continue;
      }
      await api("POST", "/api/pages", {
        title: page.title,
        slug: page.slug,
        excerpt: page.excerpt,
        _status: "published",
        layout: [],
      });
      console.log(`  OK   ${page.slug}`);
    } catch (e) {
      console.log(`  ERR  ${page.slug}: ${e.message?.slice(0, 100)}`);
    }
  }

  // 3. Blog posts from Ghost CMS scraped data
  console.log("\n--- Importing blog posts ---");
  const ghostDir = path.resolve(__dirname, "../../ghost-cms");
  const scrapedPath = path.join(ghostDir, "scraped-posts.json");
  const datesPath = path.join(ghostDir, "sitemap-dates.json");

  if (!fs.existsSync(scrapedPath)) {
    console.log("  scraped-posts.json not found, skipping.");
  } else {
    const scraped = JSON.parse(fs.readFileSync(scrapedPath, "utf-8"));
    const posts = scraped.posts || [];

    let dates = {};
    if (fs.existsSync(datesPath)) {
      dates = JSON.parse(fs.readFileSync(datesPath, "utf-8"));
    }

    let ok = 0, skip = 0, errCount = 0;

    for (const post of posts) {
      try {
        if (await exists("posts", post.slug)) {
          skip++;
          continue;
        }

        const publishedAt = dates[post.slug] || post.scrapedAt || new Date().toISOString();
        const readingTime = estimateReadingTime(post.htmlContent);

        await api("POST", "/api/posts", {
          title: post.title,
          slug: post.slug,
          excerpt: post.metaDescription || undefined,
          htmlContent: post.htmlContent || undefined,
          publishedAt,
          readingTime,
          _status: "published",
        });
        ok++;
        if (ok % 10 === 0) console.log(`  Imported ${ok} posts...`);
      } catch (e) {
        errCount++;
        if (errCount <= 5) console.log(`  ERR  ${post.slug}: ${e.message?.slice(0, 120)}`);
      }
    }
    console.log(`  Done: ${ok} imported, ${skip} skipped, ${errCount} errors (of ${posts.length} total)`);
  }

  // 4. Seed navigation global
  console.log("\n--- Seeding navigation ---");
  try {
    await api("POST", "/api/globals/navigation", {
      mainNav: [
        { label: "How It Works", href: "/#how-it-works" },
        { label: "Pillars", href: "/digital-infrastructure-noi-ai" },
        { label: "Insights", href: "/insights" },
        { label: "FAQ", href: "/faq" },
        { label: "Advisory", href: "/advisory-services" },
        { label: "Brains", href: "/brains" },
      ],
      pillars: [
        { label: "NOI Strategy", href: "/digital-infrastructure-noi-strategy", desc: "How data & digital infrastructure drives NOI" },
        { label: "NOI Playbook", href: "/digital-infrastructure-noi-playbook", desc: "PPP 5C\u2122 repeatable framework" },
        { label: "AI-Ready CRE", href: "/ai-ready-commercial-real-estate", desc: "Properties designed for AI" },
        { label: "Own vs Lease Data", href: "/own-vs-lease-cre-building-data", desc: "Data ownership economics" },
        { label: "Digital Visibility", href: "/control-cre-digital-visibility", desc: "Control your narrative" },
      ],
      products: [
        { label: "PPP Audit\u2122", href: "/ppp-audit" },
        { label: "BoT\u00AE", href: "/bot-building-of-things" },
        { label: "5S\u00AE Wireless", href: "/5s-wireless-connectivity" },
      ],
    });
    console.log("  Navigation seeded.");
  } catch (e) {
    console.log(`  Navigation error: ${e.message?.slice(0, 100)}`);
  }

  // 5. Seed site settings global
  console.log("\n--- Seeding site settings ---");
  try {
    await api("POST", "/api/globals/site-settings", {
      siteName: "OpticWise",
      siteUrl: "https://opticwise.com",
      reframingLine: "If you don\u2019t own your data & digital infrastructure, your vendors do.",
      closingLine: "Own your data & digital infrastructure. Operate with strategic foresight. Build for the long game.",
      primaryCTA: {
        label: "Complementary CRE Data & Digital Review Session",
        microcopy: "One building. Map who owns what, where data lives, and where operational burden stacks up vs your KPIs.",
        href: "/ppp-audit",
      },
      footerDescription: "Owner-controlled data & digital infrastructure for commercial real estate.",
    });
    console.log("  Site settings seeded.");
  } catch (e) {
    console.log(`  Site settings error: ${e.message?.slice(0, 100)}`);
  }

  console.log("\n========================================");
  console.log("Seed complete!");
  console.log("========================================");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
