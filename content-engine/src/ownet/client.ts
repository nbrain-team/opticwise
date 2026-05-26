import type {
  InsightsScheduleRequest,
  InsightsScheduleResponse,
  SocialComposeRequest,
  SocialComposeResponse,
} from './types.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('ownet-client');

const MAX_RETRIES = 1;
const BACKOFF_MS = 4000;

interface OWnetClientConfig {
  insightsEndpoint: string;
  socialEndpoint: string;
  apiToken: string;
}

export class OWnetClient {
  constructor(private config: OWnetClientConfig) {}

  async scheduleInsightsPost(
    request: InsightsScheduleRequest,
    idempotencyKey: string,
  ): Promise<InsightsScheduleResponse> {
    const response = await this.post<InsightsScheduleResponse>(
      this.config.insightsEndpoint,
      request,
      idempotencyKey,
    );

    const verified = await this.verifyInsightsSchedule(response.scheduled_post_id);
    if (verified.status !== 'scheduled') {
      throw new Error(`Insights post ${response.scheduled_post_id} not in scheduled state: ${verified.status}`);
    }
    if (verified.publish_at !== request.publish_at) {
      throw new Error(
        `Publish time mismatch: sent ${request.publish_at}, got ${verified.publish_at}`,
      );
    }

    log.info('insights_scheduled', {
      postId: response.scheduled_post_id,
      author: request.author,
      publishAt: response.publish_at,
    });

    return response;
  }

  async scheduleSocialPost(
    request: SocialComposeRequest,
    idempotencyKey: string,
  ): Promise<SocialComposeResponse> {
    const response = await this.post<SocialComposeResponse>(
      this.config.socialEndpoint,
      request,
      idempotencyKey,
    );

    const verified = await this.verifySocialSchedule(response.social_post_id);
    if (verified.status !== 'scheduled') {
      throw new Error(`Social post ${response.social_post_id} not in scheduled state: ${verified.status}`);
    }

    log.info('social_scheduled', {
      postId: response.social_post_id,
      author: request.author,
      publishAt: response.publish_at,
      targetProfile: response.target_profile,
    });

    return response;
  }

  private async verifyInsightsSchedule(postId: string): Promise<InsightsScheduleResponse> {
    const baseUrl = this.config.insightsEndpoint.replace(/\/schedule$/, '');
    return this.get<InsightsScheduleResponse>(`${baseUrl}/schedule/${postId}`);
  }

  private async verifySocialSchedule(postId: string): Promise<SocialComposeResponse> {
    const baseUrl = this.config.socialEndpoint.replace(/\/compose$/, '');
    return this.get<SocialComposeResponse>(`${baseUrl}/${postId}`);
  }

  private async post<T>(url: string, body: unknown, idempotencyKey: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiToken}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        });

        if (resp.status === 400 || resp.status === 401 || resp.status === 409) {
          const text = await resp.text();
          throw new Error(`OWnet ${resp.status}: ${text}`);
        }

        if (resp.status === 429 || resp.status >= 500) {
          const text = await resp.text();
          lastError = new Error(`OWnet ${resp.status}: ${text}`);
          if (attempt < MAX_RETRIES) {
            const delay = BACKOFF_MS * Math.pow(2, attempt);
            log.warn('ownet_retry', { url, status: resp.status, attempt, delayMs: delay });
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw lastError;
        }

        return (await resp.json()) as T;
      } catch (err) {
        if (err instanceof Error && (err.message.includes('OWnet 4') || err.message.includes('OWnet 409'))) {
          throw err;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, BACKOFF_MS));
        }
      }
    }

    throw lastError || new Error('OWnet request failed');
  }

  private async get<T>(url: string): Promise<T> {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OWnet GET ${resp.status}: ${text}`);
    }

    return (await resp.json()) as T;
  }
}
