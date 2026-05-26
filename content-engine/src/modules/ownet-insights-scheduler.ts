import type { OWnetClient } from '../ownet/client.js';
import type { AuthorPackage } from '../types/package.js';
import type { DriveAsset } from '../types/run.js';
import type { InsightsScheduleResponse } from '../ownet/types.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('insights-scheduler');

export async function scheduleInsightsPost(
  client: OWnetClient,
  pkg: AuthorPackage,
  publishAt: string,
  runId: string,
  driveAssets: DriveAsset[],
  blogHtml: string,
): Promise<InsightsScheduleResponse> {
  const authorName = pkg.author === 'bill' ? 'Bill Douglas' : 'Drew Hall';
  const idempotencyKey = `${runId}_${pkg.author}`;

  const docAsset = driveAssets.find(
    (a) => a.name.includes(pkg.author) && a.mimeType.includes('document'),
  );
  const heroAsset = driveAssets.find(
    (a) => a.name.includes(pkg.author) && a.name.endsWith('.png') && !a.name.includes('-og'),
  );
  const ogAsset = driveAssets.find(
    (a) => a.name.includes(pkg.author) && a.name.includes('-og.png'),
  );

  return log.timed('schedule_insights', async () => {
    const result = await client.scheduleInsightsPost(
      {
        author: pkg.author,
        author_display_name: authorName,
        title: pkg.metadata.title,
        slug: pkg.slug,
        excerpt: pkg.metadata.excerpt,
        seo_title: pkg.metadata.seoTitle,
        seo_description: pkg.metadata.seoDescription,
        category: pkg.metadata.category,
        tags: pkg.metadata.tags,
        reading_time_minutes: pkg.metadata.readingTimeMinutes,
        publish_at: publishAt,
        body_html: blogHtml,
        feature_image_url: heroAsset?.webViewLink || '',
        og_image_url: ogAsset?.webViewLink || '',
        source_doc_url: docAsset?.webViewLink || '',
        run_id: runId,
      },
      idempotencyKey,
    );

    log.info('insights_post_scheduled', {
      author: pkg.author,
      postId: result.scheduled_post_id,
      publishAt: result.publish_at,
      editUrl: result.edit_url,
    });

    return result;
  }, { author: pkg.author });
}
