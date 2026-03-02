/**
 * Slack Message Handler for OWnet
 * 
 * Processes Slack messages and calls OWnet agent
 */

import { Pool } from 'pg';
import { postMessage, postMessageWithBlocks, addReaction, uploadFile, getUserInfo } from './slack-client';
import { markdownToSlack, createSlackBlocks, isResponseTooLong, truncateForSlack, formatSourcesForSlack } from './slack-formatter';

let pool: Pool | null = null;
let tablesInitialized = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

async function ensureSlackTables() {
  if (tablesInitialized) return;
  const db = getPool();
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS "SlackUser" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "slackUserId" TEXT UNIQUE NOT NULL,
        "slackTeamId" TEXT NOT NULL,
        "slackUserName" TEXT,
        "slackUserEmail" TEXT,
        "ownetUserId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS "SlackSession" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "slackUserId" TEXT NOT NULL REFERENCES "SlackUser"(id) ON DELETE CASCADE,
        "slackChannelId" TEXT NOT NULL,
        "slackThreadTs" TEXT,
        "ownetSessionId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("slackUserId", "slackThreadTs")
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS "SlackMessageLog" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "slackUserId" TEXT NOT NULL REFERENCES "SlackUser"(id),
        "slackChannelId" TEXT NOT NULL,
        "slackThreadTs" TEXT,
        "slackMessageTs" TEXT NOT NULL,
        question TEXT NOT NULL,
        response TEXT,
        "responseTime" INTEGER,
        error TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    tablesInitialized = true;
    console.log('[Slack] Database tables initialized successfully');
  } catch (error) {
    console.error('[Slack] Error initializing tables:', error);
    throw error;
  }
}

const SLACK_SERVICE_USER_EMAIL = 'slack-bot@opticwise.com';
let serviceUserId: string | null = null;

/**
 * Get or create a service user in the User table for Slack sessions.
 * AgentChatSession requires a User.id foreign key, so all Slack
 * conversations use this shared service account.
 */
async function getServiceUserId(): Promise<string> {
  if (serviceUserId) return serviceUserId;
  const db = getPool();

  const existing = await db.query(
    'SELECT id FROM "User" WHERE email = $1',
    [SLACK_SERVICE_USER_EMAIL]
  );

  if (existing.rows.length > 0) {
    serviceUserId = existing.rows[0].id;
    return serviceUserId!;
  }

  const result = await db.query(
    `INSERT INTO "User" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, 'OWnet Slack Bot', 'SERVICE_ACCOUNT_NO_LOGIN', 'service', true, NOW(), NOW())
     RETURNING id`,
    [SLACK_SERVICE_USER_EMAIL]
  );

  serviceUserId = result.rows[0].id;
  console.log('[Slack] Created service user:', serviceUserId);
  return serviceUserId!;
}

/**
 * Get or create Slack user in database
 */
async function getOrCreateSlackUser(slackUserId: string, slackTeamId: string): Promise<string> {
  await ensureSlackTables();
  const db = getPool();
  
  const existing = await db.query(
    'SELECT id FROM "SlackUser" WHERE "slackUserId" = $1',
    [slackUserId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  try {
    const userInfo = await getUserInfo(slackUserId);
    
    const result = await db.query(
      `INSERT INTO "SlackUser" (id, "slackUserId", "slackTeamId", "slackUserName", "slackUserEmail")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       RETURNING id`,
      [slackUserId, slackTeamId, userInfo.name, userInfo.email]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('[Slack] Error getting user info, creating without:', error);
    
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
  
  // Use the service user for AgentChatSession (requires User table FK)
  const svcUserId = await getServiceUserId();
  
  const sessionResult = await db.query(
    `INSERT INTO "AgentChatSession" ("userId", title)
     VALUES ($1, 'Slack Conversation')
     RETURNING id`,
    [svcUserId]
  );
  
  const ownetSessionId = sessionResult.rows[0].id;
  
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
async function callOWnetAgent(message: string, sessionId: string, slackUserId?: string): Promise<{
  response: string;
  sources?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const port = process.env.PORT || '3000';
    const baseUrl = `http://localhost:${port}`;
    const internalKey = process.env.AUTH_SECRET;
    
    console.log(`[Slack] Calling OWnet API at ${baseUrl}/api/ownet/chat`, {
      hasInternalKey: !!internalKey,
      hasSlackUserId: !!slackUserId
    });
    
    if (!internalKey) {
      console.warn('[Slack] AUTH_SECRET not set - OWnet API call will fail without authentication');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (internalKey) {
      headers['x-internal-api-key'] = internalKey;
    }
    if (slackUserId) {
      headers['x-slack-user-id'] = slackUserId;
    }
    
    const response = await fetch(`${baseUrl}/api/ownet/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        sessionId
      })
    });
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unable to read body');
      console.error(`[Slack] OWnet API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`OWnet API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    
    console.log('[Slack] OWnet API responded with status:', response.status);
    
    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    let fullResponse = '';
    let sources: Record<string, unknown> | undefined = undefined;
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
    const result = await callOWnetAgent(question, sessionId, slackUserId);
    
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
