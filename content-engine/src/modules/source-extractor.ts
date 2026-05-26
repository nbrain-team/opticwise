import type Anthropic from '@anthropic-ai/sdk';
import type { InboxEmail } from '../types/email.js';
import { callClaude, parseJsonResponse } from '../claude/client.js';
import { MODELS, TOKEN_BUDGETS } from '../claude/token-budget.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('source-extractor');

export interface ExtractedSource {
  emailIndex: number;
  messageId: string;
  headline: string;
  sourcePublication: string;
  articleUrl: string | null;
  keyStatistic: string | null;
  extracted: boolean;
}

const URL_REGEX = /https?:\/\/[^\s)>"<]+/;

export async function extractSources(
  client: Anthropic,
  emails: InboxEmail[],
  systemPrompt: string,
): Promise<ExtractedSource[]> {
  const results: ExtractedSource[] = [];
  let totalInput = 0;
  let totalOutput = 0;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    try {
      const urlFromBody = email.extractedLinks[0] || null;
      const urlMatch = email.bodyPlaintext.match(URL_REGEX);

      if (canExtractWithRegex(email)) {
        results.push({
          emailIndex: i,
          messageId: email.messageId,
          headline: email.subject.replace(/^(Fwd?|Re):\s*/i, '').trim(),
          sourcePublication: extractPublisher(email.from),
          articleUrl: urlFromBody || urlMatch?.[0] || null,
          keyStatistic: null,
          extracted: true,
        });
        continue;
      }

      const { text, inputTokens, outputTokens } = await callClaude(client, {
        model: MODELS.haiku,
        system: systemPrompt,
        maxTokens: TOKEN_BUDGETS.sourceExtraction,
        userPrompt: `Extract structured metadata from this email:

FROM: ${email.from}
SUBJECT: ${email.subject}
BODY (first 2000 chars):
${email.bodyPlaintext.slice(0, 2000)}

Return JSON only:
{
  "headline": "the article/newsletter headline",
  "sourcePublication": "publication or sender name",
  "articleUrl": "primary URL or null",
  "keyStatistic": "one key number or claim, or null"
}`,
      });

      totalInput += inputTokens;
      totalOutput += outputTokens;

      const parsed = parseJsonResponse<{
        headline: string;
        sourcePublication: string;
        articleUrl: string | null;
        keyStatistic: string | null;
      }>(text);

      results.push({
        emailIndex: i,
        messageId: email.messageId,
        headline: parsed.headline,
        sourcePublication: parsed.sourcePublication,
        articleUrl: parsed.articleUrl || urlFromBody || null,
        keyStatistic: parsed.keyStatistic,
        extracted: true,
      });
    } catch (err) {
      log.error('extraction_failed', err instanceof Error ? err : new Error(String(err)), {
        emailIndex: i,
        subject: email.subject,
      });
      results.push({
        emailIndex: i,
        messageId: email.messageId,
        headline: email.subject,
        sourcePublication: extractPublisher(email.from),
        articleUrl: email.extractedLinks[0] || null,
        keyStatistic: null,
        extracted: false,
      });
    }
  }

  log.info('extraction_complete', {
    total: emails.length,
    extracted: results.filter((r) => r.extracted).length,
    failed: results.filter((r) => !r.extracted).length,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
  });

  return results;
}

function canExtractWithRegex(email: InboxEmail): boolean {
  const from = email.from.toLowerCase();
  const knownNewsletters = [
    'substack.com',
    'bisnow.com',
    'globest.com',
    'commercialobserver.com',
    'propmodo.com',
    'cre.tech',
    'connectcre.com',
  ];
  return knownNewsletters.some((pub) => from.includes(pub)) && email.subject.length > 10;
}

function extractPublisher(from: string): string {
  const match = from.match(/"?([^"<]+)"?\s*</);
  return match?.[1]?.trim() || from.split('@')[0] || from;
}
