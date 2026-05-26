export interface InboxEmail {
  threadId: string;
  messageId: string;
  from: string;
  subject: string;
  receivedAt: string;
  bodyPlaintext: string;
  bodyHtml: string | null;
  extractedLinks: string[];
}
