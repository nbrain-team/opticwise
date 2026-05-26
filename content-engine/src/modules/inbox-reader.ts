import type { gmail_v1 } from 'googleapis';
import type { InboxEmail } from '../types/email.js';
import { getLabelId, readInbox } from '../google/gmail.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('inbox-reader');

export async function readInboxEmails(
  gmail: gmail_v1.Gmail,
  labelName: string,
): Promise<InboxEmail[]> {
  return log.timed('read_inbox', async () => {
    const labelId = await getLabelId(gmail, labelName);
    log.info('label_resolved', { labelName, labelId });

    const emails = await readInbox(gmail, labelId);
    log.info('inbox_read_complete', { count: emails.length });

    if (emails.length === 0) {
      throw new Error(`No emails found under label "${labelName}"`);
    }

    return emails;
  });
}
