import { WebClient } from '@slack/web-api';
import type { RunResult } from '../types/run.js';
import { formatDenverTime } from '../util/timezone.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('notifier');

export async function sendSlackNotification(
  botToken: string,
  channelId: string,
  result: RunResult,
): Promise<void> {
  const slack = new WebClient(botToken);

  const message = result.errors.length === 0
    ? buildSuccessMessage(result)
    : buildFailureMessage(result);

  try {
    await slack.chat.postMessage({
      channel: channelId,
      text: message,
      mrkdwn: true,
    });
    log.info('slack_notification_sent', { channel: channelId });
  } catch (err) {
    log.error('slack_notification_failed', err instanceof Error ? err : new Error(String(err)));
    await fallbackGitHubIssue(result);
  }
}

function buildSuccessMessage(result: RunResult): string {
  const billPkg = result.packages.find((p) => p.author === 'bill');
  const drewPkg = result.packages.find((p) => p.author === 'drew');
  const billInsight = result.scheduledInsights.find((s) => s.scheduledPostId.includes('bill'));
  const drewInsight = result.scheduledInsights.find((s) => s.scheduledPostId.includes('drew'));

  const lines = [
    `Content engine — ${result.date} ✓`,
    `• ${result.emailsProcessed} emails processed`,
    `• Drive: My Drive/201 - OW Blog (Insights)/${result.date}/ (${result.driveAssets.length} assets)`,
  ];

  if (billPkg) {
    const publishAt = billInsight?.publishAt
      ? formatDenverTime(billInsight.publishAt)
      : 'schedule pending';
    lines.push(`• Bill blog: "${billPkg.metadata.title}"`);
    lines.push(`   → publishes ${publishAt}`);
  }

  if (drewPkg) {
    const publishAt = drewInsight?.publishAt
      ? formatDenverTime(drewInsight.publishAt)
      : 'schedule pending';
    lines.push(`• Drew blog: "${drewPkg.metadata.title}"`);
    lines.push(`   → publishes ${publishAt}`);
  }

  const socialStatus = result.scheduledSocial.length > 0
    ? `scheduled (${result.scheduledSocial.map((s) => `${s.targetProfile.replace('linkedin:', '')} ${formatDenverTime(s.publishAt).split(' ')[0]}`).join(', ')})`
    : 'pending';
  lines.push(`• LinkedIn shorts: ${socialStatus}`);
  lines.push(`• LinkedIn newsletter articles → in Drive doc for Roxy to post manually`);
  lines.push(`• Gmail: ${result.emailsArchived} emails archived`);
  lines.push(`• Run time: ${(result.durationMs / 1000 / 60).toFixed(0)}m ${((result.durationMs / 1000) % 60).toFixed(0)}s`);
  lines.push(`• Tokens: ${result.tokenUsage.inputTokens.toLocaleString()} in / ${result.tokenUsage.outputTokens.toLocaleString()} out (~$${result.tokenUsage.estimatedCostUsd.toFixed(2)})`);
  lines.push(`• Review window: edit/cancel before scheduled publish at OWnet`);

  return lines.join('\n');
}

function buildFailureMessage(result: RunResult): string {
  const lines = [
    `Content engine — ${result.date} ✗ FAILED`,
    '',
    `Errors:`,
    ...result.errors.map((e) => `• ${e}`),
    '',
    `Run ID: ${result.runId}`,
    `Duration: ${(result.durationMs / 1000 / 60).toFixed(1)} minutes`,
  ];

  if (result.driveAssets.length > 0) {
    lines.push(`Drive assets saved: ${result.driveAssets.length}`);
  }
  if (result.scheduledInsights.length > 0) {
    lines.push(`Insights posts scheduled: ${result.scheduledInsights.length}`);
  }

  return lines.join('\n');
}

async function fallbackGitHubIssue(result: RunResult): Promise<void> {
  log.warn('github_issue_fallback_not_implemented');
}
