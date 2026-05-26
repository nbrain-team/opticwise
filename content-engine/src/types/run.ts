import type { AuthorPackage } from './package.js';
import type { TrendDetectionResult } from './trend.js';
import type { InboxEmail } from './email.js';

export interface RunContext {
  runId: string;
  date: string;
  startedAt: Date;
}

export interface ScheduledPost {
  scheduledPostId: string;
  status: 'scheduled' | 'published' | 'cancelled';
  publishAt: string;
  editUrl: string;
  previewUrl?: string;
}

export interface ScheduledSocialPost {
  socialPostId: string;
  status: 'scheduled' | 'published' | 'cancelled';
  publishAt: string;
  channel: string;
  targetProfile: string;
  editUrl: string;
}

export interface DriveAsset {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

export interface RunResult {
  runId: string;
  date: string;
  emailsProcessed: number;
  trends: TrendDetectionResult;
  packages: AuthorPackage[];
  briefing: { title: string; body: string };
  summary: { title: string; body: string };
  driveAssets: DriveAsset[];
  scheduledInsights: ScheduledPost[];
  scheduledSocial: ScheduledSocialPost[];
  emailsArchived: number;
  errors: string[];
  durationMs: number;
  tokenUsage: { inputTokens: number; outputTokens: number; estimatedCostUsd: number };
}
