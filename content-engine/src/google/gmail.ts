import { google, gmail_v1 } from 'googleapis';
import type { JWT } from 'googleapis-common';
import type { InboxEmail } from '../types/email.js';
import { createLogger } from '../util/logger.js';

const log = createLogger('gmail');

export function getGmailClient(auth: JWT): gmail_v1.Gmail {
  return google.gmail({ version: 'v1', auth });
}

export async function getLabelId(
  gmail: gmail_v1.Gmail,
  labelName: string,
): Promise<string> {
  const resp = await gmail.users.labels.list({ userId: 'me' });
  const label = resp.data.labels?.find(
    (l) => l.name === labelName || l.name?.endsWith(`/${labelName}`),
  );
  if (!label?.id) {
    throw new Error(`Gmail label "${labelName}" not found`);
  }
  return label.id;
}

export async function readInbox(
  gmail: gmail_v1.Gmail,
  labelId: string,
): Promise<InboxEmail[]> {
  const collected: Array<{ id: string; threadId: string }> = [];
  let pageToken: string | undefined;

  do {
    const list = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [labelId],
      maxResults: 100,
      pageToken,
    });

    for (const m of list.data.messages || []) {
      if (m.id && m.threadId) {
        collected.push({ id: m.id, threadId: m.threadId });
      }
    }
    pageToken = list.data.nextPageToken ?? undefined;
  } while (pageToken);

  log.info('inbox_scan_complete', {
    total: collected.length,
    pagination_boundary_warning: collected.length > 0 && collected.length % 25 === 0,
  });

  const emails: InboxEmail[] = [];
  let failures = 0;

  for (const { id, threadId } of collected) {
    try {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      });

      const headers = msg.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const { plaintext, html } = extractBodies(msg.data.payload);
      const links = extractLinks(plaintext + (html || ''));

      emails.push({
        threadId,
        messageId: id,
        from: getHeader('From'),
        subject: getHeader('Subject'),
        receivedAt: getHeader('Date') || new Date().toISOString(),
        bodyPlaintext: plaintext.slice(0, 10_000),
        bodyHtml: html ? html.slice(0, 10_000) : null,
        extractedLinks: links,
      });
    } catch (err) {
      failures++;
      log.error('message_fetch_failed', err instanceof Error ? err : new Error(String(err)), {
        messageId: id,
      });
    }
  }

  const failRate = collected.length > 0 ? failures / collected.length : 0;
  if (failRate > 0.1) {
    throw new Error(
      `Gmail read failure rate ${(failRate * 100).toFixed(1)}% exceeds 10% threshold (${failures}/${collected.length})`,
    );
  }

  return emails;
}

function extractBodies(payload: gmail_v1.Schema$MessagePart | undefined): {
  plaintext: string;
  html: string | null;
} {
  const parts: { plaintext: string[]; html: string[] } = { plaintext: [], html: [] };

  function visit(part: gmail_v1.Schema$MessagePart | undefined): void {
    if (!part) return;

    if (part.body?.data) {
      const decoded = Buffer.from(part.body.data, 'base64').toString('utf-8');
      if (part.mimeType === 'text/plain') {
        parts.plaintext.push(decoded);
      } else if (part.mimeType === 'text/html') {
        parts.html.push(decoded);
      }
    }

    for (const child of part.parts || []) {
      visit(child);
    }
  }

  visit(payload);

  return {
    plaintext: parts.plaintext.join('\n') || parts.html.join('\n').replace(/<[^>]+>/g, ' '),
    html: parts.html.length > 0 ? parts.html.join('\n') : null,
  };
}

function extractLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)>"<]+/g) || [];
  return [...new Set(matches)];
}

export async function archiveThreads(
  gmail: gmail_v1.Gmail,
  labelId: string,
  threadIds: string[],
): Promise<{ archived: number; failed: number }> {
  let archived = 0;
  let failed = 0;

  for (const threadId of threadIds) {
    try {
      await gmail.users.threads.modify({
        userId: 'me',
        id: threadId,
        requestBody: {
          removeLabelIds: ['UNREAD', labelId],
        },
      });
      archived++;
    } catch (err) {
      failed++;
      log.error('thread_archive_failed', err instanceof Error ? err : new Error(String(err)), {
        threadId,
      });
    }
  }

  return { archived, failed };
}
