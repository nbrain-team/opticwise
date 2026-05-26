export function formatLinkedInShortPost(text: string, hashtags: string[]): string {
  const hashtagLine = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  return `${text.trim()}\n\n${hashtagLine}`;
}

export function stripMarkdownForLinkedIn(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .trim();
}
