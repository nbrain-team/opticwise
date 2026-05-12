const SITE = "https://www.opticwise.com";

export function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type SitemapUrlEntry = { loc: string; lastmod: string };

export function parseSitemapUrls(xml: string): SitemapUrlEntry[] {
  const urls: SitemapUrlEntry[] = [];
  const re = /<url>\s*([\s\S]*?)<\/url>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const locM = block.match(/<loc>([^<]+)<\/loc>/);
    const lm = block.match(/<lastmod>([^<]+)<\/lastmod>/);
    if (locM) {
      urls.push({
        loc: locM[1].trim(),
        lastmod: lm ? lm[1].trim() : new Date().toISOString(),
      });
    }
  }
  return urls;
}

function normalizeLastmod(iso: string): string {
  if (!iso.includes("T")) return iso;
  return iso.replace(/\.\d{3}Z$/, "Z").replace(/\+00:00$/, "Z");
}

/**
 * Replace existing insight URL block or insert a new one in alphabetical <loc> order.
 * Rebuilds the entire urlset from parsed blocks so ordering stays correct.
 */
export function insertOrReplaceInsightSitemapUrl(
  xml: string,
  slug: string,
  lastmodIso: string
): string {
  const loc = `${SITE}/insights/${slug}/`;
  const lastmod = normalizeLastmod(lastmodIso);
  const newBlock = `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

  const blocks: { loc: string; block: string }[] = [];
  const re = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const inner = m[1];
    const lm = inner.match(/<loc>([^<]+)<\/loc>/);
    if (!lm) continue;
    blocks.push({ loc: lm[1].trim(), block: m[0] });
  }

  const merged = blocks.filter((b) => b.loc !== loc);
  merged.push({ loc, block: newBlock });
  merged.sort((a, b) => a.loc.localeCompare(b.loc, "en"));
  const rebuiltInner = merged.map((b) => b.block).join("\n");

  return xml.replace(/<urlset[^>]*>[\s\S]*?<\/urlset>/m, (full) => {
    const open = full.match(/<urlset[^>]*>/)?.[0] ?? "<urlset>";
    return `${open}\n${rebuiltInner}\n</urlset>`;
  });
}

export type RssItem = {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
};

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const g = (tag: string) => {
      const tm = block.match(
        new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i")
      );
      return tm ? tm[1].trim() : "";
    };
    items.push({
      title: g("title"),
      link: g("link"),
      guid: g("guid"),
      pubDate: g("pubDate"),
      description: g("description"),
    });
  }
  return items;
}

function formatRfc822FromIso(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toUTCString();
}

export function insertRssItem(feedXml: string, item: RssItem): string {
  const newEntry: RssItem = {
    title: item.title,
    link: item.link,
    guid: item.guid,
    pubDate: formatRfc822FromIso(item.pubDate),
    description: item.description,
  };

  let items = parseRssItems(feedXml).filter(
    (i) => i.link !== newEntry.link && i.guid !== newEntry.guid
  );
  items.push(newEntry);
  items.sort(
    (a, b) =>
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  const rendered = items
    .map(
      (i) => `    <item>
      <title>${escapeXml(i.title)}</title>
      <link>${escapeXml(i.link)}</link>
      <guid isPermaLink="true">${escapeXml(i.guid)}</guid>
      <pubDate>${escapeXml(i.pubDate)}</pubDate>
      <description>${escapeXml(i.description)}</description>
    </item>`
    )
    .join("\n");

  let out = feedXml.replace(
    /<lastBuildDate>[^<]*<\/lastBuildDate>/,
    `<lastBuildDate>${formatRfc822FromIso(new Date().toISOString())}</lastBuildDate>`
  );

  const replaced = out.replace(
    /(\s*<item>[\s\S]*?<\/item>\s*)+/m,
    `\n${rendered}\n`
  );
  if (replaced === out) {
    out = out.replace(/\s*<\/channel>/, `\n${rendered}\n  </channel>`);
  } else {
    out = replaced;
  }
  return out;
}

export function buildInsightRssItem(params: {
  title: string;
  slug: string;
  description: string;
  datePublishedIso: string;
}): RssItem {
  const link = `${SITE}/insights/${params.slug}`;
  return {
    title: params.title,
    link,
    guid: link,
    pubDate: params.datePublishedIso,
    description: params.description,
  };
}
