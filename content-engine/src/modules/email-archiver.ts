import type { gmail_v1 } from 'googleapis';
import type { InboxEmail } from '../types/email.js';
import { getLabelId, archiveThreads } from '../google/gmail.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('email-archiver');

interface ArchivePrecheck {
  driveDocsVerified: boolean;
  driveImagesVerified: boolean;
  insightsScheduled: boolean;
}

export async function archiveProcessedEmails(
  gmail: gmail_v1.Gmail,
  labelName: string,
  emails: InboxEmail[],
  precheck: ArchivePrecheck,
): Promise<{ archived: number; failed: number; skipped: boolean }> {
  if (!precheck.driveDocsVerified) {
    log.warn('archive_skipped_drive_docs_unverified');
    return { archived: 0, failed: 0, skipped: true };
  }

  if (!precheck.insightsScheduled) {
    log.warn('archive_skipped_insights_unscheduled');
    return { archived: 0, failed: 0, skipped: true };
  }

  const labelId = await getLabelId(gmail, labelName);
  const threadIds = [...new Set(emails.map((e) => e.threadId))];

  return log.timed('archive_emails', async () => {
    const result = await archiveThreads(gmail, labelId, threadIds);

    log.info('archive_complete', {
      threads: threadIds.length,
      archived: result.archived,
      failed: result.failed,
    });

    return { ...result, skipped: false };
  });
}
