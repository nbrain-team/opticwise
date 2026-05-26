import type { InboxEmail } from '../types/email.js';
import type { TrendDetectionResult } from '../types/trend.js';
import type { AuthorPackage } from '../types/package.js';

interface SummaryInput {
  date: string;
  runId: string;
  emails: InboxEmail[];
  trends: TrendDetectionResult;
  packages: AuthorPackage[];
  driveFileList: Array<{ name: string; id: string }>;
  publishTimes: {
    drewBlog: string;
    billBlog: string;
    drewSocial: string;
    billSocial: string;
  };
  tokenUsage: { inputTokens: number; outputTokens: number; estimatedCostUsd: number };
  durationMs: number;
}

export function buildContentSummary(input: SummaryInput): { title: string; body: string } {
  const lines: string[] = [];

  lines.push(`# Content Summary — ${input.date}`);
  lines.push('');
  lines.push(`**Run ID:** ${input.runId}`);
  lines.push(`**Run Duration:** ${(input.durationMs / 1000 / 60).toFixed(1)} minutes`);
  lines.push('');

  lines.push('## Emails Processed');
  lines.push('');
  lines.push(`Total: ${input.emails.length}`);
  if (input.emails.length > 0 && input.emails.length % 25 === 0) {
    lines.push('⚠️ Pagination boundary warning — count is a multiple of 25, spot-check completeness.');
  }
  lines.push('');

  lines.push('## Trends Selected');
  lines.push('');
  lines.push(`### Bill: ${input.trends.billTrend.title}`);
  lines.push(`- Lane: ${input.trends.billTrend.lane}`);
  lines.push(`- Sources: ${input.trends.billTrend.supportingSourceIds.length}`);
  lines.push(`- Implication: ${input.trends.billTrend.ownerImplication}`);
  lines.push('');
  lines.push(`### Drew: ${input.trends.drewTrend.title}`);
  lines.push(`- Lane: ${input.trends.drewTrend.lane}`);
  lines.push(`- Sources: ${input.trends.drewTrend.supportingSourceIds.length}`);
  lines.push(`- Implication: ${input.trends.drewTrend.ownerImplication}`);
  lines.push('');

  if (input.trends.alternatives?.length) {
    lines.push('## Alternatives Set Aside');
    lines.push('');
    for (const alt of input.trends.alternatives) {
      lines.push(`- **${alt.title}** (${alt.lane}): ${alt.reasonSetAside}`);
    }
    lines.push('');
  }

  lines.push('## Content Produced');
  lines.push('');
  for (const pkg of input.packages) {
    lines.push(`### ${pkg.author === 'bill' ? 'Bill Douglas' : 'Drew Hall'}: "${pkg.metadata.title}"`);
    lines.push(`- Slug: ${pkg.slug}`);
    lines.push(`- Blog: ${pkg.blogWordCount} words`);
    lines.push(`- LinkedIn Article: ${pkg.linkedinArticleWordCount} words`);
    lines.push(`- Category: ${pkg.metadata.category}`);
    lines.push(`- Tags: ${pkg.metadata.tags.join(', ')}`);
    lines.push('');
  }

  lines.push('## Files Saved to Drive');
  lines.push('');
  for (const file of input.driveFileList) {
    lines.push(`- ${file.name} (${file.id})`);
  }
  lines.push('');

  lines.push('## Scheduled Publish Times');
  lines.push('');
  lines.push(`- Drew's blog: ${input.publishTimes.drewBlog}`);
  lines.push(`- Drew's LinkedIn short: ${input.publishTimes.drewSocial}`);
  lines.push(`- Bill's blog: ${input.publishTimes.billBlog}`);
  lines.push(`- Bill's LinkedIn short: ${input.publishTimes.billSocial}`);
  lines.push('');

  lines.push('## Token Usage');
  lines.push('');
  lines.push(`- Input tokens: ${input.tokenUsage.inputTokens.toLocaleString()}`);
  lines.push(`- Output tokens: ${input.tokenUsage.outputTokens.toLocaleString()}`);
  lines.push(`- Estimated cost: $${input.tokenUsage.estimatedCostUsd.toFixed(2)}`);

  return {
    title: `Content Summary — ${input.date}`,
    body: lines.join('\n'),
  };
}
