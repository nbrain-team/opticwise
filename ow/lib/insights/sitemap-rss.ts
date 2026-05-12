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

export function insertOrReplaceInsightSitemapUrl(
  xml: string,
  slug: string,
  lastmodIso: string
): string {
  const loc = `${SITE}/insights/${slug}/`;
  let lastmod = lastmodIso;
  if (lastmod.includes("T")) {
    lastmod = lastmod.replace(/\.\d{3}Z$/, "Z").replace(/\+00:00$/, "Z");
  }

  let urls = parseSitemapUrls(xml);
  urls = urls.filter((u) => u.loc !== loc);
  urls.push({ loc, lastmod });
  urls.sort((a, b) => a.loc.localeCompare(b.loc, "en"));

  const inner = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("\n");

  const openM = xml.match(/<urlset([^>]*)>/);
  const openTag = openM
    ? `<urlset${openM[1]}>`
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  return xml.replace(
    /<urlset[^>]*>[\s\S]*?<\/urlset>/,
    `${openTag}\n${inner}\n</urlset>`
  );
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
      const tm = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
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
  return d.toUTCString().replace(/GMT$/, "GMT");
}

export function insertRssItem(
  feedXml: string,
  item: RssItem
): string {
  const pub = new Date(item.pubDate.includes("GMT") ? item.pubDate : item.pubDate);
  const items = parseRssItems(feedXml).filter(
    (i) => i.link !== item.link && i.guid !== item.guid
  );
  items.push({
    ...item,
    pubDate: formatRfc822FromIso(item.pubDate),
  });
  items.sort((a, b) => {
    const da = new Date(a.pubDate).getTime();
    const db = new Date(b.pubDate).getTime();
    return db - da;
  });

  const now = formatRfc822FromIso(new Date().toISOString());
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
    `<lastBuildDate>${now}</lastBuildDate>`
  );

  out = out.replace(/(<item>[\s\S]*<\/item>\s*)+/m, `${rendered}\n`);
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
