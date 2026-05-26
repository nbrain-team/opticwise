import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';
import { setRunId, createLogger } from './util/logger.js';
import { isDenverWednesday8PM, denverDateString, nextFriday845Denver, nextMonday845Denver } from './util/timezone.js';
import { getAuthClient, verifyAuth } from './google/auth.js';
import { getGmailClient } from './google/gmail.js';
import { getDriveClient, getDocsClient } from './google/drive.js';
import { createClaudeClient } from './claude/client.js';
import { loadSystemPrompts } from './claude/system-loader.js';
import { readInboxEmails } from './modules/inbox-reader.js';
import { extractSources } from './modules/source-extractor.js';
import { detectTrends } from './modules/trend-detector.js';
import { generateBriefing } from './modules/briefing-generator.js';
import { generateAuthorPackage } from './modules/package-generator.js';
import { buildContentSummary } from './modules/content-summary.js';
import { generateImages } from './modules/image-generator.js';
import { writeToDrive } from './modules/drive-writer.js';
import { OWnetClient } from './ownet/client.js';
import { scheduleInsightsPost } from './modules/ownet-insights-scheduler.js';
import { scheduleSocialPost } from './modules/ownet-social-scheduler.js';
import { archiveProcessedEmails } from './modules/email-archiver.js';
import { sendSlackNotification } from './modules/notifier.js';
import { markdownToInsightsHtml } from './render/markdown-to-insights-html.js';
import type { RunResult, ScheduledPost, ScheduledSocialPost, DriveAsset } from './types/run.js';
import type { AuthorPackage } from './types/package.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.resolve(__dirname, '..', 'prompts');
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

const log = createLogger('orchestrator');

async function main(): Promise<void> {
  const startTime = Date.now();

  // Guard: only run on Wednesday 8 PM Denver (for scheduled triggers)
  if (process.env.GITHUB_EVENT_NAME === 'schedule' && !isDenverWednesday8PM()) {
    log.info('wrong_season_exit', { reason: 'Not Wednesday 8 PM Denver — exiting early' });
    process.exit(0);
  }

  const config = loadConfig();
  setRunId(config.runId);
  log.info('engine_start', { runId: config.runId, isDryRun: config.isDryRun });

  const tokenUsage = { inputTokens: 0, outputTokens: 0 };
  const errors: string[] = [];
  const scheduledInsights: ScheduledPost[] = [];
  const scheduledSocial: ScheduledSocialPost[] = [];
  let driveAssets: DriveAsset[] = [];
  let emailsArchived = 0;

  try {
    // 1. Auth
    const auth = getAuthClient(config.googleSaClientEmail, config.googleSaPrivateKey);
    await verifyAuth(auth);
    const gmail = getGmailClient(auth);
    const drive = getDriveClient(auth);
    const docs = getDocsClient(auth);
    const claude = createClaudeClient(config.anthropicApiKey);
    log.info('auth_complete');

    // 2. Read inbox
    const emails = await readInboxEmails(gmail, config.gmailLabel);
    const date = denverDateString(new Date());

    // 3. Extract sources
    const systemPromptHaiku = loadSystemPrompts(PROMPTS_DIR);
    const sources = await extractSources(claude, emails, systemPromptHaiku);

    // 4. Detect trends
    const systemPromptOpus = loadSystemPrompts(PROMPTS_DIR);
    const { result: trends, inputTokens: trendIn, outputTokens: trendOut } =
      await detectTrends(claude, emails, sources, systemPromptOpus);
    tokenUsage.inputTokens += trendIn;
    tokenUsage.outputTokens += trendOut;

    // 5. Generate briefing
    const briefing = await generateBriefing(claude, date, emails, trends, systemPromptOpus);
    tokenUsage.inputTokens += briefing.inputTokens;
    tokenUsage.outputTokens += briefing.outputTokens;

    // 6. Generate author packages
    const packages: AuthorPackage[] = [];

    const billSystemPrompt = loadSystemPrompts(PROMPTS_DIR, 'bill');
    const billResult = await generateAuthorPackage(
      claude, 'bill', trends.billTrend, emails, sources, billSystemPrompt,
    );
    packages.push(billResult.package);
    tokenUsage.inputTokens += billResult.inputTokens;
    tokenUsage.outputTokens += billResult.outputTokens;

    const drewSystemPrompt = loadSystemPrompts(PROMPTS_DIR, 'drew');
    const drewResult = await generateAuthorPackage(
      claude, 'drew', trends.drewTrend, emails, sources, drewSystemPrompt,
    );
    packages.push(drewResult.package);
    tokenUsage.inputTokens += drewResult.inputTokens;
    tokenUsage.outputTokens += drewResult.outputTokens;

    // 7. Generate images
    const tmpDir = path.join(os.tmpdir(), `content-engine-${config.runId}`);
    const imageRequests = packages.flatMap((pkg) => [
      {
        prompt: pkg.metadata.featureImagePrompt,
        width: 1920,
        height: 1080,
        fileName: `${date}-${pkg.author}-${pkg.slug}.png`,
      },
      {
        prompt: pkg.metadata.ogImagePrompt,
        width: 1200,
        height: 630,
        fileName: `${date}-${pkg.author}-${pkg.slug}-og.png`,
      },
    ]);
    const images = await generateImages(config.imageApiKey, imageRequests, tmpDir);
    const missingImages = images.filter((i) => !i.ok);
    if (missingImages.length > 0) {
      for (const img of missingImages) {
        errors.push(`Image missing: ${img.fileName} — ${img.error}`);
      }
    }

    // 8. Build content summary
    const publishTimes = {
      drewBlog: nextFriday845Denver(new Date()),
      billBlog: nextMonday845Denver(new Date()),
      drewSocial: nextFriday845Denver(new Date()),
      billSocial: nextMonday845Denver(new Date()),
    };

    const estimatedCost =
      (tokenUsage.inputTokens / 1_000_000) * 15 +
      (tokenUsage.outputTokens / 1_000_000) * 75;

    const summary = buildContentSummary({
      date,
      runId: config.runId,
      emails,
      trends,
      packages,
      driveFileList: [],
      publishTimes,
      tokenUsage: { ...tokenUsage, estimatedCostUsd: estimatedCost },
      durationMs: Date.now() - startTime,
    });

    // 9. Write to Drive
    try {
      driveAssets = await writeToDrive({
        drive,
        docs,
        masterFolderId: config.driveMasterFolderId,
        date,
        packages,
        briefing: { title: briefing.title, body: briefing.body },
        summary,
        images,
        runSummary: summary.body,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Drive write failed: ${msg}`);
      log.error('drive_write_failed', err instanceof Error ? err : new Error(msg));

      // Save artifacts locally for GH Actions upload
      const artifactDir = path.resolve('artifacts');
      fs.mkdirSync(artifactDir, { recursive: true });
      for (const pkg of packages) {
        fs.writeFileSync(
          path.join(artifactDir, `${date}-${pkg.author}-${pkg.slug}.md`),
          pkg.blogMarkdown,
        );
      }
      fs.writeFileSync(path.join(artifactDir, `${date}-briefing.md`), briefing.body);
      fs.writeFileSync(path.join(artifactDir, `${date}-summary.md`), summary.body);
    }

    // 10. Schedule OWnet insights posts (only if Drive succeeded)
    if (driveAssets.length > 0 && !config.isDryRun) {
      const ownet = new OWnetClient({
        insightsEndpoint: config.ownetInsightsEndpoint,
        socialEndpoint: config.ownetSocialEndpoint,
        apiToken: config.ownetApiToken,
      });

      for (const pkg of packages) {
        const publishAt = pkg.author === 'drew' ? publishTimes.drewBlog : publishTimes.billBlog;
        const blogHtml = markdownToInsightsHtml(pkg.blogMarkdown, pkg.metadata, pkg.author, TEMPLATES_DIR);

        try {
          const result = await scheduleInsightsPost(
            ownet, pkg, publishAt, config.runId, driveAssets, blogHtml,
          );
          scheduledInsights.push({
            scheduledPostId: result.scheduled_post_id,
            status: 'scheduled',
            publishAt: result.publish_at,
            editUrl: result.edit_url,
            previewUrl: result.preview_url,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Insights schedule failed for ${pkg.author}: ${msg}`);
          log.error('insights_schedule_failed', err instanceof Error ? err : new Error(msg), {
            author: pkg.author,
          });
        }
      }

      // 11. Schedule social posts (only if insights succeeded)
      if (scheduledInsights.length === packages.length) {
        for (const pkg of packages) {
          const publishAt = pkg.author === 'drew' ? publishTimes.drewSocial : publishTimes.billSocial;
          const insightPost = scheduledInsights.find((s) =>
            s.scheduledPostId.includes(pkg.author),
          );

          try {
            const result = await scheduleSocialPost(
              ownet, pkg, publishAt, config.runId, insightPost?.scheduledPostId || '',
            );
            scheduledSocial.push({
              socialPostId: result.social_post_id,
              status: 'scheduled',
              publishAt: result.publish_at,
              channel: result.channel,
              targetProfile: result.target_profile,
              editUrl: result.edit_url,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Social schedule failed for ${pkg.author}: ${msg}`);
          }
        }
      } else {
        errors.push('Skipping social scheduling — insights schedule incomplete');
      }

      // 12. Archive emails (only if Drive + insights both succeeded)
      if (
        driveAssets.length > 0 &&
        scheduledInsights.length === packages.length &&
        !config.isDryRun
      ) {
        const archiveResult = await archiveProcessedEmails(gmail, config.gmailLabel, emails, {
          driveDocsVerified: true,
          driveImagesVerified: missingImages.length === 0,
          insightsScheduled: true,
        });
        emailsArchived = archiveResult.archived;
      }
    }

    // 13. Build run result
    const runResult: RunResult = {
      runId: config.runId,
      date,
      emailsProcessed: emails.length,
      trends,
      packages,
      briefing: { title: briefing.title, body: briefing.body },
      summary,
      driveAssets,
      scheduledInsights,
      scheduledSocial,
      emailsArchived,
      errors,
      durationMs: Date.now() - startTime,
      tokenUsage: { ...tokenUsage, estimatedCostUsd: estimatedCost },
    };

    // 14. Notify
    await sendSlackNotification(config.slackBotToken, config.slackNotifyChannelId, runResult);

    log.info('engine_complete', {
      duration_ms: runResult.durationMs,
      emailsProcessed: runResult.emailsProcessed,
      driveAssets: runResult.driveAssets.length,
      insightsScheduled: runResult.scheduledInsights.length,
      socialScheduled: runResult.scheduledSocial.length,
      emailsArchived: runResult.emailsArchived,
      errors: runResult.errors.length,
    });

    if (errors.length > 0) {
      process.exit(1);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('engine_fatal', err instanceof Error ? err : new Error(msg));

    try {
      const fatalResult: RunResult = {
        runId: config.runId,
        date: denverDateString(new Date()),
        emailsProcessed: 0,
        trends: { billTrend: {} as never, drewTrend: {} as never, alternatives: [] },
        packages: [],
        briefing: { title: '', body: '' },
        summary: { title: '', body: '' },
        driveAssets: [],
        scheduledInsights: [],
        scheduledSocial: [],
        emailsArchived: 0,
        errors: [msg],
        durationMs: Date.now() - startTime,
        tokenUsage: { ...tokenUsage, estimatedCostUsd: 0 },
      };
      await sendSlackNotification(config.slackBotToken, config.slackNotifyChannelId, fatalResult);
    } catch {
      // last resort
    }

    process.exit(1);
  }
}

main();
