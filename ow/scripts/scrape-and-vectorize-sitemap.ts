/**
 * Scrape and Vectorize Sitemap Pages
 * This script fetches all URLs from opticwise.com sitemap,
 * scrapes the content, and generates embeddings for AI search
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SITEMAP_URL = 'https://www.opticwise.com/sitemap.xml';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.slice(0, 8000), // OpenAI limit
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function fetchSitemap(): Promise<SitemapEntry[]> {
  console.log('📍 Fetching sitemap from:', SITEMAP_URL);
  
  const response = await fetch(SITEMAP_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status}`);
  }
  
  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  
  const entries: SitemapEntry[] = [];
  
  $('url').each((_, elem) => {
    const loc = $(elem).find('loc').text();
    const lastmod = $(elem).find('lastmod').text();
    const changefreq = $(elem).find('changefreq').text();
    
    if (loc) {
      entries.push({
        url: loc,
        lastmod: lastmod || undefined,
        changefreq: changefreq || undefined,
      });
    }
  });
  
  console.log(`📄 Found ${entries.length} URLs in sitemap`);
  return entries;
}

async function scrapePage(url: string): Promise<{
  title: string;
  metaDescription: string;
  content: string;
  headings: { level: number; text: string }[];
}> {
  console.log(`   Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'OpticWise-Bot/1.0 (Internal Scraper for AI Knowledge Base)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Remove script, style, nav, footer elements
  $('script, style, nav, footer, header, noscript, iframe, .navigation, .footer, .header').remove();
  
  // Extract title
  const title = $('title').text().trim() || $('h1').first().text().trim() || '';
  
  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || '';
  
  // Extract headings
  const headings: { level: number; text: string }[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
    const level = parseInt(elem.tagName.replace('h', ''));
    const text = $(elem).text().trim();
    if (text) {
      headings.push({ level, text });
    }
  });
  
  // Extract main content
  const mainContent = $('main, article, .content, .main-content, [role="main"]');
  let content = '';
  
  if (mainContent.length > 0) {
    content = mainContent.text();
  } else {
    content = $('body').text();
  }
  
  // Clean up content - remove excessive whitespace
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  return {
    title,
    metaDescription,
    content,
    headings,
  };
}

async function scrapeAndVectorize() {
  console.log('='.repeat(60));
  console.log('🌐 OPTICWISE SITEMAP SCRAPER & VECTORIZER');
  console.log('='.repeat(60));
  console.log();

  try {
    // Fetch sitemap
    const sitemapEntries = await fetchSitemap();
    console.log();

    let processed = 0;
    let vectorized = 0;
    let errors = 0;
    let skipped = 0;

    for (const entry of sitemapEntries) {
      try {
        // Check if already exists and vectorized
        const existing = await prisma.webPage.findUnique({
          where: { url: entry.url },
        });

        // Skip if already vectorized and content hasn't changed
        if (existing?.vectorized && existing.embedding) {
          const existingLastMod = existing.lastModified?.toISOString().split('T')[0];
          const newLastMod = entry.lastmod?.split('T')[0];
          
          if (existingLastMod === newLastMod) {
            console.log(`⏭️  Skipping (already vectorized): ${entry.url}`);
            skipped++;
            continue;
          }
        }

        console.log(`\n📄 Processing [${processed + 1}/${sitemapEntries.length}]: ${entry.url}`);

        // Extract slug from URL
        const urlObj = new URL(entry.url);
        const slug = urlObj.pathname === '/' ? 'home' : urlObj.pathname.replace(/^\/|\/$/g, '');

        // Scrape the page
        const pageData = await scrapePage(entry.url);
        console.log(`   Title: ${pageData.title.slice(0, 60)}...`);
        console.log(`   Content: ${pageData.content.length} characters`);
        console.log(`   Headings: ${pageData.headings.length} found`);

        // Skip if no meaningful content
        if (pageData.content.length < 100) {
          console.log(`   ⚠️  Skipping - insufficient content`);
          
          await prisma.webPage.upsert({
            where: { url: entry.url },
            create: {
              url: entry.url,
              slug,
              title: pageData.title,
              metaDescription: pageData.metaDescription,
              content: pageData.content,
              headings: pageData.headings,
              lastModified: entry.lastmod ? new Date(entry.lastmod) : null,
              changeFreq: entry.changefreq,
              scrapedAt: new Date(),
              scrapeStatus: 'success',
              vectorized: false,
            },
            update: {
              slug,
              title: pageData.title,
              metaDescription: pageData.metaDescription,
              content: pageData.content,
              headings: pageData.headings,
              lastModified: entry.lastmod ? new Date(entry.lastmod) : null,
              changeFreq: entry.changefreq,
              scrapedAt: new Date(),
              scrapeStatus: 'success',
            },
          });
          
          processed++;
          continue;
        }

        // Create text for embedding
        const textForEmbedding = `
Page: ${pageData.title}
URL: ${entry.url}
Description: ${pageData.metaDescription}
Headings: ${pageData.headings.map(h => h.text).join(' | ')}
Content: ${pageData.content}
        `.trim();

        // Generate embedding
        console.log(`   🧠 Generating embedding...`);
        const embedding = await generateEmbedding(textForEmbedding);

        // Upsert to database
        await prisma.webPage.upsert({
          where: { url: entry.url },
          create: {
            url: entry.url,
            slug,
            title: pageData.title,
            metaDescription: pageData.metaDescription,
            content: pageData.content,
            headings: pageData.headings,
            lastModified: entry.lastmod ? new Date(entry.lastmod) : null,
            changeFreq: entry.changefreq,
            vectorized: true,
            embedding: JSON.stringify(embedding),
            scrapedAt: new Date(),
            scrapeStatus: 'success',
          },
          update: {
            slug,
            title: pageData.title,
            metaDescription: pageData.metaDescription,
            content: pageData.content,
            headings: pageData.headings,
            lastModified: entry.lastmod ? new Date(entry.lastmod) : null,
            changeFreq: entry.changefreq,
            vectorized: true,
            embedding: JSON.stringify(embedding),
            scrapedAt: new Date(),
            scrapeStatus: 'success',
            scrapeError: null,
          },
        });

        console.log(`   ✅ Vectorized successfully`);
        processed++;
        vectorized++;

        // Rate limiting - be nice to the server
        await new Promise(r => setTimeout(r, 500));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error: ${errorMessage}`);

        // Store the error
        await prisma.webPage.upsert({
          where: { url: entry.url },
          create: {
            url: entry.url,
            slug: new URL(entry.url).pathname.replace(/^\/|\/$/g, '') || 'home',
            lastModified: entry.lastmod ? new Date(entry.lastmod) : null,
            changeFreq: entry.changefreq,
            scrapedAt: new Date(),
            scrapeStatus: 'failed',
            scrapeError: errorMessage,
          },
          update: {
            scrapedAt: new Date(),
            scrapeStatus: 'failed',
            scrapeError: errorMessage,
          },
        });

        errors++;
        processed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SCRAPING & VECTORIZATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total URLs:     ${sitemapEntries.length}`);
    console.log(`Processed:      ${processed}`);
    console.log(`Vectorized:     ${vectorized}`);
    console.log(`Skipped:        ${skipped}`);
    console.log(`Errors:         ${errors}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
scrapeAndVectorize().catch(console.error);

