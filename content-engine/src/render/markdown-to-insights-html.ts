import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import type { PackageMetadata } from '../types/package.js';

let cachedTemplate: string | null = null;

function loadTemplate(templateDir: string): string {
  if (cachedTemplate) return cachedTemplate;

  const templatePath = path.join(templateDir, 'insights-post.template.html');
  if (!fs.existsSync(templatePath)) {
    cachedTemplate = DEFAULT_TEMPLATE;
    return cachedTemplate;
  }

  cachedTemplate = fs.readFileSync(templatePath, 'utf-8');
  return cachedTemplate;
}

export function markdownToInsightsHtml(
  markdownBody: string,
  metadata: PackageMetadata,
  author: 'bill' | 'drew',
  templateDir: string,
): string {
  const template = loadTemplate(templateDir);
  const bodyHtml = marked.parse(markdownBody, { async: false }) as string;
  const authorName = author === 'bill' ? 'Bill Douglas' : 'Drew Hall';
  const authorTitle =
    author === 'bill'
      ? 'CEO, OpticWise'
      : 'Founder & Chief Architect, OpticWise';

  return template
    .replace('{{title}}', escapeHtml(metadata.title))
    .replace('{{seo_title}}', escapeHtml(metadata.seoTitle))
    .replace('{{seo_description}}', escapeHtml(metadata.seoDescription))
    .replace('{{excerpt}}', escapeHtml(metadata.excerpt))
    .replace('{{category}}', escapeHtml(metadata.category))
    .replace('{{tags}}', metadata.tags.map((t) => escapeHtml(t)).join(', '))
    .replace('{{reading_time}}', String(metadata.readingTimeMinutes))
    .replace('{{author_name}}', authorName)
    .replace('{{author_title}}', authorTitle)
    .replace('{{body}}', bodyHtml)
    .replace('{{feature_image}}', '')
    .replace('{{og_image}}', '')
    .replace('{{publish_date}}', new Date().toISOString());
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{seo_title}} | OpticWise Insights</title>
  <meta name="description" content="{{seo_description}}">
  <meta property="og:title" content="{{seo_title}}">
  <meta property="og:description" content="{{seo_description}}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="{{og_image}}">
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <article class="insights-post">
    <header>
      <p class="category">{{category}}</p>
      <h1>{{title}}</h1>
      <p class="excerpt">{{excerpt}}</p>
      <div class="meta">
        <span class="author">{{author_name}}</span>
        <span class="author-title">{{author_title}}</span>
        <span class="reading-time">{{reading_time}} min read</span>
        <time datetime="{{publish_date}}">{{publish_date}}</time>
      </div>
    </header>
    <div class="post-body">
      {{body}}
    </div>
    <footer>
      <p class="tags">{{tags}}</p>
    </footer>
  </article>
</body>
</html>`;
