#!/usr/bin/env node

/**
 * Scrape all OpticWise blog posts from the live Strikingly site.
 * Extracts: title, slug, meta description, featured image, HTML content, categories.
 * Saves to scraped-posts.json
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const URLS = [
  "https://www.opticwise.com/blog/5-genius-ways-smart-building-tech-elevates-tenant-experience",
  "https://www.opticwise.com/blog/advanced-iot-device-management-strategies",
  "https://www.opticwise.com/blog/ai-governance-is-now-a-cre-risk-category-are-you-exposed",
  "https://www.opticwise.com/blog/ai-in-commercial-real-estate-innovation-ethics-and-the-new-regulatory",
  "https://www.opticwise.com/blog/ai-iot-modern-commercial-real-estate-management",
  "https://www.opticwise.com/blog/ai-isn-t-the-future-it-s-today-why-your-digital-infrastructure-must",
  "https://www.opticwise.com/blog/ai-needs-a-nervous-system-why-digital-infrastructure-is-the-real-enabler",
  "https://www.opticwise.com/blog/ai-revolutionizing-commercial-property-security-beyond-surveillance",
  "https://www.opticwise.com/blog/ai-s-new-landlords-why-the-physical-layer-matters-more-than-ever",
  "https://www.opticwise.com/blog/artificial-intelligence-in-commercial-real-estate",
  "https://www.opticwise.com/blog/before-ai-you-need-data-you-actually-own",
  "https://www.opticwise.com/blog/benefits-of-intelligent-building-management-for-multi-family-communities",
  "https://www.opticwise.com/blog/best-practices-in-building-management",
  "https://www.opticwise.com/blog/bringing-systems-together-the-coordination-step-in-the-five-c-s",
  "https://www.opticwise.com/blog/building-automation-systems-future-of-smart-buildings",
  "https://www.opticwise.com/blog/building-intelligence-solutions-next-generation-real-estate",
  "https://www.opticwise.com/blog/building-management-systems-security-connectivity",
  "https://www.opticwise.com/blog/built-to-last-why-smart-infrastructure-is-the-backbone-of-future-proof",
  "https://www.opticwise.com/blog/clarify-the-first-step-to-peak-property-performance",
  "https://www.opticwise.com/blog/clarity-changes-how-much-control-you-realize-you-actually-have",
  "https://www.opticwise.com/blog/collect-unlocking-the-value-hidden-in-your-building-s-data",
  "https://www.opticwise.com/blog/commercial-real-estate-technology",
  "https://www.opticwise.com/blog/connect-creating-the-flow-that-unlocks-your-building-s-potential",
  "https://www.opticwise.com/blog/cre-owners-are-the-data-stewards-whether-you-know-it-or-not",
  "https://www.opticwise.com/blog/cre-tech-revolution-data-driven-properties",
  "https://www.opticwise.com/blog/cretech-2025-the-ai-illusion-and-the-next-wave-no-one-s-talking-about",
  "https://www.opticwise.com/blog/data-infrastructure-the-engine-behind-modern-cre-operations",
  "https://www.opticwise.com/blog/data-lake-not-data-swamp-structuring-what-you-collect",
  "https://www.opticwise.com/blog/digital-first-strategy-the-only-competitive-edge-that-lasts",
  "https://www.opticwise.com/blog/digital-infrastructure-commercial-real-estate",
  "https://www.opticwise.com/blog/digital-infrastructure-first-series-part-1-digital-infrastructure-is-the",
  "https://www.opticwise.com/blog/digital-infrastructure-isn-t-just-wi-fi-it-s-the-nervous-system-of-your-property",
  "https://www.opticwise.com/blog/digital-infrastructure-office-residential-conversions",
  "https://www.opticwise.com/blog/digital-twins-revolutionizing-commercial-real-estate",
  "https://www.opticwise.com/blog/enhancing-tenant-s-lives-with-opticwise-5s-a-seamless-secure-smart-and-5dcfd434-d48c-4e44-855c-eae5f2b6531f",
  "https://www.opticwise.com/blog/from-amenities-to-expectations-on-demand-connectivity-as-a-cre-necessity",
  "https://www.opticwise.com/blog/from-data-to-decisions-what-cre-can-learn-from-cortland-s-product-mindset",
  "https://www.opticwise.com/blog/from-liability-to-leadership-how-cre-data-unlocks-value-in-at-risk-assets",
  "https://www.opticwise.com/blog/from-wifi-to-wealth-the-hidden-profit-in-connectivity",
  "https://www.opticwise.com/blog/future-cre-operations-intelligent-building-systems",
  "https://www.opticwise.com/blog/future-proof-network-digital-era",
  "https://www.opticwise.com/blog/how-artificial-intelligence-in-real-estate-is-revolutionizing-the-industry",
  "https://www.opticwise.com/blog/how-building-intelligence-drives-sustainable-work-environments",
  "https://www.opticwise.com/blog/how-digital-infrastructure-shapes-modern-business",
  "https://www.opticwise.com/blog/how-intelligent-buildings-revolutionize-multi-family-living",
  "https://www.opticwise.com/blog/how-one-operator-cut-120k-in-opex-with-a-single-upgrade",
  "https://www.opticwise.com/blog/how-one-portfolio-used-ai-to-cut-utility-spend-double-digits",
  "https://www.opticwise.com/blog/how-smart-tech-is-shattering-modern-boundaries",
  "https://www.opticwise.com/blog/how-smart-technology-enhances-tenant-experience-commercial-real-estate",
  "https://www.opticwise.com/blog/how-technology-is-transforming-real-estate-management",
  "https://www.opticwise.com/blog/if-your-building-sold-tomorrow-would-the-data-be-included",
  "https://www.opticwise.com/blog/impact-cre-technology-real-estate",
  "https://www.opticwise.com/blog/integrating-iot-smarter-safer-cre-building-management",
  "https://www.opticwise.com/blog/intelligent-buildings-investment-trend",
  "https://www.opticwise.com/blog/invisible-guardians-redefining-privacy-in-commercial-real-estate",
  "https://www.opticwise.com/blog/invisible-workforce-iot-networks-running-cre",
  "https://www.opticwise.com/blog/iot-networks-operational-efficiency-commercial-real-estate",
  "https://www.opticwise.com/blog/kpi-first-infrastructure-the-missing-link-between-data-and-real-estate",
  "https://www.opticwise.com/blog/leveraging-data-analytics-optimize-commercial-real-estate-assets",
  "https://www.opticwise.com/blog/mastering-control-the-final-c-in-the-5c-framework",
  "https://www.opticwise.com/blog/monetize-like-amazon-analyze-like-google-and-avoid-tesla-s-data-missteps",
  "https://www.opticwise.com/blog/network-compliance-multi-tenant-commercial-properties",
  "https://www.opticwise.com/blog/network-resilience-smart-building-success",
  "https://www.opticwise.com/blog/not-just-smart-strategic-buildings-built-for-better-tenancy",
  "https://www.opticwise.com/blog/opticwise-building-intelligence-commercial-real-estate",
  "https://www.opticwise.com/blog/organizational-pencils-why-agility-not-perfection-will-win-in-2026",
  "https://www.opticwise.com/blog/own-the-digital-infrastructure-own-the-leverage",
  "https://www.opticwise.com/blog/own-your-buildings-digital-infrastructure-or-be-owned-by-it",
  "https://www.opticwise.com/blog/part-2-what-cre-gets-wrong-about-tenant-experience-hint-it-s-not-a-smart",
  "https://www.opticwise.com/blog/part-3-esg-illusion-why-ai-dashboards-alone-won-t-deliver-sustainable-results",
  "https://www.opticwise.com/blog/part-4-the-coming-regulation-wave-why-cre-must-prepare-for-ethical-ai-now",
  "https://www.opticwise.com/blog/part-5-cre-s-digital-divide-why-infrastructure-ownership-determines-ai",
  "https://www.opticwise.com/blog/proactive-cybersecurity-smart-building-tech-keeps-tenants-safe",
  "https://www.opticwise.com/blog/reframing-cre-strategy-stop-playing-to-win-start-building-to-endure",
  "https://www.opticwise.com/blog/resolute-building-intelligence-commercial-real-estate-management",
  "https://www.opticwise.com/blog/smart-access-workspace-optimization-modern-space-as-a-service",
  "https://www.opticwise.com/blog/smart-building-technology-enhances-tenant-experience",
  "https://www.opticwise.com/blog/smart-security-future-access-control-protection",
  "https://www.opticwise.com/blog/soaring-above-rest-opticwise-cre-thrive-flight-quality-era",
  "https://www.opticwise.com/blog/streamlining-property-management-data-solutions",
  "https://www.opticwise.com/blog/the-800k-conversation-developers-keep-missing",
  "https://www.opticwise.com/blog/the-case-for-a-digital-architect-why-cre-property-managers-are-drowning-in",
  "https://www.opticwise.com/blog/the-cost-of-doing-nothing-what-you-lose-by-letting-the-isp-build-your-network",
  "https://www.opticwise.com/blog/the-data-revolution-in-commercial-real-estate-why-digital-infrastructure",
  "https://www.opticwise.com/blog/the-genai-divide-what-cre-leaders-must-know-before-falling-behind",
  "https://www.opticwise.com/blog/the-hidden-cost-of-vendor-sprawl-and-what-to-do-about-it",
  "https://www.opticwise.com/blog/the-hidden-roi-of-digital-infrastructure-ownership-in-commercial-real-estate",
  "https://www.opticwise.com/blog/the-hidden-tech-debt-you-won-t-catch-in-the-code",
  "https://www.opticwise.com/blog/the-operator-s-guide-to-autonomous-buildings",
  "https://www.opticwise.com/blog/the-post-pandemic-office-isn-t-smaller-it-s-smarter",
  "https://www.opticwise.com/blog/transforming-spaces-smart-building-technology",
  "https://www.opticwise.com/blog/transitioning-to-digital-first-commercial-real-estate-portfolio-owners",
  "https://www.opticwise.com/blog/trust-at-first-sight-data-dictionaries-refresh-stamps-and-adoption",
  "https://www.opticwise.com/blog/tthe-hidden-cap-rate-enhancer-no-one-talks-about",
  "https://www.opticwise.com/blog/what-23andme-s-256m-data-sale-means-for-commercial-real-estate",
  "https://www.opticwise.com/blog/what-ai-is-doing-to-apartment-demand-and-how-buildings-must-respond",
  "https://www.opticwise.com/blog/what-is-digital-infrastructure-commercial-real-estate",
  "https://www.opticwise.com/blog/what-s-your-smart-building-strategy-or-are-you-guessing",
  "https://www.opticwise.com/blog/what-starbucks-taught-us-about-smart-property-ops",
  "https://www.opticwise.com/blog/what-swedish-beach-volleyball-can-teach-you-about-cre-strategy",
  "https://www.opticwise.com/blog/who-s-making-480k-year-off-your-tenants-hint-it-s-not-you",
  "https://www.opticwise.com/blog/why-98-of-property-owners-are-leaving-money-on-the-table",
  "https://www.opticwise.com/blog/why-owning-your-cre-digital-infrastructure-is-essential-for-long-term-success",
  "https://www.opticwise.com/blog/why-power-and-not-just-square-footage-is-the-future-of-smart-buildings",
  "https://www.opticwise.com/blog/why-redundant-networks-are-silent-killers",
  "https://www.opticwise.com/blog/why-smart-buildings-fail-without-a-unified-data-layer-and-how-to-fix-it",
  "https://www.opticwise.com/blog/wi-fi-is-not-a-utility-it-s-an-investment-signal",
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; OpticWise-Migrator/1.0)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve(body));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function extract(html, url) {
  const slug = url.split("/blog/")[1] || "";
  const originalUrl = `/blog/${slug}`;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s*[-|]\s*OpticWise.*$/i, "").replace(/\s*[-|]\s*Optic Wise.*$/i, "").trim() : slug;

  const metaDescMatch = html.match(/<meta\s+(?:name|property)=["'](?:description|og:description)["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:name|property)=["'](?:description|og:description)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

  const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
  const featureImage = ogImageMatch ? ogImageMatch[1].trim() : "";

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : title;

  let content = "";
  const blogContentMatch = html.match(/<div[^>]*class="[^"]*s-blog-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i)
    || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  if (blogContentMatch) {
    content = blogContentMatch[1].trim();
  } else {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) content = mainMatch[1].trim();
  }

  if (!content) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      let body = bodyMatch[1];
      body = body.replace(/<nav[\s\S]*?<\/nav>/gi, "");
      body = body.replace(/<header[\s\S]*?<\/header>/gi, "");
      body = body.replace(/<footer[\s\S]*?<\/footer>/gi, "");
      body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
      body = body.replace(/<style[\s\S]*?<\/style>/gi, "");

      const h1Pos = body.indexOf("<h1");
      if (h1Pos > -1) {
        content = body.substring(h1Pos);
        const subscribePos = content.toLowerCase().indexOf("subscribe");
        if (subscribePos > 200) content = content.substring(0, subscribePos);
        const prevPos = content.toLowerCase().indexOf('previous');
        if (prevPos > 200) content = content.substring(0, prevPos);
      }
    }
  }

  content = content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    slug,
    originalUrl,
    sourceUrl: url,
    title: h1 || title,
    metaDescription,
    featureImage,
    htmlContent: content,
    scrapedAt: new Date().toISOString(),
  };
}

async function main() {
  const results = [];
  const errors = [];
  const total = URLS.length;

  console.log(`Scraping ${total} blog posts...\n`);

  for (let i = 0; i < total; i++) {
    const url = URLS[i];
    const slug = url.split("/blog/")[1] || url;
    const progress = `[${String(i + 1).padStart(3)}/${total}]`;

    try {
      const html = await fetchPage(url);
      const data = extract(html, url);
      results.push(data);
      const contentLen = data.htmlContent.length;
      console.log(`${progress} OK   ${slug.substring(0, 60).padEnd(60)} (${contentLen} chars)`);
    } catch (err) {
      console.log(`${progress} ERR  ${slug.substring(0, 60).padEnd(60)} ${err.message}`);
      errors.push({ url, error: err.message });
    }

    if (i < total - 1) await new Promise((r) => setTimeout(r, 500));
  }

  const outPath = path.join(__dirname, "scraped-posts.json");
  fs.writeFileSync(outPath, JSON.stringify({ posts: results, errors, scrapedAt: new Date().toISOString(), total: results.length }, null, 2));

  console.log(`\n========================================`);
  console.log(`Scraped: ${results.length}/${total} posts`);
  console.log(`Errors:  ${errors.length}`);
  console.log(`Saved:   ${outPath}`);
  console.log(`========================================`);
}

main().catch(console.error);
