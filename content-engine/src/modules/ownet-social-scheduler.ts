import type { OWnetClient } from '../ownet/client.js';
import type { AuthorPackage } from '../types/package.js';
import type { SocialComposeResponse } from '../ownet/types.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('social-scheduler');

const PROFILE_MAP: Record<string, string> = {
  bill: 'linkedin:bill-douglas',
  drew: 'linkedin:drew-hall',
};

export async function scheduleSocialPost(
  client: OWnetClient,
  pkg: AuthorPackage,
  publishAt: string,
  runId: string,
  sourceBlogPostId: string,
): Promise<SocialComposeResponse> {
  const idempotencyKey = `${runId}_${pkg.author}_social`;

  return log.timed('schedule_social', async () => {
    const result = await client.scheduleSocialPost(
      {
        author: pkg.author,
        channel: 'linkedin',
        target_profile: PROFILE_MAP[pkg.author],
        text: pkg.linkedinShortPost.text,
        hashtags: pkg.linkedinShortPost.hashtags,
        publish_at: publishAt,
        source_blog_post_id: sourceBlogPostId,
        run_id: runId,
      },
      idempotencyKey,
    );

    log.info('social_post_scheduled', {
      author: pkg.author,
      postId: result.social_post_id,
      publishAt: result.publish_at,
      profile: result.target_profile,
    });

    return result;
  }, { author: pkg.author });
}
