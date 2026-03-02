#!/usr/bin/env node

/**
 * Fix blog posts in Ghost:
 * 1. Remove duplicate header/featured image from HTML content
 * 2. Clean up Strikingly spacing artifacts
 * 3. Re-scrape original publication dates from opticwise.com
 * 4. Update all posts in Ghost
 */

const puppeteer = require("puppeteer");
const https = require("https");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const GHOST_URL = process.env.GHOST_ADMIN_URL;
const ADMIN_KEY = process.env.GHOST_ADMIN_KEY;

if (!GHOST_URL || !ADMIN_KEY) {
  console.error("Set GHOST_ADMIN_URL and GHOST_ADMIN_KEY");
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
      let b = "";
      res.on("data", (c) => (b += c));
      res.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve(b); } });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function cleanHtml(html) {
  let cleaned = html;

  // Remove the entire s-blog-header div (contains duplicate featured image + H1)
  cleaned = cleaned.replace(/<div class="s-blog-header">[\s\S]*?<\/div>\s*<div class="s-blog-body/i, '<div class="s-blog-body');

  // If that didn't match, try removing everything before s-blog-body
  const bodyIdx = cleaned.indexOf('s-blog-body');
  if (bodyIdx > 500) {
    const divStart = cleaned.lastIndexOf('<div', bodyIdx);
    if (divStart > 0) cleaned = cleaned.substring(divStart);
  }

  // Remove Strikingly navigation/subscribe/cookie elements
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*s-blog-subscribe[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, "");
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*s-blog-nav[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, "");
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*cookie[^"]*"[^>]*>[\s\S]*$/gi, "");

  // Remove empty divs and excessive wrapper divs
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*waypoint[^"]*"[^>]*><\/div>/gi, "");
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*blurred-layer[^"]*"[^>]*><\/div>/gi, "");

  // Clean up Strikingly-specific attributes
  cleaned = cleaned.replace(/\s+data-react-style="[^"]*"/gi, "");
  cleaned = cleaned.replace(/\s+data-bg="[^"]*"/gi, "");
  cleaned = cleaned.replace(/\s+data-reactid="[^"]*"/gi, "");

  // Fix image URLs: ensure they start with https://
  cleaned = cleaned.replace(/src="\/\//g, 'src="https://');
  cleaned = cleaned.replace(/url\(\/\//g, "url(https://");

  // Remove excessive inline styles that cause spacing issues
  cleaned = cleaned.replace(/style="white-space:\s*pre-wrap"/gi, "");
  cleaned = cleaned.replace(/style="display:\s*block;\s*"/gi, "");

  // Clean up nested empty paragraph wrappers: <p class="s-rich-text-wrapper"><br></p>
  cleaned = cleaned.replace(/<p[^>]*class="[^"]*s-rich-text-wrapper[^"]*"[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "");

  // Remove redundant s-rich-text-wrapper divs/spans (keep inner content)
  cleaned = cleaned.replace(/<div class="s-rich-text-wrapper"[^>]*>([\s\S]*?)<\/div>/gi, "$1");
  cleaned = cleaned.replace(/<span class="s-rich-text-wrapper"[^>]*>([\s\S]*?)<\/span>/gi, "$1");

  // Remove empty paragraphs that cause gaps
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p>\s*&nbsp;\s*<\/p>/gi, "");

  // Remove double <br> tags
  cleaned = cleaned.replace(/(<br\s*\/?>)\s*(<br\s*\/?>)/gi, "<br>");

  // Remove Strikingly component wrapper classes but keep content
  cleaned = cleaned.replace(/class="[^"]*s-component[^"]*"/gi, "");
  cleaned = cleaned.replace(/class="[^"]*s-font-[^"]*"/gi, "");
  cleaned = cleaned.replace(/class="[^"]*s-text-color[^"]*"/gi, "");

  // Clean up class="" (empty class attributes)
  cleaned = cleaned.replace(/\s+class=""/gi, "");
  cleaned = cleaned.replace(/\s+class="\s+"/gi, "");

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
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

async function scrapeDates(browser, posts) {
  console.log("\n--- Phase 1: Scraping original publication dates ---\n");
  const dates = {};
  const total = posts.length;

  for (let i = 0; i < total; i++) {
    const post = posts[i];
    const url = `https://www.opticwise.com/blog/${post.slug}`;
    const progress = `[${String(i + 1).padStart(3)}/${total}]`;

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      const dateStr = await page.evaluate(() => {
        // Look for date in meta tags
        const pubDate = document.querySelector('meta[property="article:published_time"]');
        if (pubDate) return pubDate.getAttribute("content");

        const ogDate = document.querySelector('meta[property="og:updated_time"]');
        if (ogDate) return ogDate.getAttribute("content");

        // Look for visible date text on the page
        const dateEl = document.querySelector(".s-blog-date, .blog-date, time, [datetime]");
        if (dateEl) return dateEl.textContent || dateEl.getAttribute("datetime");

        // Look for date patterns in blog info area
        const blogInfo = document.querySelector(".s-blog-info");
        if (blogInfo) {
          const text = blogInfo.textContent;
          const match = text.match(/(\w+ \d{1,2},? \d{4})/);
          if (match) return match[1];
        }

        // Search all text for date patterns
        const body = document.body.textContent;
        const patterns = [
          /(\d{4}-\d{2}-\d{2})/,
          /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4})/,
        ];
        for (const p of patterns) {
          const m = body.match(p);
          if (m) return m[1];
        }

        return null;
      });

      if (dateStr) {
        dates[post.slug] = dateStr;
        console.log(`${progress} DATE ${post.slug.substring(0, 50).padEnd(50)} ${dateStr}`);
      } else {
        console.log(`${progress} NONE ${post.slug.substring(0, 50).padEnd(50)} (no date found)`);
      }

      await page.close();
    } catch (err) {
      console.log(`${progress} ERR  ${post.slug.substring(0, 50).padEnd(50)} ${err.message.substring(0, 40)}`);
    }
  }

  return dates;
}

async function main() {
  const dataPath = path.join(__dirname, "scraped-posts.json");
  const { posts } = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  console.log(`Processing ${posts.length} posts...\n`);

  // Phase 1: Scrape dates
  console.log("Launching Puppeteer for date scraping...");
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const dates = await scrapeDates(browser, posts);
  await browser.close();

  console.log(`\nFound dates for ${Object.keys(dates).length}/${posts.length} posts`);

  // Save dates to file for reference
  fs.writeFileSync(path.join(__dirname, "scraped-dates.json"), JSON.stringify(dates, null, 2));

  // Phase 2: Get existing Ghost posts to get their IDs and updated_at
  console.log("\n--- Phase 2: Fetching Ghost post IDs ---\n");
  const ghostPosts = await ghostRequest("GET", "posts/?limit=all&fields=id,slug,updated_at");
  if (!ghostPosts.posts) {
    console.error("Failed to fetch Ghost posts:", JSON.stringify(ghostPosts).substring(0, 200));
    process.exit(1);
  }

  const ghostMap = {};
  for (const gp of ghostPosts.posts) {
    ghostMap[gp.slug] = { id: gp.id, updated_at: gp.updated_at };
  }
  console.log(`Found ${Object.keys(ghostMap).length} posts in Ghost`);

  // Phase 3: Clean HTML and update posts
  console.log("\n--- Phase 3: Cleaning HTML and updating Ghost ---\n");

  let ok = 0, err = 0, skip = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const progress = `[${String(i + 1).padStart(3)}/${posts.length}]`;
    const ghost = ghostMap[post.slug];

    if (!ghost) {
      console.log(`${progress} SKIP ${post.slug.substring(0, 50)} (not in Ghost)`);
      skip++;
      continue;
    }

    const cleanedHtml = cleanHtml(post.htmlContent);
    const dateVal = dates[post.slug];
    let publishedAt = undefined;
    if (dateVal) {
      try {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) publishedAt = d.toISOString();
      } catch {}
    }

    try {
      const result = await ghostRequest("PUT", `posts/${ghost.id}/`, {
        posts: [{
          mobiledoc: htmlToMobiledoc(cleanedHtml),
          updated_at: ghost.updated_at,
          ...(publishedAt ? { published_at: publishedAt } : {}),
        }],
      });

      if (result.posts) {
        ok++;
        const dateInfo = publishedAt ? publishedAt.substring(0, 10) : "no date";
        console.log(`${progress} OK   ${post.slug.substring(0, 50).padEnd(50)} (${dateInfo})`);
      } else {
        err++;
        const msg = result.errors?.[0]?.message || JSON.stringify(result).substring(0, 80);
        console.log(`${progress} ERR  ${post.slug.substring(0, 50)} ${msg.substring(0, 60)}`);
      }
    } catch (e) {
      err++;
      console.log(`${progress} ERR  ${post.slug.substring(0, 50)} ${e.message.substring(0, 60)}`);
    }

    if (i < posts.length - 1) await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n========================================`);
  console.log(`Updated: ${ok}/${posts.length}`);
  console.log(`Errors:  ${err}`);
  console.log(`Skipped: ${skip}`);
  console.log(`Dates found: ${Object.keys(dates).length}`);
  console.log(`========================================`);
}

main().catch(console.error);
