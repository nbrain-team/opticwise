/**
 * Slack Message Formatter
 * 
 * Converts OWnet markdown responses to Slack-compatible format
 */

import { Block, KnownBlock } from '@slack/web-api';

/**
 * Convert markdown to Slack mrkdwn format
 */
export function markdownToSlack(markdown: string): string {
  let slack = markdown;
  
  // Headers: ## Heading → *Heading*
  slack = slack.replace(/^#{1,3}\s+(.+)$/gm, '*$1*');
  
  // Bold: **text** → *text* (Slack uses single asterisks)
  slack = slack.replace(/\*\*(.+?)\*\*/g, '*$1*');
  
  // Italic: *text* → _text_ (Slack uses underscores)
  slack = slack.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '_$1_');
  
  // Code: `code` → `code` (same)
  // Already compatible
  
  // Blockquotes: > text → > text (same)
  // Already compatible
  
  // Horizontal rules: --- → ─────────
  slack = slack.replace(/^---+$/gm, '─'.repeat(40));
  
  // Links: [text](url) → <url|text>
  slack = slack.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');
  
  // Lists: - item → • item (use bullet emoji)
  slack = slack.replace(/^-\s+/gm, '• ');
  
  // Numbered lists: 1. item → 1. item (same)
  // Already compatible
  
  return slack;
}

/**
 * Create Slack blocks for rich formatting
 */
export function createSlackBlocks(response: string): (Block | KnownBlock)[] {
  const blocks: (Block | KnownBlock)[] = [];
  
  // Split response into sections
  const sections = response.split(/\n\n+/);
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    // Check if it's a header
    if (trimmed.startsWith('##')) {
      const headerText = trimmed.replace(/^#{1,3}\s+/, '');
      blocks.push({
        type: 'header',
        text: {
          type: 'plain_text',
          text: headerText.substring(0, 150), // Slack header limit
          emoji: true
        }
      });
      continue;
    }
    
    // Check if it's a horizontal rule
    if (trimmed.match(/^-{3,}$/)) {
      blocks.push({
        type: 'divider'
      });
      continue;
    }
    
    // Check if it's a blockquote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `_${quoteText}_`
        }
      });
      continue;
    }
    
    // Regular text section
    const slackText = markdownToSlack(trimmed);
    
    // Split long sections (Slack has 3000 char limit per block)
    if (slackText.length > 2900) {
      const chunks = slackText.match(/.{1,2900}(\n|$)/g) || [slackText];
      chunks.forEach(chunk => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: chunk.trim()
          }
        });
      });
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: slackText
        }
      });
    }
  }
  
  // Slack has a 50 block limit
  if (blocks.length > 50) {
    return blocks.slice(0, 50);
  }
  
  return blocks;
}

/**
 * Format source citations for Slack
 */
export function formatSourcesForSlack(sources: Record<string, unknown>): string {
  const sourcesArray = sources.sources as Record<string, unknown>[] | undefined;
  
  if (!sources || !sourcesArray || !Array.isArray(sourcesArray) || sourcesArray.length === 0) {
    return '';
  }
  
  let formatted = '\n\n─'.repeat(20) + '\n\n';
  formatted += `*Sources* (${sourcesArray.length} total)\n\n`;
  
  // Group by type
  const grouped: Record<string, Record<string, unknown>[]> = {};
  sourcesArray.forEach((source: Record<string, unknown>) => {
    const type = (source.type as string) || 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(source);
  });
  
  // Format each type (no emojis)
  const typeLabels: Record<string, string> = {
    transcript: 'Transcript',
    email: 'Email',
    crm: 'CRM',
    calendar: 'Calendar',
    drive: 'Document'
  };
  
  Object.entries(grouped).forEach(([type, items]) => {
    const label = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
    formatted += `*${label}s:* ${items.length}\n`;
  });
  
  formatted += `\n_Query type: ${sources.queryClassification || 'general'}_`;
  
  return formatted;
}

/**
 * Create progress message blocks
 */
export function createProgressBlocks(message: string): (Block | KnownBlock)[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message
      }
    }
  ];
}

/**
 * Create error message blocks
 */
export function createErrorBlocks(error: string): (Block | KnownBlock)[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ *Error*\n${error}`
      }
    }
  ];
}

/**
 * Check if response is too long for Slack
 * Slack message limit: 40,000 characters
 * Slack blocks limit: 50 blocks
 */
export function isResponseTooLong(response: string): boolean {
  return response.length > 35000; // Leave buffer
}

/**
 * Truncate response for Slack with option to download full version
 */
export function truncateForSlack(response: string, maxLength: number = 35000): {
  truncated: string;
  isTruncated: boolean;
  fullLength: number;
} {
  if (response.length <= maxLength) {
    return {
      truncated: response,
      isTruncated: false,
      fullLength: response.length
    };
  }
  
  // Find a good breaking point (end of paragraph)
  const breakPoint = response.lastIndexOf('\n\n', maxLength);
  const truncateAt = breakPoint > maxLength - 1000 ? breakPoint : maxLength;
  
  const truncated = response.substring(0, truncateAt) + 
    '\n\n─'.repeat(20) + 
    '\n\n_Response truncated due to length. Full response available as file attachment._';
  
  return {
    truncated,
    isTruncated: true,
    fullLength: response.length
  };
}
