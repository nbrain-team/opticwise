/**
 * Slack Client for OWnet Integration
 * 
 * Handles Slack API interactions and message posting
 */

import { WebClient } from '@slack/web-api';

let slackClient: WebClient | null = null;

export function getSlackClient(): WebClient {
  if (!slackClient) {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error('SLACK_BOT_TOKEN environment variable is required');
    }
    slackClient = new WebClient(token);
  }
  return slackClient;
}

/**
 * Post a message to Slack
 */
export async function postMessage(
  channel: string,
  text: string,
  threadTs?: string
): Promise<{ ts: string; channel: string }> {
  const client = getSlackClient();
  
  const result = await client.chat.postMessage({
    channel,
    text,
    thread_ts: threadTs, // Reply in thread if provided
    unfurl_links: false,
    unfurl_media: false
  });
  
  return {
    ts: result.ts as string,
    channel: result.channel as string
  };
}

/**
 * Post a message with rich formatting (Slack blocks)
 */
export async function postMessageWithBlocks(
  channel: string,
  text: string,
  blocks: Record<string, unknown>[],
  threadTs?: string
): Promise<{ ts: string; channel: string }> {
  const client = getSlackClient();
  
  const result = await client.chat.postMessage({
    channel,
    text, // Fallback text
    blocks,
    thread_ts: threadTs,
    unfurl_links: false,
    unfurl_media: false
  });
  
  return {
    ts: result.ts as string,
    channel: result.channel as string
  };
}

/**
 * Update an existing message
 */
export async function updateMessage(
  channel: string,
  ts: string,
  text: string,
  blocks?: Record<string, unknown>[]
): Promise<void> {
  const client = getSlackClient();
  
  await client.chat.update({
    channel,
    ts,
    text,
    blocks
  });
}

/**
 * Add emoji reaction to message
 */
export async function addReaction(
  channel: string,
  timestamp: string,
  emoji: string
): Promise<void> {
  const client = getSlackClient();
  
  try {
    await client.reactions.add({
      channel,
      timestamp,
      name: emoji
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
  }
}

/**
 * Get user info from Slack
 */
export async function getUserInfo(userId: string): Promise<{
  id: string;
  name: string;
  email?: string;
  realName?: string;
}> {
  const client = getSlackClient();
  
  const result = await client.users.info({
    user: userId
  });
  
  const user = result.user as Record<string, unknown>;
  
  return {
    id: user.id,
    name: user.name,
    email: user.profile?.email,
    realName: user.real_name || user.profile?.real_name
  };
}

/**
 * Post typing indicator (appears as "OWnet is typing...")
 */
export async function sendTypingIndicator(_channel: string): Promise<void> {
  // Slack doesn't have a direct typing indicator API
  // We can simulate it by posting and updating a message
  // Or just use emoji reactions
}

/**
 * Upload file to Slack (for long reports)
 */
export async function uploadFile(
  channel: string,
  content: string,
  filename: string,
  title: string,
  threadTs?: string
): Promise<void> {
  const client = getSlackClient();
  
  await client.files.uploadV2({
    channel_id: channel,
    file: Buffer.from(content, 'utf-8'),
    filename,
    title,
    thread_ts: threadTs
  });
}
