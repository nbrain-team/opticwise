#!/usr/bin/env node

/**
 * Import OpticWise content into Ghost CMS
 * 
 * Usage:
 *   GHOST_ADMIN_URL=https://your-ghost.onrender.com \
 *   GHOST_ADMIN_KEY=your-admin-api-key \
 *   node import-content.js
 * 
 * Get your Admin API key from Ghost Admin > Settings > Integrations > Add custom integration
 */

const https = require("https");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const GHOST_URL = process.env.GHOST_ADMIN_URL;
const ADMIN_KEY = process.env.GHOST_ADMIN_KEY;

if (!GHOST_URL || !ADMIN_KEY) {
  console.error("Set GHOST_ADMIN_URL and GHOST_ADMIN_KEY environment variables");
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

async function ghostRequest(method, endpoint, body) {
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

const PAGES_DIR = path.join(__dirname, "..", "website-v2", "content", "pages");
const INSIGHTS_DIR = path.join(__dirname, "..", "website-v2", "content", "insights");

function readMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    const meta = {};
    fmMatch[1].split("\n").forEach((line) => {
      const m = line.match(/^(\w+):\s*"?([^"]*)"?$/);
      if (m) meta[m[1]] = m[2];
    });
    return { meta, content: fmMatch[2].trim() };
  }
  return { meta: {}, content: raw.trim() };
}

function mdToMobiledoc(markdown) {
  return JSON.stringify({
    version: "0.3.1",
    markups: [],
    atoms: [],
    cards: [["markdown", { markdown }]],
    sections: [[10, 0]],
  });
}

const PAGE_FILES = [
  { file: "home.md", slug: "home", title: "Home" },
  { file: "digital-infrastructure-noi-ai.md", slug: "digital-infrastructure-noi-ai", title: "Data & Digital Infrastructure, NOI, and AI" },
  { file: "digital-infrastructure-noi-strategy.md", slug: "digital-infrastructure-noi-strategy", title: "NOI Strategy" },
  { file: "digital-infrastructure-noi-playbook.md", slug: "digital-infrastructure-noi-playbook", title: "NOI Playbook" },
  { file: "cre-ai-readiness.md", slug: "cre-ai-readiness", title: "CRE AI Readiness" },
  { file: "ai-ready-commercial-real-estate.md", slug: "ai-ready-commercial-real-estate", title: "AI-Ready Commercial Real Estate" },
  { file: "own-vs-lease-cre-building-data.md", slug: "own-vs-lease-cre-building-data", title: "Own vs Lease CRE Building Data" },
  { file: "control-cre-digital-visibility.md", slug: "control-cre-digital-visibility", title: "Control of CRE Digital Visibility" },
  { file: "bot-building-of-things.md", slug: "bot-building-of-things", title: "BoT (Building of Things)" },
  { file: "5s-wireless-connectivity.md", slug: "5s-wireless-connectivity", title: "5S Wireless Connectivity" },
  { file: "ppp-audit.md", slug: "ppp-audit", title: "PPP Audit" },
  { file: "how-we-operate-digital-infrastructure.md", slug: "how-we-operate-digital-infrastructure", title: "How We Operate" },
  { file: "faq.md", slug: "faq", title: "FAQ" },
  { file: "insights.md", slug: "insights", title: "Insights" },
];

async function importAll() {
  console.log("Importing pages...\n");

  for (const page of PAGE_FILES) {
    const filePath = path.join(PAGES_DIR, page.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP ${page.file} (not found)`);
      continue;
    }
    const { content } = readMarkdown(filePath);
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : page.title;

    const result = await ghostRequest("POST", "pages/", {
      pages: [{
        title,
        slug: page.slug,
        mobiledoc: mdToMobiledoc(content),
        status: "published",
      }],
    });

    if (result.pages) {
      console.log(`  OK   ${page.slug} -> "${title}"`);
    } else {
      console.log(`  ERR  ${page.slug}: ${JSON.stringify(result.errors?.[0]?.message || result).substring(0, 120)}`);
    }
  }

  console.log("\nImporting tags...");
  const tags = [
    { name: "NOI growth", slug: "noi-growth" },
    { name: "Tenant experience outcomes", slug: "tenant-experience" },
    { name: "Operational control", slug: "operational-control" },
    { name: "Future-proofing / AI readiness", slug: "ai-readiness" },
  ];
  for (const tag of tags) {
    const result = await ghostRequest("POST", "tags/", { tags: [tag] });
    if (result.tags) console.log(`  OK   tag: ${tag.name}`);
    else console.log(`  ERR  tag ${tag.name}: ${JSON.stringify(result.errors?.[0]?.message || "").substring(0, 80)}`);
  }

  console.log("\nImporting insight posts...");
  const insightFiles = fs.readdirSync(INSIGHTS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of insightFiles) {
    const { meta, content } = readMarkdown(path.join(INSIGHTS_DIR, file));
    const title = meta.title || file.replace(".md", "");
    const slug = meta.slug || file.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");

    const result = await ghostRequest("POST", "posts/", {
      posts: [{
        title,
        slug,
        mobiledoc: mdToMobiledoc(content),
        status: "published",
        published_at: meta.date ? new Date(meta.date).toISOString() : undefined,
        tags: meta.category ? [{ name: meta.category }] : [],
        custom_excerpt: meta.description || undefined,
      }],
    });

    if (result.posts) {
      console.log(`  OK   post: "${title}"`);
    } else {
      console.log(`  ERR  post "${title}": ${JSON.stringify(result.errors?.[0]?.message || result).substring(0, 120)}`);
    }
  }

  console.log("\nDone! Content imported into Ghost.");
}

importAll().catch((err) => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
