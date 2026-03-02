#!/usr/bin/env node

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

async function main() {
  const dates = JSON.parse(fs.readFileSync(path.join(__dirname, "sitemap-dates.json"), "utf8"));
  console.log(`Loaded ${Object.keys(dates).length} dates from sitemap\n`);

  const ghostPosts = await ghostRequest("GET", "posts/?limit=all&fields=id,slug,updated_at,published_at");
  if (!ghostPosts.posts) {
    console.error("Failed to fetch Ghost posts");
    process.exit(1);
  }

  const ghostMap = {};
  for (const gp of ghostPosts.posts) {
    ghostMap[gp.slug] = { id: gp.id, updated_at: gp.updated_at, published_at: gp.published_at };
  }
  console.log(`Found ${Object.keys(ghostMap).length} posts in Ghost\n`);

  let ok = 0, err = 0, skip = 0;
  const slugs = Object.keys(dates);

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const ghost = ghostMap[slug];
    const progress = `[${String(i + 1).padStart(3)}/${slugs.length}]`;

    if (!ghost) {
      skip++;
      continue;
    }

    const newDate = new Date(dates[slug]).toISOString();

    try {
      const result = await ghostRequest("PUT", `posts/${ghost.id}/`, {
        posts: [{
          published_at: newDate,
          updated_at: ghost.updated_at,
        }],
      });

      if (result.posts) {
        ok++;
        console.log(`${progress} OK   ${slug.substring(0, 55).padEnd(55)} ${newDate.substring(0, 10)}`);
      } else {
        err++;
        const msg = result.errors?.[0]?.message || "";
        console.log(`${progress} ERR  ${slug.substring(0, 55)} ${msg.substring(0, 60)}`);
      }
    } catch (e) {
      err++;
      console.log(`${progress} ERR  ${slug.substring(0, 55)} ${e.message.substring(0, 60)}`);
    }

    if (i < slugs.length - 1) await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n========================================`);
  console.log(`Updated dates: ${ok}`);
  console.log(`Errors: ${err}`);
  console.log(`Skipped: ${skip}`);
  console.log(`========================================`);
}

main().catch(console.error);
