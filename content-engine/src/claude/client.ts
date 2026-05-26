import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '../util/logger.js';

const log = createLogger('claude');

const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504, 529]);
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 4000;

export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

interface CallOptions {
  model: string;
  system: string;
  userPrompt: string;
  maxTokens: number;
  temperature?: number;
  parseJson?: boolean;
}

export async function callClaude(
  client: Anthropic,
  options: CallOptions,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const { model, system, userPrompt, maxTokens, temperature = 0.4 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: [
          {
            type: 'text',
            text: system,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = resp.content
        .filter((c): c is Anthropic.TextBlock => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
        .trim();

      if (resp.stop_reason === 'max_tokens') {
        log.warn('response_truncated', { model, maxTokens, attempt });
        if (attempt < MAX_RETRIES) {
          continue;
        }
        throw new Error(`Claude response truncated after ${MAX_RETRIES + 1} attempts (max_tokens: ${maxTokens})`);
      }

      log.info('claude_call_success', {
        model,
        inputTokens: resp.usage.input_tokens,
        outputTokens: resp.usage.output_tokens,
        cacheCreation: (resp.usage as Record<string, unknown>).cache_creation_input_tokens,
        cacheRead: (resp.usage as Record<string, unknown>).cache_read_input_tokens,
        attempt,
      });

      return {
        text,
        inputTokens: resp.usage.input_tokens,
        outputTokens: resp.usage.output_tokens,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const status = (err as { status?: number }).status;
      const requestId = (err as { headers?: Record<string, string> }).headers?.['request-id'];

      if (status && !RETRY_STATUS_CODES.has(status)) {
        log.error('claude_call_non_retryable', lastError, { status, requestId, model });
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        log.warn('claude_call_retry', { status, requestId, model, attempt, delayMs: delay });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error('Claude call failed after retries');
}

export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
