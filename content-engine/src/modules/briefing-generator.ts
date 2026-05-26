import type Anthropic from '@anthropic-ai/sdk';
import type { InboxEmail } from '../types/email.js';
import type { TrendDetectionResult } from '../types/trend.js';
import { callClaude } from '../claude/client.js';
import { MODELS, TOKEN_BUDGETS } from '../claude/token-budget.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('briefing-generator');

export async function generateBriefing(
  client: Anthropic,
  date: string,
  emails: InboxEmail[],
  trends: TrendDetectionResult,
  systemPrompt: string,
): Promise<{ title: string; body: string; inputTokens: number; outputTokens: number }> {
  const digest = emails
    .slice(0, 60)
    .map(
      (e, i) =>
        `[${i + 1}] ${extractPublisher(e.from)} | ${e.subject} | ${e.bodyPlaintext.slice(0, 300)}${e.extractedLinks[0] ? ` | ${e.extractedLinks[0]}` : ''}`,
    )
    .join('\n');

  const trendSummary = [
    `Bill: ${trends.billTrend.title} (${trends.billTrend.lane})`,
    `Drew: ${trends.drewTrend.title} (${trends.drewTrend.lane})`,
  ].join('\n');

  const userPrompt = `Produce the Weekly Intelligence Briefing for ${date}.

Pick the top 5–10 most useful intelligence points from the source list below — the ones that move OpticWise positioning, sales, or product thinking. Fewer than 10 is acceptable if the bar isn't met; do not pad.

For each point, provide:
- The insight in 1–2 sentences
- Why it matters to OpticWise (1–2 sentences, name the moat or layer when relevant)
- Source: publication, sender, or organization with a live URL where available

Trends selected this week:
${trendSummary}

Sources (${emails.length} items):
${digest}

Format as markdown with live hyperlinks. Start with a 2–3 sentence editor's note. End with a "Trends Selected" section naming both trends and one-line rationale each.`;

  const { text, inputTokens, outputTokens } = await callClaude(client, {
    model: MODELS.opus,
    system: systemPrompt,
    maxTokens: TOKEN_BUDGETS.briefing,
    userPrompt,
    temperature: 0.4,
  });

  const lines = text.split('\n');
  if (lines.filter((l) => l.trim().startsWith('-') || l.trim().match(/^\d+\./)).length < 5) {
    log.warn('briefing_few_points', { pointCount: lines.filter((l) => l.trim().startsWith('-')).length });
  }

  log.info('briefing_generated', {
    charCount: text.length,
    inputTokens,
    outputTokens,
  });

  return {
    title: `Weekly Intelligence Briefing — ${date}`,
    body: text,
    inputTokens,
    outputTokens,
  };
}

function extractPublisher(from: string): string {
  const match = from.match(/"?([^"<]+)"?\s*</);
  return match?.[1]?.trim() || from.split('@')[0] || from;
}
