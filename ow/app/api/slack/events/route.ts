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
    const body = await request.text();
    const slackSignature = request.headers.get('x-slack-signature');
    const slackTimestamp = request.headers.get('x-slack-request-timestamp');
    
    console.log('[Slack] POST /api/slack/events received', {
      hasSignature: !!slackSignature,
      hasTimestamp: !!slackTimestamp,
      bodyLength: body.length,
      bodyPreview: body.substring(0, 200)
    });
    
    if (!slackSignature || !slackTimestamp) {
      console.error('[Slack] Missing signature headers');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!verifySlackSignature(body, slackTimestamp, slackSignature)) {
      console.error('[Slack] Signature verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[Slack] Signature verified successfully');
    
    const event = JSON.parse(body);
    
    if (event.type === 'url_verification') {
      console.log('[Slack] URL verification challenge received');
      return NextResponse.json({ challenge: event.challenge });
    }
    
    if (event.type === 'event_callback') {
      const slackEvent = event.event;
      
      console.log('[Slack] Event callback received:', {
        type: slackEvent.type,
        user: slackEvent.user,
        channel: slackEvent.channel,
        hasBotId: !!slackEvent.bot_id,
        subtype: slackEvent.subtype,
        text: slackEvent.text?.substring(0, 100)
      });
      
      if (slackEvent.bot_id || slackEvent.subtype === 'bot_message') {
        console.log('[Slack] Ignoring bot message to prevent loops');
        return NextResponse.json({ ok: true });
      }
      
      switch (slackEvent.type) {
        case 'app_mention':
          console.log('[Slack] Processing app_mention from user:', slackEvent.user, 'text:', slackEvent.text);
          
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
          if (slackEvent.channel_type === 'im') {
            console.log('[Slack] Processing DM from user:', slackEvent.user);
            
            handleDirectMessage({
              user: slackEvent.user,
              text: slackEvent.text,
              channel: slackEvent.channel,
              ts: slackEvent.ts,
              team: event.team_id
            }).catch(error => {
              console.error('[Slack] Error handling DM:', error);
            });
          } else {
            console.log('[Slack] Ignoring non-DM message event, channel_type:', slackEvent.channel_type);
          }
          break;
        
        default:
          console.log('[Slack] Unhandled event type:', slackEvent.type);
      }
      
      return NextResponse.json({ ok: true });
    }
    
    console.log('[Slack] Unknown top-level event type:', event.type);
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
    timestamp: new Date().toISOString(),
    config: {
      hasSigningSecret: !!process.env.SLACK_SIGNING_SECRET,
      hasBotToken: !!process.env.SLACK_BOT_TOKEN,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || '(not set)',
    }
  });
}
