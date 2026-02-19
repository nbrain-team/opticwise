#!/usr/bin/env node

/**
 * Scrape rendered blog content from opticwise.com using Puppeteer.
 * This handles JavaScript-rendered Strikingly pages.
 * 
 * Usage: npm install puppeteer && node scrape-rendered.js
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const existingData = JSON.parse(fs.readFileSync(path.join(__dirname, "scraped-posts.json"), "utf8"));
const URLS = existingData.posts.map((p) => p.sourceUrl);

async function scrapeBatch(browser, urls, startIdx) {
  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = url.split("/blog/")[1] || "";
    const idx = startIdx + i + 1;
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
      await page.waitForSelector("h1", { timeout: 10000 }).catch(() => {});

      const data = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        const title = h1 ? h1.textContent.trim() : document.title;

        const metaDesc = document.querySelector('meta[name="description"]') || document.querySelector('meta[property="og:description"]');
        const metaDescription = metaDesc ? metaDesc.getAttribute("content") || "" : "";

        const ogImage = document.querySelector('meta[property="og:image"]');
        const featureImage = ogImage ? ogImage.getAttribute("content") || "" : "";

        let html = "";
        const blogContent = document.querySelector(".s-blog-content");
        if (blogContent) {
          html = blogContent.innerHTML;
        } else {
          const article = document.querySelector("article");
          if (article) html = article.innerHTML;
          else {
            const main = document.querySelector("main");
            if (main) html = main.innerHTML;
          }
        }

        html = html.replace(/<script[\s\S]*?<\/script>/gi, "")
                    .replace(/<style[\s\S]*?<\/style>/gi, "");

        return { title, metaDescription, featureImage, htmlContent: html };
      });

      results.push({
        slug,
        originalUrl: `/blog/${slug}`,
        sourceUrl: url,
        ...data,
        scrapedAt: new Date().toISOString(),
      });

      console.log(`[${String(idx).padStart(3)}/${URLS.length}] OK   ${slug.substring(0, 55).padEnd(55)} (${data.htmlContent.length} chars)`);
    } catch (err) {
      console.log(`[${String(idx).padStart(3)}/${URLS.length}] ERR  ${slug.substring(0, 55).padEnd(55)} ${err.message.substring(0, 60)}`);
      
      const existing = existingData.posts.find((p) => p.slug === slug);
      if (existing) results.push(existing);
    } finally {
      await page.close();
    }
  }

  return results;
}

async function main() {
  console.log(`Scraping ${URLS.length} posts with Puppeteer (rendered content)...\n`);

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const allResults = await scrapeBatch(browser, URLS, 0);
  await browser.close();

  const outPath = path.join(__dirname, "scraped-posts.json");
  fs.writeFileSync(outPath, JSON.stringify({
    posts: allResults,
    errors: [],
    scrapedAt: new Date().toISOString(),
    total: allResults.length,
  }, null, 2));

  const avgLen = Math.round(allResults.reduce((s, p) => s + p.htmlContent.length, 0) / allResults.length);
  console.log(`\n========================================`);
  console.log(`Scraped: ${allResults.length}/${URLS.length} posts`);
  console.log(`Avg content length: ${avgLen} chars`);
  console.log(`Saved:   ${outPath}`);
  console.log(`========================================`);
}

main().catch(console.error);
