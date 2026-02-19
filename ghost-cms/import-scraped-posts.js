#!/usr/bin/env node

/**
 * Import scraped blog posts into Ghost CMS.
 * Preserves: slugs (for URL parity), titles, meta descriptions, feature images, HTML content.
 *
 * Usage:
 *   GHOST_ADMIN_URL=https://opticwise-ghost.onrender.com \
 *   GHOST_ADMIN_KEY=id:secret \
 *   node import-scraped-posts.js
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

async function main() {
  const dataPath = path.join(__dirname, "scraped-posts.json");
  const { posts } = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  console.log(`Importing ${posts.length} blog posts into Ghost...\n`);

  let ok = 0;
  let err = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const progress = `[${String(i + 1).padStart(3)}/${posts.length}]`;

    try {
      const result = await ghostRequest("POST", "posts/", {
        posts: [{
          title: post.title,
          slug: post.slug,
          mobiledoc: htmlToMobiledoc(post.htmlContent),
          status: "published",
          feature_image: post.featureImage || undefined,
          meta_description: post.metaDescription || undefined,
          custom_excerpt: post.metaDescription ? post.metaDescription.substring(0, 300) : undefined,
        }],
      });

      if (result.posts) {
        ok++;
        console.log(`${progress} OK   ${post.slug.substring(0, 60)}`);
      } else {
        const errMsg = result.errors?.[0]?.message || JSON.stringify(result).substring(0, 100);
        if (errMsg.includes("already exists")) {
          console.log(`${progress} SKIP ${post.slug.substring(0, 55)} (already exists)`);
          ok++;
        } else {
          err++;
          console.log(`${progress} ERR  ${post.slug.substring(0, 55)} ${errMsg.substring(0, 60)}`);
        }
      }
    } catch (e) {
      err++;
      console.log(`${progress} ERR  ${post.slug.substring(0, 55)} ${e.message.substring(0, 60)}`);
    }

    if (i < posts.length - 1) await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n========================================`);
  console.log(`Imported: ${ok}/${posts.length}`);
  console.log(`Errors:   ${err}`);
  console.log(`========================================`);
}

main().catch(console.error);
