/**
 * Seed script: imports Ghost CMS content into Payload.
 * 
 * Usage:
 *   DATABASE_URI=postgres://... PAYLOAD_SECRET=... npx tsx scripts/seed.ts
 * 
 * This imports:
 *   1. Blog post categories (tags)
 *   2. Blog posts from scraped-posts.json (with HTML content)
 *   3. Pages defined in the Ghost create-pages.js (12 marketing pages)
 */

import { getPayload } from "payload";
import config from "../src/payload.config";
import * as fs from "fs";
import * as path from "path";

const GHOST_CMS_DIR = path.resolve(__dirname, "../../ghost-cms");

interface ScrapedPost {
  slug: string;
  originalUrl: string;
  sourceUrl: string;
  title: string;
  metaDescription: string;
  featureImage: string;
  htmlContent: string;
  scrapedAt: string;
}

interface SitemapDates {
  [slug: string]: string;
}

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

const PAGES = [
  {
    title: "Data & Digital Infrastructure NOI Strategy",
    slug: "digital-infrastructure-noi-strategy",
    excerpt: "How owner-controlled data & digital infrastructure drives NOI improvement across commercial real estate portfolios.",
  },
  {
    title: "The NOI Playbook — PPP 5C Framework",
    slug: "digital-infrastructure-noi-playbook",
    excerpt: "The PPP 5C repeatable framework for building data & digital infrastructure that compounds NOI over time.",
  },
  {
    title: "PPP Audit — Peak Property Performance Review",
    slug: "ppp-audit",
    excerpt: "A structured review that maps who owns what, where data lives, and where operational burden stacks up vs your KPIs.",
  },
  {
    title: "AI-Ready Commercial Real Estate",
    slug: "ai-ready-commercial-real-estate",
    excerpt: "Properties designed for AI: why governance, data ownership, and digital infrastructure come before any AI tool.",
  },
  {
    title: "Own vs Lease CRE Building Data",
    slug: "own-vs-lease-cre-building-data",
    excerpt: "The economics of data ownership in commercial real estate and why it matters for long-term asset value.",
  },
  {
    title: "Control CRE Digital Visibility",
    slug: "control-cre-digital-visibility",
    excerpt: "Take control of your building's digital narrative before someone else defines it for you.",
  },
  {
    title: "Building of Things (BoT)",
    slug: "bot-building-of-things",
    excerpt: "OpticWise BoT: the owner-controlled IoT and connectivity framework for commercial real estate.",
  },
  {
    title: "5S Wireless Connectivity",
    slug: "5s-wireless-connectivity",
    excerpt: "OpticWise 5S: Secure, Scalable, Seamless, Smart, Sustainable wireless for commercial properties.",
  },
  {
    title: "How We Operate Digital Infrastructure",
    slug: "how-we-operate-digital-infrastructure",
    excerpt: "How OpticWise designs, implements, and operates managed data & digital infrastructure for CRE owners.",
  },
  {
    title: "Brains — Owner-Controlled Intelligence",
    slug: "brains",
    excerpt: "OpticWise Brain: the vendor-agnostic property intelligence layer that turns data into decisions.",
  },
  {
    title: "Advisory Services",
    slug: "advisory-services",
    excerpt: "Strategic advisory for CRE owners navigating data, digital infrastructure, and AI readiness.",
  },
  {
    title: "Data & Digital Infrastructure for NOI + AI",
    slug: "digital-infrastructure-noi-ai",
    excerpt: "The category hub: everything you need to know about how data & digital infrastructure drives NOI and AI readiness.",
  },
];

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

async function main() {
  console.log("Starting Payload seed...\n");

  const payload = await getPayload({ config });

  // 1. Create categories
  console.log("--- Creating categories ---");
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    try {
      const existing = await payload.find({
        collection: "categories",
        where: { slug: { equals: cat.slug } },
        limit: 1,
      });
      if (existing.docs.length > 0) {
        categoryMap[cat.slug] = String(existing.docs[0].id);
        console.log(`  SKIP ${cat.title} (exists)`);
      } else {
        const created = await payload.create({
          collection: "categories",
          data: cat,
        });
        categoryMap[cat.slug] = String(created.id);
        console.log(`  OK   ${cat.title}`);
      }
    } catch (e: any) {
      console.log(`  ERR  ${cat.title}: ${e.message?.slice(0, 80)}`);
    }
  }

  // 2. Create pages
  console.log("\n--- Creating pages ---");
  for (const page of PAGES) {
    try {
      const existing = await payload.find({
        collection: "pages",
        where: { slug: { equals: page.slug } },
        limit: 1,
      });
      if (existing.docs.length > 0) {
        console.log(`  SKIP ${page.slug} (exists)`);
        continue;
      }
      await payload.create({
        collection: "pages",
        data: {
          title: page.title,
          slug: page.slug,
          excerpt: page.excerpt,
          _status: "published",
          layout: [],
        },
      });
      console.log(`  OK   ${page.slug}`);
    } catch (e: any) {
      console.log(`  ERR  ${page.slug}: ${e.message?.slice(0, 80)}`);
    }
  }

  // 3. Import blog posts from scraped-posts.json
  console.log("\n--- Importing blog posts ---");
  const scrapedPath = path.join(GHOST_CMS_DIR, "scraped-posts.json");
  const datesPath = path.join(GHOST_CMS_DIR, "sitemap-dates.json");

  if (!fs.existsSync(scrapedPath)) {
    console.log("  scraped-posts.json not found, skipping blog import.");
  } else {
    const scraped = JSON.parse(fs.readFileSync(scrapedPath, "utf-8"));
    const posts: ScrapedPost[] = scraped.posts || [];

    let dates: SitemapDates = {};
    if (fs.existsSync(datesPath)) {
      dates = JSON.parse(fs.readFileSync(datesPath, "utf-8"));
    }

    let ok = 0, skip = 0, err = 0;

    for (const post of posts) {
      try {
        const existing = await payload.find({
          collection: "posts",
          where: { slug: { equals: post.slug } },
          limit: 1,
        });

        if (existing.docs.length > 0) {
          skip++;
          continue;
        }

        const publishedAt = dates[post.slug] || post.scrapedAt || new Date().toISOString();
        const readingTime = estimateReadingTime(post.htmlContent || "");

        await payload.create({
          collection: "posts",
          data: {
            title: post.title,
            slug: post.slug,
            excerpt: post.metaDescription || null,
            htmlContent: post.htmlContent || null,
            publishedAt,
            readingTime,
            _status: "published",
          },
        });
        ok++;

        if (ok % 10 === 0) {
          console.log(`  Imported ${ok} posts...`);
        }
      } catch (e: any) {
        err++;
        if (err <= 5) {
          console.log(`  ERR  ${post.slug}: ${e.message?.slice(0, 80)}`);
        }
      }
    }

    console.log(`  Done: ${ok} imported, ${skip} skipped, ${err} errors (of ${posts.length} total)`);
  }

  // 4. Create the admin user if none exists
  console.log("\n--- Checking admin user ---");
  const users = await payload.find({ collection: "users", limit: 1 });
  if (users.docs.length === 0) {
    await payload.create({
      collection: "users",
      data: {
        email: "admin@opticwise.com",
        password: "changeme123",
        name: "Admin",
        role: "admin",
      },
    });
    console.log("  Created default admin: admin@opticwise.com / changeme123");
    console.log("  *** CHANGE THIS PASSWORD IMMEDIATELY ***");
  } else {
    console.log("  Admin user already exists.");
  }

  // 5. Seed navigation and site settings globals
  console.log("\n--- Seeding globals ---");
  try {
    await payload.updateGlobal({
      slug: "navigation",
      data: {
        mainNav: [
          { label: "How It Works", href: "/#how-it-works" },
          { label: "Pillars", href: "/digital-infrastructure-noi-ai/" },
          { label: "Insights", href: "/insights/" },
          { label: "FAQ", href: "/faq/" },
          { label: "Advisory", href: "/advisory-services/" },
          { label: "Brains", href: "/brains/" },
        ],
        pillars: [
          { label: "NOI Strategy", href: "/digital-infrastructure-noi-strategy/", desc: "How data & digital infrastructure drives NOI" },
          { label: "NOI Playbook", href: "/digital-infrastructure-noi-playbook/", desc: "PPP 5C\u2122 repeatable framework" },
          { label: "AI-Ready CRE", href: "/ai-ready-commercial-real-estate/", desc: "Properties designed for AI" },
          { label: "Own vs Lease Data", href: "/own-vs-lease-cre-building-data/", desc: "Data ownership economics" },
          { label: "Digital Visibility", href: "/control-cre-digital-visibility/", desc: "Control your narrative" },
        ],
        products: [
          { label: "PPP Audit\u2122", href: "/ppp-audit/" },
          { label: "BoT\u00AE", href: "/bot-building-of-things/" },
          { label: "5S\u00AE Wireless", href: "/5s-wireless-connectivity/" },
        ],
      },
    });
    console.log("  Navigation seeded.");
  } catch (e: any) {
    console.log(`  Navigation seed error: ${e.message?.slice(0, 80)}`);
  }

  try {
    await payload.updateGlobal({
      slug: "site-settings",
      data: {
        siteName: "OpticWise",
        siteUrl: "https://opticwise.com",
        reframingLine: "If you don't own your data & digital infrastructure, your vendors do.",
        closingLine: "Own your data & digital infrastructure. Operate with strategic foresight. Build for the long game.",
        primaryCTA: {
          label: "Complementary CRE Data & Digital Review Session",
          microcopy: "One building. Map who owns what, where data lives, and where operational burden stacks up vs your KPIs.",
          href: "/ppp-audit/",
        },
        footerDescription: "Owner-controlled data & digital infrastructure for commercial real estate.",
      },
    });
    console.log("  Site settings seeded.");
  } catch (e: any) {
    console.log(`  Site settings seed error: ${e.message?.slice(0, 80)}`);
  }

  console.log("\n========================================");
  console.log("Seed complete!");
  console.log("========================================");
  console.log("\nNext steps:");
  console.log("1. Run: npm run dev");
  console.log("2. Go to: http://localhost:3000/admin");
  console.log("3. Log in: admin@opticwise.com / changeme123");
  console.log("4. Edit pages, posts, and site settings in the admin panel");
  console.log("5. View the site: http://localhost:3000");

  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
