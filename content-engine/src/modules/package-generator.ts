import type Anthropic from '@anthropic-ai/sdk';
import type { InboxEmail } from '../types/email.js';
import type { DetectedTrend } from '../types/trend.js';
import type { ExtractedSource } from './source-extractor.js';
import type { AuthorPackage } from '../types/package.js';
import { callClaude, parseJsonResponse } from '../claude/client.js';
import { MODELS, TOKEN_BUDGETS } from '../claude/token-budget.js';
import { wordCount } from '../util/word-count.js';
import { checkBlogHyperlinks, checkNoHyperlinks } from '../util/hyperlink-checker.js';
import { checkTrademarks } from '../util/trademark-checker.js';
import { checkBannedWords } from '../util/banned-word-checker.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('package-generator');

const REFRAMING_LINE = "If you don't own your data & digital infrastructure, your vendors do.";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export async function generateAuthorPackage(
  client: Anthropic,
  author: 'bill' | 'drew',
  trend: DetectedTrend,
  emails: InboxEmail[],
  sources: ExtractedSource[],
  systemPrompt: string,
): Promise<{ package: AuthorPackage; inputTokens: number; outputTokens: number }> {
  const relevantSources = sources.filter((s) =>
    trend.supportingSourceIds.includes(s.messageId),
  );

  const sourcesBlock = relevantSources
    .map((s) => {
      const email = emails[s.emailIndex];
      return `- ${s.headline} (${s.sourcePublication})${s.articleUrl ? ` — ${s.articleUrl}` : ''}
  Body excerpt: ${email.bodyPlaintext.slice(0, 800)}`;
    })
    .join('\n\n');

  const authorName = author === 'bill' ? 'Bill Douglas' : 'Drew Hall';
  const authorVoiceNote =
    author === 'bill'
      ? "Bill can use 'I' freely as a practitioner sharing hard-won perspective. Warmer, more appreciative tone."
      : "Drew demystifies systems calmly; ties to owner outcome. Analytical, plainspoken. Light dry humor.";

  const userPrompt = `Produce ${authorName}'s author package for this week's Content Engine run.

TREND: ${trend.title}
LANE: ${trend.lane}
IMPLICATION: ${trend.ownerImplication}

SOURCES (use 3–5 in the blog with live URLs; pick the 2–3 strongest for the LinkedIn article):
${sourcesBlock}

Return JSON ONLY matching this exact shape:

{
  "author": "${author}",
  "slug": "url-friendly-slug-6-to-8-words",
  "metadata": {
    "title": "Direct, benefit-forward headline (no colons + buzzwords, no clickbait)",
    "excerpt": "1-2 sentences (30-55 words) that earn the click",
    "seoTitle": "50-60 character SEO title with primary keyword near the front",
    "seoDescription": "150-160 character meta description with keyword and CTA",
    "category": "One of: Building Intelligence, Data & Infrastructure, Portfolio Strategy, AI & Technology, Operations & Efficiency, Capital & Investment, Owner Resources, Industry Trends",
    "tags": ["3-5 tags"],
    "readingTimeMinutes": 8,
    "featureImagePrompt": "3-5 sentence detailed photorealistic image prompt for 1920x1080 hero. Modern CRE imagery. No people looking at cameras. Brand colors: deep navy, electric blue, clean white.",
    "ogImagePrompt": "2-4 sentence concept-driven graphic prompt for 1200x630 social share. Bold, high contrast, minimal detail."
  },
  "blogMarkdown": "Full blog body (1500-2000 words). Open with a sharp observation. Build the SB7 arc. Include 3-5 references inline with live URLs. Include a References Cited footer. Close with: 'Own your data & digital infrastructure. Operate with strategic foresight. Build for the long game.'",
  "linkedinArticleMarkdown": "1200-1800 word LinkedIn article. No hyperlinks, no References Cited. Strong opening hook. ${authorVoiceNote} Shorter paragraphs. End with a SPECIFIC question. Close with: 'Own your data & digital infrastructure. Build for the long game.'",
  "linkedinShortPost": {
    "text": "150-250 word standalone post. Hook in line one. 3-5 short paragraphs. Clear point of view. End with engagement prompt.",
    "hashtags": ["OpticWise", "CRE", "BuildingIntelligence", "plus 1-2 topic tags"]
  }
}

NON-NEGOTIABLE:
- Always say "data & digital infrastructure", never "infrastructure" alone in OW context.
- Never use: leverage, synergy, ecosystem, holistic, seamless (except 'Seamless Mobility' in 5S®), cutting-edge, PropTech (for OW).
- First-use trademarks: Peak Property Performance®, PPP 5C™, BoT®, Building of Things®, ElasticISP®, 5S®, SIC®, Property Brain™, Portfolio Brain™, PPP Audit™.
- The reframing line "If you don't own your data & digital infrastructure, your vendors do." MUST appear in the blog AND the LinkedIn article.
- Do NOT use "audit" to describe OpticWise's offering — use "review".
- Asset-manager audience by default.
- Do NOT invent client metrics or outcomes.`;

  const { text, inputTokens, outputTokens } = await callClaude(client, {
    model: MODELS.opus,
    system: systemPrompt,
    maxTokens: TOKEN_BUDGETS.authorPackage,
    userPrompt,
    temperature: 0.6,
  });

  const parsed = parseJsonResponse<AuthorPackage>(text);
  parsed.blogWordCount = wordCount(parsed.blogMarkdown);
  parsed.linkedinArticleWordCount = wordCount(parsed.linkedinArticleMarkdown);

  const validation = validatePackage(parsed);

  if (!validation.valid) {
    log.warn('package_validation_failed_first_attempt', {
      author,
      errors: validation.errors,
    });

    const retryPrompt = `The previous generation had validation errors. Fix ONLY these issues and return the corrected JSON in the same schema:

ERRORS:
${validation.errors.map((e) => `- ${e}`).join('\n')}

ORIGINAL OUTPUT (fix inline):
${text}`;

    const retry = await callClaude(client, {
      model: MODELS.opus,
      system: systemPrompt,
      maxTokens: TOKEN_BUDGETS.authorPackage,
      userPrompt: retryPrompt,
      temperature: 0.3,
    });

    const retryParsed = parseJsonResponse<AuthorPackage>(retry.text);
    retryParsed.blogWordCount = wordCount(retryParsed.blogMarkdown);
    retryParsed.linkedinArticleWordCount = wordCount(retryParsed.linkedinArticleMarkdown);

    const retryValidation = validatePackage(retryParsed);
    if (!retryValidation.valid) {
      throw new Error(
        `${authorName}'s package failed validation after retry: ${retryValidation.errors.join('; ')}`,
      );
    }

    log.info('package_validation_passed_on_retry', { author });
    return {
      package: retryParsed,
      inputTokens: inputTokens + retry.inputTokens,
      outputTokens: outputTokens + retry.outputTokens,
    };
  }

  log.info('package_generated', {
    author,
    slug: parsed.slug,
    blogWords: parsed.blogWordCount,
    articleWords: parsed.linkedinArticleWordCount,
    shortPostWords: wordCount(parsed.linkedinShortPost.text),
  });

  return { package: parsed, inputTokens, outputTokens };
}

function validatePackage(pkg: AuthorPackage): ValidationResult {
  const errors: string[] = [];

  const blogWc = wordCount(pkg.blogMarkdown);
  if (blogWc < 1500) errors.push(`Blog word count ${blogWc} below minimum 1500`);
  if (blogWc > 2000) errors.push(`Blog word count ${blogWc} above maximum 2000`);

  const articleWc = wordCount(pkg.linkedinArticleMarkdown);
  if (articleWc < 1200) errors.push(`LinkedIn article word count ${articleWc} below minimum 1200`);
  if (articleWc > 1800) errors.push(`LinkedIn article word count ${articleWc} above maximum 1800`);

  const shortWc = wordCount(pkg.linkedinShortPost.text);
  if (shortWc < 150) errors.push(`LinkedIn short post word count ${shortWc} below minimum 150`);
  if (shortWc > 250) errors.push(`LinkedIn short post word count ${shortWc} above maximum 250`);

  const blogLinks = checkBlogHyperlinks(pkg.blogMarkdown);
  errors.push(...blogLinks.errors);

  const articleNoLinks = checkNoHyperlinks(pkg.linkedinArticleMarkdown, 'LinkedIn article');
  if (articleNoLinks) errors.push(articleNoLinks);

  const shortNoLinks = checkNoHyperlinks(pkg.linkedinShortPost.text, 'LinkedIn short post');
  if (shortNoLinks) errors.push(shortNoLinks);

  for (const [label, text] of [
    ['Blog', pkg.blogMarkdown],
    ['LinkedIn article', pkg.linkedinArticleMarkdown],
    ['LinkedIn short post', pkg.linkedinShortPost.text],
  ] as const) {
    const banned = checkBannedWords(text);
    errors.push(...banned.errors.map((e) => `[${label}] ${e}`));

    const tm = checkTrademarks(text);
    errors.push(...tm.errors.map((e) => `[${label}] ${e}`));
  }

  if (!pkg.blogMarkdown.includes(REFRAMING_LINE)) {
    errors.push('Blog missing reframing line');
  }
  if (!pkg.linkedinArticleMarkdown.includes(REFRAMING_LINE)) {
    errors.push('LinkedIn article missing reframing line');
  }

  const auditRegex = /\baudit\b/gi;
  const blogAudits = [...pkg.blogMarkdown.matchAll(auditRegex)];
  for (const match of blogAudits) {
    const context = pkg.blogMarkdown.slice(
      Math.max(0, match.index! - 40),
      match.index! + 40,
    );
    if (/opticwise|our|we|your next step/i.test(context) && !/PPP Audit™/i.test(context)) {
      errors.push(`Blog uses "audit" to describe OW offering near: "${context.trim()}"`);
    }
  }

  if (!pkg.blogMarkdown.includes('data & digital infrastructure')) {
    errors.push('Blog missing "data & digital infrastructure" phrase');
  }

  return { valid: errors.length === 0, errors };
}
