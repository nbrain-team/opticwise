/**
 * One-time script: derive the insights post HTML template from an existing
 * opticwise.com /insights/ post.
 *
 * Usage:
 *   npx tsx scripts/extract-insights-template.ts [url]
 *
 * Default URL: https://www.opticwise.com/insights/
 * Writes: templates/insights-post.template.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '..', 'templates', 'insights-post.template.html');

const DEFAULT_URL = 'https://www.opticwise.com/insights/';

async function main() {
  const targetUrl = process.argv[2] || DEFAULT_URL;
  console.log(`Fetching: ${targetUrl}`);

  try {
    const resp = await fetch(targetUrl);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    const html = await resp.text();
    console.log(`Fetched ${html.length} bytes`);

    // Extract the <article> or main content area
    const articleMatch = html.match(/<article[^>]*>[\s\S]*?<\/article>/i);
    if (!articleMatch) {
      console.log('No <article> tag found. Saving full page as reference.');
      fs.writeFileSync(OUTPUT_PATH, html);
      console.log(`Saved full HTML to ${OUTPUT_PATH}`);
      console.log('Manually edit to create template with {{placeholders}}.');
      return;
    }

    // Build a template from the article structure
    const template = buildTemplate(html, articleMatch[0]);

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, template);
    console.log(`Template saved to ${OUTPUT_PATH}`);
    console.log('Review and adjust placeholders as needed.');
  } catch (err) {
    console.error('Failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

function buildTemplate(fullHtml: string, articleHtml: string): string {
  // Extract head content for meta tags
  const headMatch = fullHtml.match(/<head>([\s\S]*?)<\/head>/i);
  const headContent = headMatch?.[1] || '';

  // Create template with placeholders
  let template = fullHtml;

  // Replace title
  template = template.replace(/<title>[^<]*<\/title>/i, '<title>{{seo_title}} | OpticWise Insights</title>');

  // Replace meta description
  template = template.replace(
    /<meta\s+name="description"\s+content="[^"]*"/i,
    '<meta name="description" content="{{seo_description}}"',
  );

  // Replace OG tags
  template = template.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"/i,
    '<meta property="og:title" content="{{seo_title}}"',
  );
  template = template.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"/i,
    '<meta property="og:description" content="{{seo_description}}"',
  );

  console.log('Template placeholders inserted. Manual review recommended.');
  return template;
}

main();
