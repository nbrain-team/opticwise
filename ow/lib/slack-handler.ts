/**
 * Slack Message Handler for OWnet
 * 
 * Processes Slack messages and calls OWnet agent
 */

import { Pool } from 'pg';
import { postMessage, postMessageWithBlocks, addReaction, uploadFile, getUserInfo } from './slack-client';
import { markdownToSlack, createSlackBlocks, isResponseTooLong, truncateForSlack, formatSourcesForSlack } from './slack-formatter';

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

/**
 * Get or create Slack user in database
 */
async function getOrCreateSlackUser(slackUserId: string, slackTeamId: string): Promise<string> {
  const db = getPool();
  
  // Check if user exists
  const existing = await db.query(
    'SELECT id FROM "SlackUser" WHERE "slackUserId" = $1',
    [slackUserId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  // Get user info from Slack
  try {
    const userInfo = await getUserInfo(slackUserId);
    
    // Create new user
    const result = await db.query(
      `INSERT INTO "SlackUser" (id, "slackUserId", "slackTeamId", "slackUserName", "slackUserEmail")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       RETURNING id`,
      [slackUserId, slackTeamId, userInfo.name, userInfo.email]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating Slack user:', error);
    
    // Fallback: create without user info
    const result = await db.query(
      `INSERT INTO "SlackUser" (id, "slackUserId", "slackTeamId")
       VALUES (gen_random_uuid()::text, $1, $2)
       RETURNING id`,
      [slackUserId, slackTeamId]
    );
    
    return result.rows[0].id;
  }
}

/**
 * Get or create OWnet session for Slack thread
 */
async function getOrCreateSession(
  slackUserId: string,
  slackChannelId: string,
  slackThreadTs: string | null
): Promise<string> {
  const db = getPool();
  
  // If thread exists, try to find existing session
  if (slackThreadTs) {
    const existing = await db.query(
      `SELECT "ownetSessionId" FROM "SlackSession" 
       WHERE "slackUserId" = $1 AND "slackThreadTs" = $2`,
      [slackUserId, slackThreadTs]
    );
    
    if (existing.rows.length > 0 && existing.rows[0].ownetSessionId) {
      return existing.rows[0].ownetSessionId;
    }
  }
  
  // Create new OWnet session
  const sessionResult = await db.query(
    `INSERT INTO "AgentChatSession" ("userId", title)
     VALUES ($1, 'Slack Conversation')
     RETURNING id`,
    [slackUserId]
  );
  
  const ownetSessionId = sessionResult.rows[0].id;
  
  // Create or update Slack session mapping
  if (slackThreadTs) {
    await db.query(
      `INSERT INTO "SlackSession" (id, "slackUserId", "slackChannelId", "slackThreadTs", "ownetSessionId")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       ON CONFLICT ("slackUserId", "slackThreadTs") 
       DO UPDATE SET "ownetSessionId" = $4, "updatedAt" = NOW()`,
      [slackUserId, slackChannelId, slackThreadTs, ownetSessionId]
    );
  }
  
  return ownetSessionId;
}

/**
 * Call OWnet agent API
 */
async function callOWnetAgent(message: string, sessionId: string): Promise<{
  response: string;
  sources?: Record<string, unknown>;
  error?: string;
}> {
  try {
    // Call the internal OWnet chat API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/ownet/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId
      })
    });
    
    if (!response.ok) {
      throw new Error(`OWnet API error: ${response.statusText}`);
    }
    
    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    let fullResponse = '';
    let sources: Record<string, unknown> | null = null;
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              fullResponse += data.text;
            } else if (data.type === 'complete') {
              sources = data.sources;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
    
    return {
      response: fullResponse,
      sources
    };
  } catch (error) {
    console.error('Error calling OWnet agent:', error);
    return {
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle Slack app mention event
 */
export async function handleAppMention(event: {
  user: string;
  text: string;
  channel: string;
  ts: string;
  thread_ts?: string;
  team: string;
}): Promise<void> {
  const { user, text, channel, ts, thread_ts, team } = event;
  
  try {
    // Add "eyes" reaction to show we're processing
    await addReaction(channel, ts, 'eyes');
    
    // Extract question (remove @ownet mention)
    const question = text.replace(/<@[A-Z0-9]+>/g, '').trim();
    
    if (!question) {
      await postMessage(
        channel,
        'Hi! Ask me anything about your deals, customers, or business data. For example: "What deals are in the pipeline?" or "Deep analysis of all customer activity"',
        thread_ts || ts
      );
      await addReaction(channel, ts, 'white_check_mark');
      return;
    }
    
    // Get or create user
    const slackUserId = await getOrCreateSlackUser(user, team);
    
    // Get or create session (use thread for conversation continuity)
    const sessionId = await getOrCreateSession(slackUserId, channel, thread_ts || ts);
    
    // Post initial "thinking" message
    await postMessage(
      channel,
      '🔍 Analyzing your question...',
      thread_ts || ts
    );
    
    // Call OWnet agent
    const result = await callOWnetAgent(question, sessionId);
    
    if (result.error) {
      // Update with error
      await postMessage(
        channel,
        `❌ Sorry, I encountered an error: ${result.error}\n\nPlease try again or contact support if the issue persists.`,
        thread_ts || ts
      );
      await addReaction(channel, ts, 'x');
      return;
    }
    
    // Format response for Slack
    let finalResponse = result.response;
    
    // Add source citations if available
    if (result.sources) {
      const sourcesText = formatSourcesForSlack(result.sources);
      if (sourcesText) {
        finalResponse += sourcesText;
      }
    }
    
    // Check if response is too long
    if (isResponseTooLong(finalResponse)) {
      const { truncated, isTruncated, fullLength } = truncateForSlack(finalResponse);
      
      // Post truncated version
      const slackFormatted = markdownToSlack(truncated);
      await postMessage(
        channel,
        slackFormatted,
        thread_ts || ts
      );
      
      // Upload full version as file
      if (isTruncated) {
        await uploadFile(
          channel,
          finalResponse,
          'ownet-response.md',
          `Full Response (${fullLength.toLocaleString()} characters)`,
          thread_ts || ts
        );
      }
    } else {
      // Post normal response
      const slackFormatted = markdownToSlack(finalResponse);
      
      // Try to use blocks for better formatting
      try {
        const blocks = createSlackBlocks(finalResponse);
        if (blocks.length > 0 && blocks.length <= 50) {
          await postMessageWithBlocks(
            channel,
            slackFormatted, // Fallback
            blocks,
            thread_ts || ts
          );
        } else {
          // Fallback to plain text
          await postMessage(channel, slackFormatted, thread_ts || ts);
        }
      } catch (blockError) {
        // Fallback to plain text if blocks fail
        console.error('Error creating blocks, using plain text:', blockError);
        await postMessage(channel, slackFormatted, thread_ts || ts);
      }
    }
    
    // Add checkmark reaction to original message
    await addReaction(channel, ts, 'white_check_mark');
    
  } catch (error) {
    console.error('Error handling Slack mention:', error);
    
    // Post error message
    try {
      await postMessage(
        channel,
        `❌ Sorry, I encountered an unexpected error. Please try again or contact support.`,
        thread_ts || ts
      );
      await addReaction(channel, ts, 'x');
    } catch (postError) {
      console.error('Error posting error message:', postError);
    }
  }
}

/**
 * Handle Slack direct message
 */
export async function handleDirectMessage(event: {
  user: string;
  text: string;
  channel: string;
  ts: string;
  team: string;
}): Promise<void> {
  // Direct messages work the same as mentions, just no @ownet prefix
  await handleAppMention({
    ...event,
    thread_ts: undefined // DMs don't use threads the same way
  });
}
