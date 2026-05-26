import type Anthropic from '@anthropic-ai/sdk';
import type { InboxEmail } from '../types/email.js';
import type { ExtractedSource } from './source-extractor.js';
import type { TrendDetectionResult } from '../types/trend.js';
import { callClaude, parseJsonResponse } from '../claude/client.js';
import { MODELS, TOKEN_BUDGETS } from '../claude/token-budget.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('trend-detector');

export async function detectTrends(
  client: Anthropic,
  emails: InboxEmail[],
  sources: ExtractedSource[],
  systemPrompt: string,
): Promise<{ result: TrendDetectionResult; inputTokens: number; outputTokens: number }> {
  const sourceDigest = sources
    .filter((s) => s.extracted)
    .map((s, i) => {
      const email = emails[s.emailIndex];
      return `[${i + 1}] ID: ${s.messageId}
FROM: ${s.sourcePublication}
HEADLINE: ${s.headline}
URL: ${s.articleUrl || 'none'}
STAT: ${s.keyStatistic || 'none'}
BODY: ${email.bodyPlaintext.slice(0, 1500)}`;
    })
    .join('\n\n---\n\n');

  const userPrompt = `From the source emails below, identify exactly TWO trends — one for Bill (strategy / markets / AI / capital) and one for Drew (architecture / systems / OT / security).

Eligibility rules (strict):
- Each trend must be supported by 3+ sources from the list below (reference by ID).
- Cross-signal synthesis is worth more than the most-covered single story.
- A trend is NOT eligible if its entry point is already covered by 3+ mainstream CRE trade publications in the same framing.
- Map each trend to one of the four moats: data, workflows, orchestration, operating-standard.

Bill's lanes: capital markets, AI developments, regulatory shifts, M&A patterns, owner strategy, broader tech moves.
Drew's lanes: building systems vendor patterns, integration reality, resilience, OT/network security, AI infrastructure at the building level, standards bodies, OT governance.

SOURCES (${sources.filter((s) => s.extracted).length} items):

${sourceDigest}

Return JSON ONLY matching this exact shape:

{
  "billTrend": {
    "title": "working title",
    "lane": "capital|ai|regulation|proptech|tenant|strategy|tech",
    "supportingSourceIds": ["messageId1", "messageId2", "..."],
    "ownerImplication": "one paragraph: why this matters to a CRE asset manager",
    "fallbackMode": false
  },
  "drewTrend": {
    "title": "...",
    "lane": "...",
    "supportingSourceIds": ["..."],
    "ownerImplication": "...",
    "fallbackMode": false
  },
  "alternatives": [
    { "title": "...", "lane": "...", "reasonSetAside": "..." }
  ]
}`;

  const { text, inputTokens, outputTokens } = await callClaude(client, {
    model: MODELS.opus,
    system: systemPrompt,
    maxTokens: TOKEN_BUDGETS.trendDetection,
    userPrompt,
    temperature: 0.4,
  });

  const result = parseJsonResponse<TrendDetectionResult>(text);

  if (
    !result.billTrend?.supportingSourceIds?.length ||
    !result.drewTrend?.supportingSourceIds?.length
  ) {
    throw new Error('Trend detection returned incomplete result — missing supporting sources');
  }

  if (
    result.billTrend.supportingSourceIds.length < 3 &&
    !result.billTrend.fallbackMode
  ) {
    log.warn('bill_trend_few_sources', {
      count: result.billTrend.supportingSourceIds.length,
      title: result.billTrend.title,
    });
  }

  if (
    result.drewTrend.supportingSourceIds.length < 3 &&
    !result.drewTrend.fallbackMode
  ) {
    log.warn('drew_trend_few_sources', {
      count: result.drewTrend.supportingSourceIds.length,
      title: result.drewTrend.title,
    });
  }

  log.info('trends_detected', {
    billTitle: result.billTrend.title,
    billLane: result.billTrend.lane,
    billSources: result.billTrend.supportingSourceIds.length,
    drewTitle: result.drewTrend.title,
    drewLane: result.drewTrend.lane,
    drewSources: result.drewTrend.supportingSourceIds.length,
    alternatives: result.alternatives?.length || 0,
  });

  return { result, inputTokens, outputTokens };
}
