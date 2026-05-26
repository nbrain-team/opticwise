/**
 * Converts markdown text to a format suitable for Google Docs API batchUpdate.
 * For the content engine, we insert plain text into Docs since the batchUpdate
 * API for rich formatting is complex. The Drive writer uses insertText which
 * preserves the markdown-formatted text as readable content.
 *
 * Future enhancement: convert markdown to Docs API requests for bold, italic,
 * headings, and hyperlinks.
 */
export function markdownToGdocText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, (match) => match)
    .trim();
}
