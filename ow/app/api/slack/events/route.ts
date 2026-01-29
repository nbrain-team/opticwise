/**
 * Slack Events API Endpoint
 * 
 * Handles incoming Slack events (mentions, messages, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { handleAppMention, handleDirectMessage } from '@/lib/slack-handler';

// Configure route for long-running operations
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

/**
 * Verify Slack request signature
 */
function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  
  if (!signingSecret) {
    console.error('SLACK_SIGNING_SECRET not configured');
    return false;
  }
  
  // Check timestamp to prevent replay attacks (within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);
  
  if (Math.abs(currentTime - requestTime) > 300) {
    console.error('Slack request timestamp too old');
    return false;
  }
  
  // Compute expected signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const expectedSignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');
  
  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

/**
 * POST /api/slack/events
 * 
 * Webhook endpoint for Slack events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const slackSignature = request.headers.get('x-slack-signature');
    const slackTimestamp = request.headers.get('x-slack-request-timestamp');
    
    // Verify signature
    if (!slackSignature || !slackTimestamp) {
      console.error('Missing Slack signature headers');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!verifySlackSignature(body, slackTimestamp, slackSignature)) {
      console.error('Invalid Slack signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse event
    const event = JSON.parse(body);
    
    // Handle URL verification challenge (Slack setup)
    if (event.type === 'url_verification') {
      return NextResponse.json({ challenge: event.challenge });
    }
    
    // Handle event callback
    if (event.type === 'event_callback') {
      const slackEvent = event.event;
      
      // Ignore bot messages to prevent loops
      if (slackEvent.bot_id || slackEvent.subtype === 'bot_message') {
        return NextResponse.json({ ok: true });
      }
      
      // Handle different event types
      switch (slackEvent.type) {
        case 'app_mention':
          // @ownet was mentioned
          console.log('[Slack] App mention received:', slackEvent.text);
          
          // Process asynchronously (don't block Slack)
          handleAppMention({
            user: slackEvent.user,
            text: slackEvent.text,
            channel: slackEvent.channel,
            ts: slackEvent.ts,
            thread_ts: slackEvent.thread_ts,
            team: event.team_id
          }).catch(error => {
            console.error('[Slack] Error handling app mention:', error);
          });
          
          break;
        
        case 'message':
          // Direct message to bot
          if (slackEvent.channel_type === 'im') {
            console.log('[Slack] Direct message received');
            
            handleDirectMessage({
              user: slackEvent.user,
              text: slackEvent.text,
              channel: slackEvent.channel,
              ts: slackEvent.ts,
              team: event.team_id
            }).catch(error => {
              console.error('[Slack] Error handling DM:', error);
            });
          }
          break;
        
        default:
          console.log('[Slack] Unhandled event type:', slackEvent.type);
      }
      
      // Respond immediately to Slack (required within 3 seconds)
      return NextResponse.json({ ok: true });
    }
    
    // Unknown event type
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('[Slack] Error processing event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/slack/events
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'OWnet Slack Integration',
    timestamp: new Date().toISOString()
  });
}
